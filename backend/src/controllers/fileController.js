// backend/src/controllers/fileController.js - WITH NOTIFICATIONS
const File = require('../models/File');
const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');
const cloudinary = require('../config/cloudinary');
const { createAndEmitNotification } = require('../utils/notificationHelper');

// @desc    Upload file
// @route   POST /api/files/upload
// @access  Private (Project members)
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    const { project, description, type, visibility } = req.body;

    // Verify project and membership
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return next(new AppError('Project not found', 404));
    }

    const isMember =
      projectDoc.members.some((m) => m.user.toString() === req.user.id) ||
      projectDoc.owner.toString() === req.user.id;

    if (!isMember) {
      return next(new AppError('Not a project member', 403));
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `projects/${project}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // Create file record
    const file = await File.create({
      filename: req.file.originalname,
      url: result.secure_url,
      cloudinaryId: result.public_id,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user.id,
      project,
      description: description || '',
      type: type || 'document',
      visibility: visibility || 'team',
    });

    await file.populate('uploadedBy', 'firstName lastName avatar');

    // 🔔 Notify project owner (if uploader is not the owner)
    if (projectDoc.owner.toString() !== req.user.id) {
      await createAndEmitNotification({
        recipient: projectDoc.owner,
        sender: req.user.id,
        type: 'file_uploaded',
        title: 'New File Uploaded',
        message: `${req.user.firstName} ${req.user.lastName} uploaded "${req.file.originalname}" to ${projectDoc.title}`,
        link: `/projects/${project}/files`,
        project: project,
      });
    }

    // 🔔 Notify all project members (except uploader and owner)
    const membersToNotify = projectDoc.members
      .map(m => m.user.toString())
      .filter(userId => userId !== req.user.id && userId !== projectDoc.owner.toString());

    for (const memberId of membersToNotify) {
      await createAndEmitNotification({
        recipient: memberId,
        sender: req.user.id,
        type: 'file_uploaded',
        title: 'New File Available',
        message: `${req.user.firstName} uploaded "${req.file.originalname}"`,
        link: `/projects/${project}/files`,
        project: project,
      });
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { file },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update file (mark as deliverable reviewed, etc.)
// @route   PUT /api/files/:id
// @access  Private (Project members)
exports.updateFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return next(new AppError('File not found', 404));
    }

    const project = await Project.findById(file.project);
    const isMember =
      project.members.some((m) => m.user.toString() === req.user.id) ||
      project.owner.toString() === req.user.id;

    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    const { description, type, visibility, deliverableStatus } = req.body;

    const oldStatus = file.deliverableStatus;

    if (description !== undefined) file.description = description;
    if (type) file.type = type;
    if (visibility) file.visibility = visibility;
    if (deliverableStatus) file.deliverableStatus = deliverableStatus;

    await file.save();
    await file.populate('uploadedBy', 'firstName lastName avatar');

    // 🔔 NOTIFICATION: Deliverable submitted
    if (type === 'deliverable' && file.deliverableStatus === 'submitted' && oldStatus !== 'submitted') {
      if (project.owner.toString() !== req.user.id) {
        await createAndEmitNotification({
          recipient: project.owner,
          sender: req.user.id,
          type: 'deliverable_submitted',
          title: 'Deliverable Submitted',
          message: `${req.user.firstName} ${req.user.lastName} submitted a deliverable: "${file.filename}"`,
          link: `/projects/${file.project}/files`,
          project: file.project,
        });
      }
    }

    // 🔔 NOTIFICATION: Deliverable reviewed
    if (deliverableStatus && deliverableStatus !== oldStatus && ['approved', 'rejected', 'needs_revision'].includes(deliverableStatus)) {
      const statusMessages = {
        approved: 'approved',
        rejected: 'rejected',
        needs_revision: 'requested revisions for'
      };

      if (file.uploadedBy.toString() !== req.user.id) {
        await createAndEmitNotification({
          recipient: file.uploadedBy,
          sender: req.user.id,
          type: 'deliverable_reviewed',
          title: `Deliverable ${deliverableStatus === 'approved' ? 'Approved!' : deliverableStatus === 'rejected' ? 'Rejected' : 'Needs Revision'}`,
          message: `${req.user.firstName} ${statusMessages[deliverableStatus]} your deliverable "${file.filename}"`,
          link: `/projects/${file.project}/files`,
          project: file.project,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'File updated successfully',
      data: { file },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private (File uploader or project owner)
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return next(new AppError('File not found', 404));
    }

    const project = await Project.findById(file.project);
    const isOwner = project.owner.toString() === req.user.id;
    const isUploader = file.uploadedBy.toString() === req.user.id;

    if (!isOwner && !isUploader) {
      return next(new AppError('Not authorized', 403));
    }

    // Delete from Cloudinary
    if (file.cloudinaryId) {
      await cloudinary.uploader.destroy(file.cloudinaryId, {
        resource_type: 'auto',
      });
    }

    await file.deleteOne();

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project files
// @route   GET /api/files/project/:projectId
// @access  Private (Project members)
exports.getProjectFiles = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { type, visibility } = req.query;

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember =
      project.members.some((m) => m.user.toString() === req.user.id) ||
      project.owner.toString() === req.user.id;

    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    const query = { project: projectId };
    if (type) query.type = type;
    if (visibility) query.visibility = visibility;

    const files = await File.find(query)
      .populate('uploadedBy', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        files,
        count: files.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single file
// @route   GET /api/files/:id
// @access  Private (Project members)
exports.getFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id).populate(
      'uploadedBy',
      'firstName lastName avatar'
    );

    if (!file) {
      return next(new AppError('File not found', 404));
    }

    const project = await Project.findById(file.project);
    const isMember =
      project.members.some((m) => m.user.toString() === req.user.id) ||
      project.owner.toString() === req.user.id;

    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    res.status(200).json({
      success: true,
      data: { file },
    });
  } catch (error) {
    next(error);
  }
};