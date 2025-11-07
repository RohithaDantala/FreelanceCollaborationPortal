// backend/src/controllers/milestoneController.js
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');

// @desc    Create milestone
// @route   POST /api/projects/:projectId/milestones
// @access  Private (Project owner/members)
exports.createMilestone = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, dueDate, dependencies } = req.body;

    // Check if project exists and user is a member
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    // Get current milestone count for order
    const milestoneCount = await Milestone.countDocuments({
      project: projectId,
      isActive: true,
    });

    const milestone = await Milestone.create({
      title,
      description,
      project: projectId,
      dueDate,
      dependencies: dependencies || [],
      order: milestoneCount,
    });

    res.status(201).json({
      success: true,
      message: 'Milestone created successfully',
      data: { milestone },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project milestones
// @route   GET /api/projects/:projectId/milestones
// @access  Private (Project members)
exports.getProjectMilestones = async (req, res, next) => {
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
      return next(new AppError('Not authorized', 403));
    }

    const milestones = await Milestone.find({
      project: projectId,
      isActive: true,
    })
      .populate('dependencies', 'title status')
      .populate('tasks', 'title status')
      .sort({ order: 1 });

    // Calculate progress for each milestone
    for (const milestone of milestones) {
      await milestone.calculateProgress();
      await milestone.save({ validateBeforeSave: false });
    }

    res.status(200).json({
      success: true,
      data: { milestones },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single milestone
// @route   GET /api/milestones/:id
// @access  Private (Project members)
exports.getMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.id)
      .populate('dependencies', 'title status')
      .populate('tasks', 'title status assignee')
      .populate('deliverables', 'originalName fileUrl fileType');

    if (!milestone) {
      return next(new AppError('Milestone not found', 404));
    }

    // Check if user is a project member
    const project = await Project.findById(milestone.project);
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    res.status(200).json({
      success: true,
      data: { milestone },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update milestone
// @route   PUT /api/milestones/:id
// @access  Private (Project members)
exports.updateMilestone = async (req, res, next) => {
  try {
    let milestone = await Milestone.findById(req.params.id);

    if (!milestone) {
      return next(new AppError('Milestone not found', 404));
    }

    // Check if user is a project member
    const project = await Project.findById(milestone.project);
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    const { title, description, dueDate, status, dependencies } = req.body;

    milestone = await Milestone.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        dueDate,
        status,
        dependencies,
      },
      { new: true, runValidators: true }
    )
      .populate('dependencies', 'title status')
      .populate('tasks', 'title status');

    res.status(200).json({
      success: true,
      message: 'Milestone updated successfully',
      data: { milestone },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete milestone
// @route   DELETE /api/milestones/:id
// @access  Private (Project owner)
exports.deleteMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.id);

    if (!milestone) {
      return next(new AppError('Milestone not found', 404));
    }

    // Check if user is project owner
    const project = await Project.findById(milestone.project);
    const isOwner = project.owner.toString() === req.user.id;

    if (!isOwner) {
      return next(new AppError('Only project owner can delete milestones', 403));
    }

    // Soft delete
    milestone.isActive = false;
    await milestone.save();

    res.status(200).json({
      success: true,
      message: 'Milestone deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Link task to milestone
// @route   POST /api/milestones/:id/tasks/:taskId
// @access  Private (Project members)
exports.linkTaskToMilestone = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;

    const milestone = await Milestone.findById(id);
    if (!milestone) {
      return next(new AppError('Milestone not found', 404));
    }

    // Check authorization
    const project = await Project.findById(milestone.project);
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    // Add task if not already linked
    if (!milestone.tasks.includes(taskId)) {
      milestone.tasks.push(taskId);
      await milestone.save();
      await milestone.calculateProgress();
      await milestone.save({ validateBeforeSave: false });
    }

    res.status(200).json({
      success: true,
      message: 'Task linked to milestone',
      data: { milestone },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project progress summary
// @route   GET /api/projects/:projectId/progress
// @access  Private (Project members)
exports.getProjectProgress = async (req, res, next) => {
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
      return next(new AppError('Not authorized', 403));
    }

    const milestones = await Milestone.find({
      project: projectId,
      isActive: true,
    }).populate('tasks');

    // CRITICAL FIX: Recalculate progress for each milestone
    for (const milestone of milestones) {
      await milestone.calculateProgress();
      await milestone.save({ validateBeforeSave: false });
    }

    // Refresh milestones after calculation
    const updatedMilestones = await Milestone.find({
      project: projectId,
      isActive: true,
    }).populate('tasks');

    // Calculate overall progress
    const overallProgress = await Milestone.getProjectProgress(projectId);

    // Get milestone statistics
    const totalMilestones = updatedMilestones.length;
    const completedMilestones = updatedMilestones.filter(
      (m) => m.status === 'completed'
    ).length;
    const inProgressMilestones = updatedMilestones.filter(
      (m) => m.status === 'in_progress'
    ).length;
    const overdueMilestones = updatedMilestones.filter(
      (m) => m.isOverdue && m.status !== 'completed'
    ).length;

    // Get upcoming milestones
    const upcomingMilestones = updatedMilestones
      .filter((m) => m.status !== 'completed')
      .sort((a, b) => a.dueDate - b.dueDate)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        overallProgress,
        statistics: {
          totalMilestones,
          completedMilestones,
          inProgressMilestones,
          overdueMilestones,
        },
        upcomingMilestones,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder milestones
// @route   PUT /api/projects/:projectId/milestones/reorder
// @access  Private (Project members)
exports.reorderMilestones = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { milestones } = req.body; // Array of { id, order }

    if (!milestones || !Array.isArray(milestones)) {
      return next(new AppError('Invalid milestones data', 400));
    }

    // Check authorization
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    // Update all milestones with new order
    const updatePromises = milestones.map((milestoneData) =>
      Milestone.findByIdAndUpdate(milestoneData.id, {
        order: milestoneData.order,
      })
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Milestones reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};