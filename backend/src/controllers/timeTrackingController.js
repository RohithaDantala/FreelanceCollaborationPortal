// backend/src/controllers/timeTrackingController.js
const TimeEntry = require('../models/TimeTracking');
const Project = require('../models/Project');

// Ensure user is part of the project (owner or member)
const assertProjectAccess = async (userId, projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');
  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some(m => m.user.toString() === userId.toString());
  if (!isOwner && !isMember) throw new Error('Not authorized for this project');
  return project;
};

exports.startTimer = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, taskId = null, description = 'Working', isBillable = true, hourlyRate = 0, tags = [] } = req.body;

    await assertProjectAccess(userId, projectId);

    const running = await TimeEntry.findOne({ user: userId, isRunning: true });
    if (running) {
      return res.status(400).json({ success: false, message: 'A timer is already running' });
    }

    const entry = await TimeEntry.create({
      user: userId,
      project: projectId,
      task: taskId,
      description,
      startTime: new Date(),
      isRunning: true,
      isBillable,
      hourlyRate,
      tags,
    });

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

exports.stopTimer = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { entryId } = req.params;

    const query = { user: userId, isRunning: true };
    if (entryId) query._id = entryId;

    const entry = await TimeEntry.findOne(query);
    if (!entry) return res.status(404).json({ success: false, message: 'No running timer found' });

    entry.endTime = new Date();
    await entry.save();

    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

exports.createEntry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, taskId = null, description, startTime, endTime, isBillable = true, hourlyRate = 0, tags = [] } = req.body;

    await assertProjectAccess(userId, projectId);

    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'startTime and endTime are required' });
    }
    const entry = await TimeEntry.create({
      user: userId,
      project: projectId,
      task: taskId,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isRunning: false,
      isBillable,
      hourlyRate,
      tags,
    });

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

exports.getMyEntries = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, from, to, limit = 100 } = req.query;

    const filter = { user: userId };
    if (projectId) filter.project = projectId;
    if (from || to) {
      filter.startTime = {};
      if (from) filter.startTime.$gte = new Date(from);
      if (to) filter.startTime.$lte = new Date(to);
    }

    const entries = await TimeEntry.find(filter)
      .populate('project', 'title')
      .populate('task', 'title')
      .sort({ startTime: -1 })
      .limit(parseInt(limit, 10));

    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
};

exports.getRunning = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const entry = await TimeEntry.findOne({ user: userId, isRunning: true }).populate('project', 'title');
    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days || '14', 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const entries = await TimeEntry.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId(userId), startTime: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          totalMinutes: { $sum: '$duration' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byProject = await TimeEntry.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId(userId), startTime: { $gte: since } } },
      {
        $group: {
          _id: '$project',
          totalMinutes: { $sum: '$duration' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalMinutes: -1 } },
    ]);

    res.json({ success: true, data: { perDay: entries, byProject, since } });
  } catch (err) {
    next(err);
  }
};
