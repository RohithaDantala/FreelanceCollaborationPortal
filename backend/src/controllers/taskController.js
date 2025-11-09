// backend/src/controllers/taskController.js - COMPLETE FIXED VERSION
const Task = require('../models/Task');
const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');

// @desc    Create task
// @route   POST /api/projects/:projectId/tasks
// @access  Private (Project members)
exports.createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      assignee,
      priority,
      deadline,
      labels,
      status,
    } = req.body;

    // Verify project exists and user is a member
    const projectDoc = await Project.findById(projectId);
    if (!projectDoc) {
      return next(new AppError('Project not found', 404));
    }

    const isMember =
      projectDoc.members.some((m) => m.user.toString() === req.user.id) ||
      projectDoc.owner.toString() === req.user.id;

    if (!isMember) {
      return next(new AppError('Not a project member', 403));
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignee: assignee || null,
      createdBy: req.user.id,
      priority: priority || 'medium',
      deadline: deadline || null,
      labels: labels || [],
      status: status || 'todo',
    });

    await task.populate([
      { path: 'assignee', select: 'firstName lastName email avatar' },
      { path: 'createdBy', select: 'firstName lastName email avatar' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    console.error('Create task error:', error);
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Project members)
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember =
      project.members.some((m) => m.user.toString() === req.user.id) ||
      project.owner.toString() === req.user.id;

    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    const {
      title,
      description,
      assignee,
      priority,
      deadline,
      labels,
      status,
    } = req.body;

    // Update task fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignee !== undefined) task.assignee = assignee;
    if (priority !== undefined) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;
    if (labels !== undefined) task.labels = labels;
    if (status !== undefined) task.status = status;

    await task.save();
    await task.populate([
      { path: 'assignee', select: 'firstName lastName email avatar' },
      { path: 'createdBy', select: 'firstName lastName email avatar' },
      { path: 'project', select: 'title' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task },
    });
  } catch (error) {
    console.error('Update task error:', error);
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Task creator or project owner)
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isOwner = project.owner.toString() === req.user.id;
    const isCreator = task.createdBy.toString() === req.user.id;

    if (!isOwner && !isCreator) {
      return next(new AppError('Not authorized', 403));
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    next(error);
  }
};

// @desc    Get project tasks
// @route   GET /api/projects/:projectId/tasks
// @access  Private (Project members)
exports.getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, assignee, priority } = req.query;

    console.log('📋 Fetching tasks for project:', projectId);

    const project = await Project.findById(projectId);
    if (!project) {
      console.error('❌ Project not found:', projectId);
      return next(new AppError('Project not found', 404));
    }

    const isMember =
      project.members.some((m) => m.user.toString() === req.user.id) ||
      project.owner.toString() === req.user.id;

    if (!isMember) {
      console.error('❌ User not authorized:', req.user.id);
      return next(new AppError('Not authorized', 403));
    }

    const query = { project: projectId };
    if (status) query.status = status;
    if (assignee) query.assignee = assignee;
    if (priority) query.priority = priority;

    console.log('🔍 Task query:', query);

    const tasks = await Task.find(query)
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    console.log('✅ Found tasks:', tasks.length);

    // Group tasks by status
    const groupedTasks = {
      todo: tasks.filter((t) => t.status === 'todo'),
      in_progress: tasks.filter((t) => t.status === 'in_progress'),
      review: tasks.filter((t) => t.status === 'review'),
      done: tasks.filter((t) => t.status === 'done'),
    };

    res.status(200).json({
      success: true,
      data: {
        tasks,
        groupedTasks,
        count: tasks.length,
      },
    });
  } catch (error) {
    console.error('❌ Get project tasks error:', error);
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private (Project members)
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('project', 'title');

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const project = await Project.findById(task.project._id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember =
      project.members.some((m) => m.user.toString() === req.user.id) ||
      project.owner.toString() === req.user.id;

    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('Get task error:', error);
    next(error);
  }
};