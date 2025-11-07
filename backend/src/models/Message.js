// backend/src/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'file', 'system'],
      default: 'text',
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ project: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

// Method to mark as read
messageSchema.methods.markAsRead = async function (userId) {
  if (!this.readBy.some((r) => r.user.toString() === userId)) {
    this.readBy.push({ user: userId, readAt: Date.now() });
    await this.save();
  }
};

module.exports = mongoose.model('Message', messageSchema);

// backend/src/controllers/messageController.js
const Message = require('../models/Message');
const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');
const { emitToProject } = require('../config/socket');

// Get project messages
exports.getProjectMessages = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is project member
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember = project.members.some((m) => m.user.toString() === req.user.id);
    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    const messages = await Message.find({ project: projectId, isDeleted: false })
      .populate('sender', 'firstName lastName avatar')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Message.countDocuments({ project: projectId, isDeleted: false });

    // Mark messages as read
    const unreadMessages = messages.filter(
      (m) => !m.readBy.some((r) => r.user.toString() === req.user.id) && m.sender._id.toString() !== req.user.id
    );

    await Promise.all(unreadMessages.map((m) => m.markAsRead(req.user.id)));

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(),
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalMessages: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Send message
exports.sendMessage = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { content, type, replyTo, fileUrl, fileName } = req.body;

    // Check if user is project member
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember = project.members.some((m) => m.user.toString() === req.user.id);
    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    const message = await Message.create({
      project: projectId,
      sender: req.user.id,
      content,
      type: type || 'text',
      replyTo: replyTo || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
    });

    await message.populate('sender', 'firstName lastName avatar');

    // Emit to project room via Socket.io
    emitToProject(projectId, 'new_message', message);

    res.status(201).json({
      success: true,
      data: { message },
    });
  } catch (error) {
    next(error);
  }
};

// Edit message
exports.editMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    if (message.sender.toString() !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = Date.now();
    await message.save();

    await message.populate('sender', 'firstName lastName avatar');

    // Emit update
    emitToProject(message.project, 'message_edited', message);

    res.status(200).json({
      success: true,
      data: { message },
    });
  } catch (error) {
    next(error);
  }
};

// Delete message
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    if (message.sender.toString() !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    message.isDeleted = true;
    message.deletedAt = Date.now();
    await message.save();

    // Emit deletion
    emitToProject(message.project, 'message_deleted', { messageId: message._id });

    res.status(200).json({
      success: true,
      message: 'Message deleted',
    });
  } catch (error) {
    next(error);
  }
};

// Get unread count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const count = await Message.countDocuments({
      project: projectId,
      isDeleted: false,
      sender: { $ne: req.user.id },
      'readBy.user': { $ne: req.user.id },
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};