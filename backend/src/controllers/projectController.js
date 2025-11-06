const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      skillsRequired,
      budget,
      timeline,
      milestones,
      tags,
      isPublic,
      maxMembers,
    } = req.body;

    const project = await Project.create({
      title,
      description,
      category,
      owner: req.user.id,
      skillsRequired,
      budget,
      timeline,
      milestones,
      tags,
      isPublic,
      maxMembers,
      status: 'open',
    });

    // Populate owner details
    await project.populate('owner', 'firstName lastName email avatar');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects (with filters)
// @route   GET /api/projects
// @access  Public
exports.getAllProjects = async (req, res, next) => {
  try {
    const {
      status,
      category,
      skills,
      search,
      page = 1,
      limit = 12,
      sort = '-createdAt',
    } = req.query;

    const query = { isPublic: true };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by skills
    if (skills) {
      const skillsArray = skills.split(',');
      query.skillsRequired = { $in: skillsArray };
    }

    // Search by title or description
    if (search) {
      query.$text = { $search: search };
    }

    const projects = await Project.find(query)
      .populate('owner', 'firstName lastName email avatar')
      .populate('members.user', 'firstName lastName avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const count = await Project.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        projects,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalProjects: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'firstName lastName email avatar bio')
      .populate('members.user', 'firstName lastName avatar skills')
      .populate('applicants.user', 'firstName lastName avatar skills');

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's projects
// @route   GET /api/projects/my-projects
// @access  Private
exports.getMyProjects = async (req, res, next) => {
  try {
    const { status, role } = req.query;

    const query = {
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id },
      ],
    };

    if (status) {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate('owner', 'firstName lastName avatar')
      .populate('members.user', 'firstName lastName avatar')
      .sort('-updatedAt');

    res.status(200).json({
      success: true,
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Owner only)
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return next(
        new AppError('Not authorized to update this project', 403)
      );
    }

    const {
      title,
      description,
      category,
      skillsRequired,
      budget,
      timeline,
      milestones,
      tags,
      status,
      isPublic,
      maxMembers,
    } = req.body;

    project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        category,
        skillsRequired,
        budget,
        timeline,
        milestones,
        tags,
        status,
        isPublic,
        maxMembers,
      },
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName avatar');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Owner only)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return next(
        new AppError('Not authorized to delete this project', 403)
      );
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply to join project
// @route   POST /api/projects/:id/apply
// @access  Private
exports.applyToProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if already a member
    if (project.members.some(m => m.user.toString() === req.user.id)) {
      return next(new AppError('You are already a member of this project', 400));
    }

    // Check if already applied
    if (project.applicants.some(a => a.user.toString() === req.user.id)) {
      return next(new AppError('You have already applied to this project', 400));
    }

    // Check if project is full
    if (project.members.length >= project.maxMembers) {
      return next(new AppError('This project is full', 400));
    }

    const { message } = req.body;

    project.applicants.push({
      user: req.user.id,
      message,
      appliedAt: Date.now(),
      status: 'pending',
    });

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept/Reject application
// @route   PUT /api/projects/:id/applicants/:applicantId
// @access  Private (Owner only)
exports.handleApplication = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    const { status } = req.body; // 'accepted' or 'rejected'
    const applicantId = req.params.applicantId;

    const applicant = project.applicants.find(
      a => a.user.toString() === applicantId
    );

    if (!applicant) {
      return next(new AppError('Applicant not found', 404));
    }

    applicant.status = status;

    // If accepted, add to members
    const isMember = project.members.some(m => m.user.toString() === applicantId);
    if (status === 'accepted') {  
      if (!isMember) {
        project.members.push({
          user: applicantId,
          role: 'member',
          joinedAt: Date.now(),
        });
      }
    }

    await project.save();
    
    await project.populate([
      { path: 'owner', select: 'firstName lastName email avatar' },
      { path: 'members.user', select: 'firstName lastName avatar' },
      { path: 'applicants.user', select: 'firstName lastName avatar' }
    ]);
    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:memberId
// @access  Private (Owner only)
exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    const memberId = req.params.memberId;

    // Cannot remove owner
    if (memberId === project.owner.toString()) {
      return next(new AppError('Cannot remove project owner', 400));
    }

    project.members = project.members.filter(
      m => m.user.toString() !== memberId
    );

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};