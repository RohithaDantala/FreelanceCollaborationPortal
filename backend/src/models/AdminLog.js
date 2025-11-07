// backend/src/models/AdminLog.js
const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'user_suspended',
        'user_activated',
        'user_deleted',
        'project_deleted',
        'user_role_changed',
        'settings_updated',
        'report_generated',
      ],
    },
    targetType: {
      type: String,
      enum: ['User', 'Project', 'Task', 'File', 'System'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetType',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });

// Static method to create log entry
adminLogSchema.statics.logAction = async function({
  user,
  action,
  targetType,
  targetId,
  details = {},
  ipAddress,
  userAgent,
}) {
  try {
    await this.create({
      user,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

module.exports = mongoose.model('AdminLog', adminLogSchema);