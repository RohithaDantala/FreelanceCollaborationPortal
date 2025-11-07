// backend/src/models/TimeTracking.js
const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // in minutes
      default: 0,
    },
    isRunning: {
      type: Boolean,
      default: false,
    },
    isBillable: {
      type: Boolean,
      default: true,
    },
    hourlyRate: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
timeEntrySchema.index({ user: 1, project: 1, startTime: -1 });
timeEntrySchema.index({ task: 1 });
timeEntrySchema.index({ isRunning: 1 });

// Calculate duration before saving
timeEntrySchema.pre('save', function (next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / (1000 * 60));
    this.isRunning = false;
  }
  next();
});

// Virtual for formatted duration
timeEntrySchema.virtual('formattedDuration').get(function () {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  return `${hours}h ${minutes}m`;
});

// Virtual for earnings
timeEntrySchema.virtual('earnings').get(function () {
  if (!this.isBillable || !this.hourlyRate) return 0;
  return (this.duration / 60) * this.hourlyRate;
});

// Static method to get total time for project
timeEntrySchema.statics.getProjectTotalTime = async function (projectId) {
  const result = await this.aggregate([
    { $match: { project: mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: '$user',
        totalMinutes: { $sum: '$duration' },
        totalEarnings: {
          $sum: {
            $cond: [
              '$isBillable',
              { $multiply: [{ $divide: ['$duration', 60] }, '$hourlyRate'] },
              0,
            ],
          },
        },
        entryCount: { $sum: 1 },
      },
    },
  ]);
  return result;
};

// Static method to get user's time for date range
timeEntrySchema.statics.getUserTimeRange = async function (userId, startDate, endDate) {
  return await this.find({
    user: userId,
    startTime: { $gte: startDate, $lte: endDate },
  })
    .populate('project', 'title')
    .populate('task', 'title')
    .sort({ startTime: -1 });
};

module.exports = mongoose.model('TimeEntry', timeEntrySchema);