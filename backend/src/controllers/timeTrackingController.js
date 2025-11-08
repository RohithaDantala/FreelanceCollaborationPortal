// backend/src/controllers/timeTrackingController.js
const TimeEntry = require('../models/TimeEntry');
const Project = require('../models/Project');

// Start a new timer
exports.startTimer = async (req, res) => {
  try {
    const { projectId, taskId, description } = req.body;

    // Check if there's already a running timer for this user
    const runningEntry = await TimeEntry.findOne({
      userId: req.user.id,
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
      const isMember = project.team.some(
        member => member.userId.toString() === req.user.id
      );
      
      if (!isMember && project.clientId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied to this project' });
      }
    }

    // Create new time entry
    const timeEntry = new TimeEntry({
      userId: req.user.id,
      projectId,
      taskId,
      description,
      startTime: new Date(),
      endTime: null
    });

    await timeEntry.save();

    const populatedEntry = await TimeEntry.findById(timeEntry._id)
      .populate('projectId', 'title')
      .populate('userId', 'name email');

    res.status(201).json({
      message: 'Timer started successfully',
      timeEntry: populatedEntry
    });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
        userId: req.user.id,
        endTime: null
      });
    } else {
      // Stop the currently running timer
      timeEntry = await TimeEntry.findOne({
        userId: req.user.id,
        endTime: null
      });
    }

    if (!timeEntry) {
      return res.status(404).json({ message: 'No running timer found' });
    }

    timeEntry.endTime = new Date();
    
    // Calculate duration in milliseconds
    const duration = timeEntry.endTime - timeEntry.startTime;
    timeEntry.duration = Math.floor(duration / 1000); // Store in seconds

    await timeEntry.save();

    const populatedEntry = await TimeEntry.findById(timeEntry._id)
      .populate('projectId', 'title')
      .populate('userId', 'name email');

    res.json({
      message: 'Timer stopped successfully',
      timeEntry: populatedEntry
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get currently running timer
exports.getRunning = async (req, res) => {
  try {
    const runningEntry = await TimeEntry.findOne({
      userId: req.user.id,
      endTime: null
    })
      .populate('projectId', 'title')
      .populate('userId', 'name email');

    if (!runningEntry) {
      return res.json({ running: false, timeEntry: null });
    }

    res.json({
      running: true,
      timeEntry: runningEntry
    });
  } catch (error) {
    console.error('Get running timer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a manual time entry
exports.createEntry = async (req, res) => {
  try {
    const { projectId, taskId, description, startTime, endTime, duration } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ 
        message: 'Start time and end time are required for manual entries' 
      });
    }

    // Verify project access if projectId is provided
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const isMember = project.team.some(
        member => member.userId.toString() === req.user.id
      );
      
      if (!isMember && project.clientId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied to this project' });
      }
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const calculatedDuration = Math.floor((end - start) / 1000); // in seconds

    const timeEntry = new TimeEntry({
      userId: req.user.id,
      projectId,
      taskId,
      description,
      startTime: start,
      endTime: end,
      duration: duration || calculatedDuration
    });

    await timeEntry.save();

    const populatedEntry = await TimeEntry.findById(timeEntry._id)
      .populate('projectId', 'title')
      .populate('userId', 'name email');

    res.status(201).json({
      message: 'Time entry created successfully',
      timeEntry: populatedEntry
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's time entries with filters
exports.getMyEntries = async (req, res) => {
  try {
    const { projectId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = { userId: req.user.id };

    if (projectId) {
      query.projectId = projectId;
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
        .populate('projectId', 'title')
        .populate('userId', 'name email')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TimeEntry.countDocuments(query)
    ]);

    res.json({
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get time tracking summary/statistics
exports.getSummary = async (req, res) => {
  try {
    const { projectId, startDate, endDate, groupBy = 'day' } = req.query;

    const matchQuery = { 
      userId: req.user.id,
      endTime: { $ne: null } // Only completed entries
    };

    if (projectId) {
      matchQuery.projectId = projectId;
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
          totalSeconds: { $sum: '$duration' },
          totalEntries: { $sum: 1 }
        }
      }
    ]);

    // Get time by project
    const byProject = await TimeEntry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$projectId',
          totalSeconds: { $sum: '$duration' },
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
          totalSeconds: 1,
          entries: 1,
          hours: { $divide: ['$totalSeconds', 3600] }
        }
      }
    ]);

    const summary = {
      total: totalResult[0] || { totalSeconds: 0, totalEntries: 0 },
      totalHours: totalResult[0] ? (totalResult[0].totalSeconds / 3600).toFixed(2) : 0,
      byProject,
      period: {
        startDate: startDate || 'all',
        endDate: endDate || 'all'
      }
    };

    res.json(summary);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};