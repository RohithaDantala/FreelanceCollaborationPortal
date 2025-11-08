// backend/src/models/TimeTracking.js - ENHANCED VERSION
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
  }
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

// Index for faster queries
timeEntrySchema.index({ user: 1, project: 1, startTime: -1 });
timeEntrySchema.index({ project: 1, startTime: -1 });

module.exports = mongoose.model('TimeTracking', timeEntrySchema);

// ==========================================
// backend/src/controllers/timeTrackingController.js
// ==========================================
const TimeTracking = require('../models/TimeTracking');
const Project = require('../models/Project');

// Start time tracking
exports.startTracking = async (req, res) => {
  try {
    const { projectId, taskId, description, workType } = req.body;
    
    // Check if user has an active session
    const activeSession = await TimeTracking.findOne({
      user: req.user.id,
      status: 'active'
    });
    
    if (activeSession) {
      return res.status(400).json({ 
        message: 'You already have an active time tracking session',
        activeSession 
      });
    }
    
    // Verify user is part of the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const isMember = project.team.some(member => 
      member.user.toString() === req.user.id
    );
    
    if (!isMember && project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not part of this project' });
    }
    
    const timeEntry = new TimeTracking({
      user: req.user.id,
      project: projectId,
      task: taskId,
      startTime: new Date(),
      description,
      workType: workType || 'development',
      status: 'active'
    });
    
    await timeEntry.save();
    await timeEntry.populate('user', 'name email');
    await timeEntry.populate('project', 'title');
    if (taskId) {
      await timeEntry.populate('task', 'title');
    }
    
    res.status(201).json({
      message: 'Time tracking started',
      timeEntry
    });
  } catch (error) {
    console.error('Start tracking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Stop time tracking
exports.stopTracking = async (req, res) => {
  try {
    const { timeEntryId } = req.params;
    
    const timeEntry = await TimeTracking.findOne({
      _id: timeEntryId,
      user: req.user.id,
      status: 'active'
    });
    
    if (!timeEntry) {
      return res.status(404).json({ message: 'Active time entry not found' });
    }
    
    timeEntry.endTime = new Date();
    timeEntry.status = 'completed';
    await timeEntry.save();
    
    await timeEntry.populate('user', 'name email');
    await timeEntry.populate('project', 'title');
    if (timeEntry.task) {
      await timeEntry.populate('task', 'title');
    }
    
    res.json({
      message: 'Time tracking stopped',
      timeEntry,
      duration: timeEntry.duration
    });
  } catch (error) {
    console.error('Stop tracking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get active session
exports.getActiveSession = async (req, res) => {
  try {
    const activeSession = await TimeTracking.findOne({
      user: req.user.id,
      status: 'active'
    })
    .populate('user', 'name email')
    .populate('project', 'title')
    .populate('task', 'title');
    
    res.json({ activeSession });
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add break
exports.addBreak = async (req, res) => {
  try {
    const { timeEntryId } = req.params;
    const { duration } = req.body; // in minutes
    
    const timeEntry = await TimeTracking.findOne({
      _id: timeEntryId,
      user: req.user.id
    });
    
    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }
    
    const breakStart = new Date();
    const breakEnd = new Date(breakStart.getTime() + duration * 60000);
    
    timeEntry.breaks.push({
      startTime: breakStart,
      endTime: breakEnd,
      duration
    });
    
    await timeEntry.save();
    
    res.json({
      message: 'Break added',
      timeEntry
    });
  } catch (error) {
    console.error('Add break error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get time entries for a project (for dashboard)
exports.getProjectTimeEntries = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate, userId } = req.query;
    
    // Verify access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const isMember = project.team.some(member => 
      member.user.toString() === req.user.id
    );
    const isOwner = project.owner.toString() === req.user.id;
    
    if (!isMember && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Build query
    const query = { project: projectId };
    
    if (userId && isOwner) {
      query.user = userId;
    }
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    
    const timeEntries = await TimeTracking.find(query)
      .populate('user', 'name email avatar')
      .populate('task', 'title status')
      .sort({ startTime: -1 });
    
    // Calculate statistics
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalHours = (totalMinutes / 60).toFixed(2);
    
    const byUser = {};
    timeEntries.forEach(entry => {
      const userId = entry.user._id.toString();
      if (!byUser[userId]) {
        byUser[userId] = {
          user: entry.user,
          totalMinutes: 0,
          entries: 0
        };
      }
      byUser[userId].totalMinutes += entry.duration;
      byUser[userId].entries += 1;
    });
    
    res.json({
      timeEntries,
      statistics: {
        totalHours,
        totalMinutes,
        entriesCount: timeEntries.length,
        byUser: Object.values(byUser)
      }
    });
  } catch (error) {
    console.error('Get project time entries error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get daily progress for dashboard
exports.getDailyProgress = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { days = 7 } = req.query;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);
    
    const timeEntries = await TimeTracking.find({
      project: projectId,
      startTime: { $gte: startDate }
    }).populate('user', 'name email');
    
    // Group by date and user
    const dailyData = {};
    
    timeEntries.forEach(entry => {
      const date = entry.startTime.toISOString().split('T')[0];
      const userId = entry.user._id.toString();
      
      if (!dailyData[date]) {
        dailyData[date] = { date, total: 0, byUser: {} };
      }
      
      if (!dailyData[date].byUser[userId]) {
        dailyData[date].byUser[userId] = {
          user: entry.user,
          minutes: 0,
          entries: 0
        };
      }
      
      dailyData[date].total += entry.duration;
      dailyData[date].byUser[userId].minutes += entry.duration;
      dailyData[date].byUser[userId].entries += 1;
    });
    
    const progressData = Object.values(dailyData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    res.json({ progressData });
  } catch (error) {
    console.error('Get daily progress error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};