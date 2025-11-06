const File = require('../models/File');
const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// @desc    Upload file
// @route   POST /api/projects/:projectId/files
// @access  Private (Project members only)
exports.uploadFile = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      task,
      milestone,
      category,
      description,
      tags,
      isDeliverable,
    } = req.body;

    // Check if project exists and user is a member
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized to upload files to this project', 403));
    }

    // Check if file was uploaded
    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    // File size limit (10MB for now, can be configured)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return next(new AppError('File size exceeds 10MB limit', 400));
    }

    // Upload to Cloudinary (or save locally for now)
    let fileUrl = '';
    let filename = '';

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file);
      fileUrl = result.secure_url;
      filename = result.public_id;
    } else {
      // For development: use a placeholder URL
      // In production, implement local file storage or cloud storage
      fileUrl = `/uploads/${req.file.filename}`;
      filename = req.file.filename;
    }

    // Determine file type
    const fileType = File.getFileType(req.file.mimetype);

    // Create file record
    const file = await File.create({
      filename,
      originalName: req.file.originalname,
      fileUrl,
      fileType,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      project: projectId,
      uploadedBy: req.user.id,
      task: task || null,
      milestone: milestone || null,
      category: category || 'general',
      description: description || '',
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      isDeliverable: isDeliverable === 'true' || isDeliverable === true,
      deliverableStatus: isDeliverable ? 'pending' : null,
    });

    await file.populate([
      { path: 'uploadedBy', select: 'firstName lastName email avatar' },
      { path: 'task', select: 'title' },
    ]);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { file },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all files for a project
// @route   GET /api/projects/:projectId/files
// @access  Private (Project members only)
exports.getProjectFiles = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      category,
      fileType,
      task,
      isDeliverable,
      page = 1,
      limit = 20,
    } = req.query;

    // Check if project exists and user is a member
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized to view project files', 403));
    }

    // Build query
    const query = { project: projectId, isActive: true };

    if (category) query.category = category;
    if (fileType) query.fileType = fileType;
    if (task) query.task = task;
    if (isDeliverable !== undefined) query.isDeliverable = isDeliverable === 'true';

    const files = await File.find(query)
      .populate('uploadedBy', 'firstName lastName email avatar')
      .populate('task', 'title status')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await File.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        files,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalFiles: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single file
// @route   GET /api/files/:id
// @access  Private (Project members only)
exports.getFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName email avatar')
      .populate('task', 'title status')
      .populate('reviewedBy', 'firstName lastName')
      .populate('previousVersion', 'filename version createdAt');

    if (!file) {
      return next(new AppError('File not found', 404));
    }

    // Check if user is a project member
    const project = await Project.findById(file.project);
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized to view this file', 403));
    }

    res.status(200).json({
      success: true,
      data: { file },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update file metadata
// @route   PUT /api/files/:id
// @access  Private (Uploader or project owner)
exports.updateFile = async (req, res, next) => {
  try {
    let file = await File.findById(req.params.id);

    if (!file) {
      return next(new AppError('File not found', 404));
    }

    // Check authorization
    const project = await Project.findById(file.project);
    const isUploader = file.uploadedBy.toString() === req.user.id;
    const isOwner = project.owner.toString() === req.user.id;

    if (!isUploader && !isOwner) {
      return next(new AppError('Not authorized to update this file', 403));
    }

    const { description, tags, category, milestone } = req.body;

    if (description !== undefined) file.description = description;
    if (tags !== undefined) {
      file.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    }
    if (category !== undefined) file.category = category;
    if (milestone !== undefined) file.milestone = milestone;

    await file.save();

    await file.populate([
      { path: 'uploadedBy', select: 'firstName lastName email avatar' },
      { path: 'task', select: 'title' },
    ]);

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
// @access  Private (Uploader or project owner)
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return next(new AppError('File not found', 404));
    }

    // Check authorization
    const project = await Project.findById(file.project);
    const isUploader = file.uploadedBy.toString() === req.user.id;
    const isOwner = project.owner.toString() === req.user.id;

    if (!isUploader && !isOwner) {
      return next(new AppError('Not authorized to delete this file', 403));
    }

    // Soft delete
    file.isActive = false;
    await file.save();

    // Optional: Delete from Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        await deleteFromCloudinary(file.filename);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
      }
    }

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit file as deliverable
// @route   POST /api/files/:id/submit
// @access  Private (Project members)
exports.submitDeliverable = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return next(new AppError('File not found', 404));
    }

    // Check if user is a project member
    const project = await Project.findById(file.project);
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    file.isDeliverable = true;
    file.deliverableStatus = 'submitted';
    await file.save();

    res.status(200).json({
      success: true,
      message: 'Deliverable submitted successfully',
      data: { file },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review deliverable (approve/reject)
// @route   PUT /api/files/:id/review
// @access  Private (Project owner only)
exports.reviewDeliverable = async (req, res, next) => {
  try {
    const { status, comments } = req.body;

    if (!['approved', 'rejected', 'revision_requested'].includes(status)) {
      return next(new AppError('Invalid status', 400));
    }

    const file = await File.findById(req.params.id);

    if (!file) {
      return next(new AppError('File not found', 404));
    }

    if (!file.isDeliverable) {
      return next(new AppError('This file is not marked as a deliverable', 400));
    }

    // Check if user is project owner
    const project = await Project.findById(file.project);
    const isOwner = project.owner.toString() === req.user.id;

    if (!isOwner) {
      return next(new AppError('Only project owner can review deliverables', 403));
    }

    file.deliverableStatus = status;
    file.reviewedBy = req.user.id;
    file.reviewedAt = Date.now();
    file.reviewComments = comments || '';

    await file.save();

    await file.populate([
      { path: 'uploadedBy', select: 'firstName lastName email avatar' },
      { path: 'reviewedBy', select: 'firstName lastName' },
    ]);

    res.status(200).json({
      success: true,
      message: `Deliverable ${status} successfully`,
      data: { file },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload new version of file
// @route   POST /api/files/:id/version
// @access  Private (Project members)
exports.uploadNewVersion = async (req, res, next) => {
  try {
    const oldFile = await File.findById(req.params.id);

    if (!oldFile) {
      return next(new AppError('Original file not found', 404));
    }

    // Check if user is a project member
    const project = await Project.findById(oldFile.project);
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    // Upload new version
    let fileUrl = '';
    let filename = '';

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await uploadToCloudinary(req.file);
      fileUrl = result.secure_url;
      filename = result.public_id;
    } else {
      fileUrl = `/uploads/${req.file.filename}`;
      filename = req.file.filename;
    }

    // Create new file record with incremented version
    const newFile = await File.create({
      filename,
      originalName: req.file.originalname,
      fileUrl,
      fileType: File.getFileType(req.file.mimetype),
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      project: oldFile.project,
      uploadedBy: req.user.id,
      task: oldFile.task,
      milestone: oldFile.milestone,
      category: oldFile.category,
      description: oldFile.description,
      tags: oldFile.tags,
      version: oldFile.version + 1,
      previousVersion: oldFile._id,
      isDeliverable: oldFile.isDeliverable,
      deliverableStatus: oldFile.isDeliverable ? 'pending' : null,
    });

    await newFile.populate([
      { path: 'uploadedBy', select: 'firstName lastName email avatar' },
      { path: 'previousVersion', select: 'filename version' },
    ]);

    res.status(201).json({
      success: true,
      message: 'New version uploaded successfully',
      data: { file: newFile },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download file
// @route   GET /api/files/:id/download
// @access  Private (Project members only)
exports.downloadFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return next(new AppError('File not found', 404));
    }

    // Check if user is a project member
    const project = await Project.findById(file.project);
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    // Increment download count
    await file.incrementDownloadCount();

    res.status(200).json({
      success: true,
      data: {
        fileUrl: file.fileUrl,
        filename: file.originalName,
      },
    });
  } catch (error) {
    next(error);
  }
};