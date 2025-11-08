// backend/src/controllers/taskController.js - WITH NOTIFICATIONS
const Task = require('../models/Task');
const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');
const { createAndEmitNotification } = require('../utils/notificationHelper');

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (Project members)
exports.createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      project,
      assignedTo,
      priority,
      deadline,
      tags,
      status,
    } = req.body;

    // Verify project exists and user is a member
    const projectDoc = await Project.findById(project);
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
      project,
      assignedTo,
      assignedBy: req.user.id,
      priority: priority || 'medium',
      deadline,
      tags,
      status: status || 'todo',
    });

    await task.populate([
      { path: 'assignedTo', select: 'firstName lastName email avatar' },
      { path: 'assignedBy', select: 'firstName lastName email avatar' },
    ]);

    // 🔔 Send notification to assigned user
    if (assignedTo && assignedTo !== req.user.id) {
      await createAndEmitNotification({
        recipient: assignedTo,
        sender: req.user.id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${req.user.firstName} ${req.user.lastName} assigned you a task: "${title}"`,
        link: `/projects/${project}/tasks`,
        project: project,
        task: task._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
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
    const isMember =
      project.members.some((m) => m.user.toString() === req.user.id) ||
      project.owner.toString() === req.user.id;

    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    const oldStatus = task.status;
    const oldAssignedTo = task.assignedTo?.toString();

    const {
      title,
      description,
      assignedTo,
      priority,
      deadline,
      tags,
      status,
    } = req.body;

    // Update task fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = deadline;
    if (tags) task.tags = tags;
    if (status) task.status = status;

    await task.save();
    await task.populate([
      { path: 'assignedTo', select: 'firstName lastName email avatar' },
      { path: 'assignedBy', select: 'firstName lastName email avatar' },
      { path: 'project', select: 'title' },
    ]);

    // 🔔 NOTIFICATION: Status changed
    if (status && status !== oldStatus) {
      const statusMessages = {
        todo: 'moved to To Do',
        in_progress: 'started working on',
        review: 'submitted for review',
        done: 'completed',
      };

      // Notify project owner
      if (project.owner.toString() !== req.user.id) {
        await createAndEmitNotification({
          recipient: project.owner,
          sender: req.user.id,
          type: status === 'done' ? 'task_completed' : 'task_updated',
          title: status === 'done' ? 'Task Completed!' : 'Task Status Updated',
          message: `${req.user.firstName} ${req.user.lastName} ${statusMessages[status]} "${task.title}"`,
          link: `/projects/${task.project._id}/tasks`,
          project: task.project._id,
          task: task._id,
        });
      }

      // Notify assigned user if they didn't make the change
      if (task.assignedTo && task.assignedTo._id.toString() !== req.user.id) {
        await createAndEmitNotification({
          recipient: task.assignedTo._id,
          sender: req.user.id,
          type: 'task_updated',
          title: 'Task Status Changed',
          message: `${req.user.firstName} changed the status of "${task.title}" to ${status.replace('_', ' ')}`,
          link: `/projects/${task.project._id}/tasks`,
          project: task.project._id,
          task: task._id,
        });
      }
    }

    // 🔔 NOTIFICATION: Task reassigned
    if (assignedTo && oldAssignedTo !== assignedTo) {
      await createAndEmitNotification({
        recipient: assignedTo,
        sender: req.user.id,
        type: 'task_assigned',
        title: 'Task Assigned to You',
        message: `${req.user.firstName} ${req.user.lastName} assigned you "${task.title}"`,
        link: `/projects/${task.project._id}/tasks`,
        project: task.project._id,
        task: task._id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task },
    });
  } catch (error) {
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
    const isOwner = project.owner.toString() === req.user.id;
    const isCreator = task.assignedBy.toString() === req.user.id;

    if (!isOwner && !isCreator) {
      return next(new AppError('Not authorized', 403));
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project tasks
// @route   GET /api/tasks/project/:projectId
// @access  Private (Project members)
exports.getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, assignedTo, priority } = req.query;

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember =
      project.members.some((m) => m.user.toString() === req.user.id) ||
      project.owner.toString() === req.user.id;

    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    const query = { project: projectId };
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('assignedBy', 'firstName lastName email avatar')
      .sort({ createdAt: -1 });

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
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private (Project members)
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('assignedBy', 'firstName lastName email avatar')
      .populate('project', 'title');

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const project = await Project.findById(task.project._id);
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
    next(error);
  }
};