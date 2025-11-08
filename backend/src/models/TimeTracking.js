const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  workType: {
    type: String,
    enum: ['development', 'design', 'meeting', 'research', 'testing', 'other'],
    default: 'development'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number // in minutes
  }],
  productivity: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  isBillable: { type: Boolean, default: true },
  hourlyRate: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Calculate duration before saving
timeEntrySchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    const totalMinutes = Math.floor((this.endTime - this.startTime) / (1000 * 60));
    const breakMinutes = this.breaks.reduce((sum, brk) => {
      if (brk.endTime && brk.startTime) {
        return sum + Math.floor((brk.endTime - brk.startTime) / (1000 * 60));
      }
      return sum;
    }, 0);
    this.duration = totalMinutes - breakMinutes;
  }
  next();
});

// Static method to get total time for a project
timeEntrySchema.statics.getProjectTotalTime = async function (projectId) {
  const result = await this.aggregate([
    { $match: { project: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: '$user',
        totalMinutes: { $sum: '$duration' },
        totalEarnings: {
          $sum: {
            $cond: [
              '$isBillable',
              { $multiply: [{ $divide: ['$duration', 60] }, '$hourlyRate'] },
              0
            ]
          }
        },
        entryCount: { $sum: 1 }
      }
    }
  ]);
  return result;
};

// Index for faster queries
timeEntrySchema.index({ user: 1, project: 1, startTime: -1 });
timeEntrySchema.index({ project: 1, startTime: -1 });

module.exports = mongoose.model('TimeTracking', timeEntrySchema);
