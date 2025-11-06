const Task = require('../models/Task');
const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');

// @desc    Create new task
// @route   POST /api/projects/:projectId/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      assignee,
      status,
      priority,
      deadline,
      labels,
      estimatedHours,
    } = req.body;

    // Check if project exists and user is a member
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(
        new AppError('You must be a project member to create tasks', 403)
      );
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignee: assignee || null,
      createdBy: req.user.id,
      status: status || 'todo',
      priority: priority || 'medium',
      deadline,
      labels,
      estimatedHours,
    });

    // Populate references
    await task.populate([
      { path: 'assignee', select: 'firstName lastName avatar' },
      { path: 'createdBy', select: 'firstName lastName avatar' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Private
exports.getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Check if project exists and user is a member
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(
        new AppError('You must be a project member to view tasks', 403)
      );
    }

    // Get all tasks for the project
    const tasks = await Task.find({ project: projectId })
      .populate('assignee', 'firstName lastName avatar')
      .populate('createdBy', 'firstName lastName avatar')
      .sort({ order: 1, createdAt: -1 });

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
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'firstName lastName avatar email')
      .populate('createdBy', 'firstName lastName avatar')
      .populate('project', 'title');

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Check if user is a member of the project
    const project = await Project.findById(task.project._id);
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized to view this task', 403));
    }

    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Check if user is a member of the project
    const project = await Project.findById(task.project);
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized to update this task', 403));
    }

    const {
      title,
      description,
      assignee,
      status,
      priority,
      deadline,
      labels,
      estimatedHours,
    } = req.body;

    // Update task
    task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        assignee,
        status,
        priority,
        deadline,
        labels,
        estimatedHours,
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'assignee', select: 'firstName lastName avatar' },
      { path: 'createdBy', select: 'firstName lastName avatar' },
    ]);

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
// @access  Private
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Check if user is a member of the project
    const project = await Project.findById(task.project);
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized to delete this task', 403));
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

// @desc    Add subtask
// @route   POST /api/tasks/:id/subtasks
// @access  Private
exports.addSubtask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const { title } = req.body;

    if (!title) {
      return next(new AppError('Subtask title is required', 400));
    }

    task.subtasks.push({
      title,
      completed: false,
      createdAt: Date.now(),
    });

    await task.save();

    await task.populate([
      { path: 'assignee', select: 'firstName lastName avatar' },
      { path: 'createdBy', select: 'firstName lastName avatar' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Subtask added successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle subtask completion
// @route   PUT /api/tasks/:id/subtasks/:subtaskId
// @access  Private
exports.toggleSubtask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const subtask = task.subtasks.id(req.params.subtaskId);

    if (!subtask) {
      return next(new AppError('Subtask not found', 404));
    }

    subtask.completed = !subtask.completed;

    await task.save();

    await task.populate([
      { path: 'assignee', select: 'firstName lastName avatar' },
      { path: 'createdBy', select: 'firstName lastName avatar' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Subtask updated successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subtask
// @route   DELETE /api/tasks/:id/subtasks/:subtaskId
// @access  Private
exports.deleteSubtask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    task.subtasks = task.subtasks.filter(
      (st) => st._id.toString() !== req.params.subtaskId
    );

    await task.save();

    await task.populate([
      { path: 'assignee', select: 'firstName lastName avatar' },
      { path: 'createdBy', select: 'firstName lastName avatar' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Subtask deleted successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder tasks (for drag and drop)
// @route   PUT /api/projects/:projectId/tasks/reorder
// @access  Private
exports.reorderTasks = async (req, res, next) => {
  try {
    const { tasks } = req.body; // Array of { id, order, status }

    if (!tasks || !Array.isArray(tasks)) {
      return next(new AppError('Invalid tasks data', 400));
    }

    // Update all tasks with new order
    const updatePromises = tasks.map((taskData) =>
      Task.findByIdAndUpdate(taskData.id, {
        order: taskData.order,
        status: taskData.status,
      })
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Tasks reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};