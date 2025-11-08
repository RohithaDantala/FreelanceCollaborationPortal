// backend/src/models/TimeEntry.js
const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  billable: {
    type: Boolean,
    default: true
  },
  hourlyRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for finding running timers
timeEntrySchema.index({ userId: 1, endTime: 1 });

// Index for date range queries
timeEntrySchema.index({ userId: 1, startTime: -1 });

// Virtual for calculating duration on the fly if timer is still running
timeEntrySchema.virtual('currentDuration').get(function() {
  if (!this.endTime) {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
  return this.duration;
});

// Calculate and update duration before saving
timeEntrySchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

module.exports = mongoose.model('TimeEntry', timeEntrySchema);