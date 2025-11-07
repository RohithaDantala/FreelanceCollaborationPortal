// backend/src/models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    reportType: {
      type: String,
      enum: ['contribution', 'milestone', 'time_tracking', 'project_summary', 'custom'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dateRange: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    format: {
      type: String,
      enum: ['json', 'pdf', 'csv'],
      default: 'json',
    },
    fileUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['generating', 'completed', 'failed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reportSchema.index({ project: 1, reportType: 1, createdAt: -1 });
reportSchema.index({ generatedBy: 1, createdAt: -1 });

// Static method to generate contribution report
reportSchema.statics.generateContributionReport = async function(projectId, startDate, endDate) {
  const Task = mongoose.model('Task');
  const File = mongoose.model('File');
  const Project = mongoose.model('Project');
  
  const project = await Project.findById(projectId).populate('members.user', 'firstName lastName email');
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  const contributions = {};
  
  // Initialize contributions for all members
  project.members.forEach(member => {
    contributions[member.user._id] = {
      user: {
        id: member.user._id,
        name: `${member.user.firstName} ${member.user.lastName}`,
        email: member.user.email,
      },
      tasksCompleted: 0,
      tasksInProgress: 0,
      filesUploaded: 0,
      totalHoursEstimated: 0,
    };
  });
  
  // Count tasks
  const tasks = await Task.find({
    project: projectId,
    updatedAt: { $gte: startDate, $lte: endDate },
  });
  
  tasks.forEach(task => {
    if (task.assignee && contributions[task.assignee]) {
      if (task.status === 'done') {
        contributions[task.assignee].tasksCompleted++;
      } else if (task.status === 'in_progress') {
        contributions[task.assignee].tasksInProgress++;
      }
      if (task.estimatedHours) {
        contributions[task.assignee].totalHoursEstimated += task.estimatedHours;
      }
    }
  });
  
  // Count files
  const files = await File.find({
    project: projectId,
    createdAt: { $gte: startDate, $lte: endDate },
  });
  
  files.forEach(file => {
    if (file.uploadedBy && contributions[file.uploadedBy]) {
      contributions[file.uploadedBy].filesUploaded++;
    }
  });
  
  return {
    projectTitle: project.title,
    dateRange: { startDate, endDate },
    contributions: Object.values(contributions),
    summary: {
      totalTasks: tasks.length,
      totalFiles: files.length,
      activeMembers: Object.values(contributions).filter(c => 
        c.tasksCompleted > 0 || c.tasksInProgress > 0 || c.filesUploaded > 0
      ).length,
    },
  };
};

// Static method to generate milestone completion report
reportSchema.statics.generateMilestoneReport = async function(projectId) {
  const Milestone = mongoose.model('Milestone');
  const Project = mongoose.model('Project');
  
  const project = await Project.findById(projectId);
  const milestones = await Milestone.find({ project: projectId, isActive: true })
    .populate('tasks', 'title status');
  
  const milestoneData = milestones.map(milestone => ({
    title: milestone.title,
    status: milestone.status,
    progress: milestone.progress,
    dueDate: milestone.dueDate,
    completedAt: milestone.completedAt,
    isOverdue: milestone.isOverdue,
    tasksCount: milestone.tasks?.length || 0,
    completedTasks: milestone.tasks?.filter(t => t.status === 'done').length || 0,
  }));
  
  return {
    projectTitle: project.title,
    totalMilestones: milestones.length,
    completedMilestones: milestones.filter(m => m.status === 'completed').length,
    overdueMilestones: milestones.filter(m => m.isOverdue && m.status !== 'completed').length,
    milestones: milestoneData,
  };
};

module.exports = mongoose.model('Report', reportSchema);