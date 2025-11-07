const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    proposedDates: [
      {
        date: {
          type: Date,
          required: true,
        },
        startTime: String,
        endTime: String,
      },
    ],
    confirmedDate: {
      date: Date,
      startTime: String,
      endTime: String,
    },
    meetingLink: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
    duration: {
      type: Number, // in minutes
      default: 60,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
interviewSchema.index({ freelancer: 1, status: 1 });
interviewSchema.index({ client: 1, status: 1 });
interviewSchema.index({ project: 1 });

module.exports = mongoose.model('Interview', interviewSchema);