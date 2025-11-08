// backend/src/controllers/timeTrackingController.js - FIXED
const TimeEntry = require('../models/TimeTracking'); // Use TimeTracking model
const Project = require('../models/Project');
const mongoose = require('mongoose');

// Start a new timer
exports.startTimer = async (req, res) => {
  try {
    const { projectId, taskId, description, workType } = req.body;

    // Check if there's already a running timer for this user
    const runningEntry = await TimeEntry.findOne({
      user: req.user.id,
      endTime: null
    });

    if (runningEntry) {
      return res.status(400).json({ 
        message: 'You already have a running timer. Please stop it first.',
        runningEntry 
      });
    }

    // Verify project access if projectId is provided
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Check if user is part of the project
      const isMember = project.members.some(
        member => member.user.toString() === req.user.id
      );
      
      if (!isMember && project.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied to this project' });
      }
    }

    // Create new time entry
    const timeEntry = new TimeEntry({
      user: req.user.id,
      project: projectId,
      task: taskId,
      description,
      workType: workType || 'development',
      startTime: new Date(),
      endTime: null,
      status: 'active'
    });

    await timeEntry.save();

    const populatedEntry = await TimeEntry.findById(timeEntry._id)
      .populate('project', 'title')
      .populate('user', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Timer started successfully',
      timeEntry: populatedEntry
    });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Stop a running timer
exports.stopTimer = async (req, res) => {
  try {
    const { entryId } = req.params;
    let timeEntry;

    if (entryId) {
      // Stop specific entry by ID
      timeEntry = await TimeEntry.findOne({
        _id: entryId,
        user: req.user.id,
        endTime: null
      });
    } else {
      // Stop the currently running timer
      timeEntry = await TimeEntry.findOne({
        user: req.user.id,
        endTime: null
      });
    }

    if (!timeEntry) {
      return res.status(404).json({ success: false, message: 'No running timer found' });
    }

    timeEntry.endTime = new Date();
    timeEntry.status = 'completed';
    
    // Duration is calculated in the pre-save hook
    await timeEntry.save();

    const populatedEntry = await TimeEntry.findById(timeEntry._id)
      .populate('project', 'title')
      .populate('user', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Timer stopped successfully',
      timeEntry: populatedEntry,
      duration: timeEntry.duration
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get currently running timer
exports.getRunning = async (req, res) => {
  try {
    const runningEntry = await TimeEntry.findOne({
      user: req.user.id,
      endTime: null
    })
      .populate('project', 'title')
      .populate('user', 'firstName lastName email');

    if (!runningEntry) {
      return res.json({ 
        success: true,
        running: false, 
        timeEntry: null 
      });
    }

    res.json({
      success: true,
      running: true,
      timeEntry: runningEntry
    });
  } catch (error) {
    console.error('Get running timer error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a manual time entry
exports.createEntry = async (req, res) => {
  try {
    const { projectId, taskId, description, startTime, endTime, workType } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ 
        success: false,
        message: 'Start time and end time are required for manual entries' 
      });
    }

    // Verify project access if projectId is provided
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const isMember = project.members.some(
        member => member.user.toString() === req.user.id
      );
      
      if (!isMember && project.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied to this project' });
      }
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const timeEntry = new TimeEntry({
      user: req.user.id,
      project: projectId,
      task: taskId,
      description,
      workType: workType || 'development',
      startTime: start,
      endTime: end,
      status: 'completed'
    });

    await timeEntry.save();

    const populatedEntry = await TimeEntry.findById(timeEntry._id)
      .populate('project', 'title')
      .populate('user', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Time entry created successfully',
      timeEntry: populatedEntry
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get user's time entries with filters
exports.getMyEntries = async (req, res) => {
  try {
    const { projectId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = { user: req.user.id };

    if (projectId) {
      query.project = projectId;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [entries, total] = await Promise.all([
      TimeEntry.find(query)
        .populate('project', 'title')
        .populate('user', 'firstName lastName email')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TimeEntry.countDocuments(query)
    ]);

    res.json({
      success: true,
      entries,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get time tracking summary/statistics
exports.getSummary = async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;

    const matchQuery = { 
      user: req.user.id,
      endTime: { $ne: null } // Only completed entries
    };

    if (projectId) {
      matchQuery.project = mongoose.Types.ObjectId(projectId);
    }

    if (startDate || endDate) {
      matchQuery.startTime = {};
      if (startDate) {
        matchQuery.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        matchQuery.startTime.$lte = new Date(endDate);
      }
    }

    // Get total time
    const totalResult = await TimeEntry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$duration' },
          totalEntries: { $sum: 1 }
        }
      }
    ]);

    // Get time by project
    const byProject = await TimeEntry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$project',
          totalMinutes: { $sum: '$duration' },
          entries: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project'
        }
      },
      { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          projectId: '$_id',
          projectTitle: '$project.title',
          totalMinutes: 1,
          entries: 1,
          hours: { $divide: ['$totalMinutes', 60] }
        }
      }
    ]);

    const summary = {
      total: totalResult[0] || { totalMinutes: 0, totalEntries: 0 },
      totalHours: totalResult[0] ? (totalResult[0].totalMinutes / 60).toFixed(2) : 0,
      byProject,
      period: {
        startDate: startDate || 'all',
        endDate: endDate || 'all'
      }
    };

    res.json({ success: true, ...summary });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};