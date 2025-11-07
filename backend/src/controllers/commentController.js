const Comment = require('../models/Comment');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');

// Create comment
exports.createComment = async (req, res, next) => {
  try {
    const { content, project, task, file, parentComment, mentions } = req.body;

    const comment = await Comment.create({
      content,
      author: req.user.id,
      project,
      task,
      file,
      parentComment,
      mentions: mentions || [],
    });

    await comment.populate('author', 'firstName lastName avatar');

    // Create notifications for mentions
    if (mentions && mentions.length > 0) {
      const notificationPromises = mentions.map((userId) =>
        Notification.createNotification({
          recipient: userId,
          sender: req.user.id,
          type: 'comment_mention',
          title: 'You were mentioned in a comment',
          message: `${req.user.firstName} ${req.user.lastName} mentioned you in a comment`,
          link: project ? `/projects/${project}` : `/tasks/${task}`,
          project: project || null,
          task: task || null,
        })
      );
      await Promise.all(notificationPromises);
    }

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

// Get comments
exports.getComments = async (req, res, next) => {
  try {
    const { project, task, file } = req.query;

    const query = {};
    if (project) query.project = project;
    if (task) query.task = task;
    if (file) query.file = file;

    const comments = await Comment.find(query)
      .populate('author', 'firstName lastName avatar')
      .populate('parentComment')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { comments },
    });
  } catch (error) {
    next(error);
  }
};

// Update comment
exports.updateComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    if (comment.author.toString() !== req.user.id) {
      return next(new AppError('Not authorized to edit this comment', 403));
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = Date.now();
    await comment.save();

    await comment.populate('author', 'firstName lastName avatar');

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

// Delete comment
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    if (comment.author.toString() !== req.user.id) {
      return next(new AppError('Not authorized to delete this comment', 403));
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};