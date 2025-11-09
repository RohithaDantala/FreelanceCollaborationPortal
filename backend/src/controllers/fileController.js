// backend/src/controllers/fileController.js - NO NOTIFICATIONS
const File = require('../models/File');
const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');
const cloudinary = require('cloudinary').v2;

// @desc    Upload file
// @route   POST /api/projects/:projectId/files
// @access  Private (Project members)
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    const { projectId } = req.params;
    const { description, category, tags } = req.body;

    // Verify project and membership
    const projectDoc = await Project.findById(projectId);
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
          folder: `projects/${projectId}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // Determine file type
    const getFileType = (mimetype) => {
      if (mimetype.startsWith('image/')) return 'image';
      if (mimetype.startsWith('video/')) return 'video';
      if (mimetype.startsWith('audio/')) return 'audio';
      if (mimetype.includes('pdf') || mimetype.includes('document')) return 'document';
      if (mimetype.includes('zip') || mimetype.includes('rar')) return 'archive';
      if (mimetype.includes('javascript') || mimetype.includes('json')) return 'code';
      return 'other';
    };

    // Create file record
    const file = await File.create({
      filename: result.public_id,
      originalName: req.file.originalname,
      fileUrl: result.secure_url,
      fileType: getFileType(req.file.mimetype),
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      project: projectId,
      description: description || '',
      category: category || 'general',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
    });

    await file.populate('uploadedBy', 'firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { file },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update file
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

    const { description, category, tags, deliverableStatus } = req.body;

    if (description !== undefined) file.description = description;
    if (category) file.category = category;
    if (tags) file.tags = tags;
    if (deliverableStatus) {
      file.deliverableStatus = deliverableStatus;
      file.reviewedBy = req.user.id;
      file.reviewedAt = Date.now();
    }

    await file.save();
    await file.populate('uploadedBy', 'firstName lastName avatar');

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
    if (file.filename) {
      await cloudinary.uploader.destroy(file.filename, {
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
// @route   GET /api/projects/:projectId/files
// @access  Private (Project members)
exports.getProjectFiles = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { category, deliverableStatus } = req.query;

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

    const query = { project: projectId, isActive: true };
    if (category) query.category = category;
    if (deliverableStatus) query.deliverableStatus = deliverableStatus;

    const files = await File.find(query)
      .populate('uploadedBy', 'firstName lastName avatar')
      .populate('reviewedBy', 'firstName lastName')
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
    const file = await File.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName avatar')
      .populate('reviewedBy', 'firstName lastName');

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