const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['web_development', 'mobile_app', 'design', 'writing', 'marketing', 'data_science', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'in_progress', 'completed', 'archived'],
      default: 'open',
    },
    skillsRequired: [
      {
        type: String,
        trim: true,
      },
    ],
    budget: {
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },
    timeline: {
      startDate: Date,
      endDate: Date,
      estimatedDuration: String,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['owner', 'member', 'viewer'], // ✅ Lowercase 'member', not 'Member'
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    milestones: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        dueDate: Date,
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed'],
          default: 'pending',
        },
        completedAt: Date,
      },
    ],
    tags: [String],
    isPublic: {
      type: Boolean,
      default: true,
    },
    maxMembers: {
      type: Number,
      default: 10,
      min: 1,
    },
    applicants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        message: String,
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected', 'removed'], // ✅ Added 'removed' for removed members
          default: 'pending',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for search and filtering
projectSchema.index({ title: 'text', description: 'text' });
projectSchema.index({ status: 1, isPublic: 1 });
projectSchema.index({ owner: 1 });

// Virtual for member count
projectSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

// Virtual for checking if project is full
projectSchema.virtual('isFull').get(function () {
  return this.members.length >= this.maxMembers;
});

// Add owner to members array on creation
projectSchema.pre('save', function (next) {
  if (this.isNew && !this.members.some(m => m.user.equals(this.owner))) {
    this.members.push({
      user: this.owner,
      role: 'owner',
      joinedAt: Date.now(),
    });
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);