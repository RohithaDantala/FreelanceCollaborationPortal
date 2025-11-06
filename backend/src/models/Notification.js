const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'project_application',
        'application_accepted',
        'application_rejected',
        'member_removed',
        'task_assigned',
        'task_completed',
        'file_uploaded',
        'deliverable_submitted',
        'deliverable_reviewed',
        'project_updated',
        'comment_mention',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: '',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function({
  recipient,
  sender,
  type,
  title,
  message,
  link = '',
  project = null,
  task = null,
}) {
  try {
    const notification = await this.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
      project,
      task,
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = Date.now();
  await this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);