// backend/src/models/Milestone.js
const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Milestone title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Milestone',
      },
    ],
    deliverables: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
milestoneSchema.index({ project: 1, status: 1 });
milestoneSchema.index({ project: 1, order: 1 });
milestoneSchema.index({ dueDate: 1 });

// Virtual for checking if milestone is overdue
milestoneSchema.virtual('isOverdue').get(function () {
  if (this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

// Virtual for days remaining
milestoneSchema.virtual('daysRemaining').get(function () {
  if (this.status === 'completed') return 0;
  const diff = this.dueDate - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Middleware to set completedAt when status changes to completed
milestoneSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = Date.now();
      this.progress = 100;
    } else if (this.status !== 'completed') {
      this.completedAt = null;
    }
  }
  next();
});

// Method to calculate progress based on tasks
milestoneSchema.methods.calculateProgress = async function () {
  if (this.tasks.length === 0) {
    return this.progress;
  }

  const Task = mongoose.model('Task');
  const tasks = await Task.find({ _id: { $in: this.tasks } });
  
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  
  this.progress = Math.round((completedTasks / totalTasks) * 100);
  return this.progress;
};

// Static method to get project progress
milestoneSchema.statics.getProjectProgress = async function (projectId) {
  const milestones = await this.find({ project: projectId, isActive: true });
  
  if (milestones.length === 0) return 0;
  
  const totalProgress = milestones.reduce((sum, m) => sum + m.progress, 0);
  return Math.round(totalProgress / milestones.length);
};

module.exports = mongoose.model('Milestone', milestoneSchema);