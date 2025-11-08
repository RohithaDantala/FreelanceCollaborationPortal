// backend/src/controllers/projectController.js - COMPLETE & FIXED
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');
const { sendEmail, emailTemplates } = require('../services/emailService');

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
      tags,
      isPublic,
      maxMembers,
    } = req.body;

    const project = await Project.create({
      title,
      description,
      category,
      skillsRequired,
      budget,
      timeline,
      tags,
      isPublic: isPublic !== undefined ? isPublic : true,
      maxMembers: maxMembers || 10,
      owner: req.user.id,
      status: 'open',
    });

    await project.populate('owner', 'firstName lastName email');

    // Find matching freelancers and notify them (async, don't wait)
    if (tags && tags.length > 0) {
      User.find({
        role: 'freelancer',
        skills: { $in: tags },
      })
        .then(async (freelancers) => {
          if (freelancers.length > 0) {
            for (const freelancer of freelancers) {
              const matchingSkills = tags.filter((tag) =>
                freelancer.skills.includes(tag)
              );

              try {
                await sendEmail(
                  freelancer.email,
                  emailTemplates.projectCreated({
                    freelancerName: freelancer.firstName,
                    projectTitle: project.title,
                    clientName: `${project.owner.firstName} ${project.owner.lastName}`,
                    skills: matchingSkills,
                    projectId: project._id,
                  })
                );
              } catch (error) {
                console.error('Email notification failed:', error);
              }
            }
          }
        })
        .catch((err) => console.error('Find freelancers error:', err));
    }

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
      category,
      skills,
      status,
      minBudget,
      maxBudget,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isPublic: true };

    if (category) query.category = category;
    if (status) query.status = status;

    if (skills) {
      const skillsArray = skills.split(',').map((s) => s.trim());
      query.skillsRequired = { $in: skillsArray };
    }

    if (minBudget || maxBudget) {
      query['budget.min'] = {};
      if (minBudget) query['budget.min'].$gte = Number(minBudget);
      if (maxBudget) query['budget.max'].$lte = Number(maxBudget);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(query)
      .populate('owner', 'firstName lastName avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

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
      .populate('applicants.user', 'firstName lastName avatar skills bio');

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

// @desc    Get current user's projects
// @route   GET /api/projects/user/my-projects
// @access  Private
exports.getMyProjects = async (req, res, next) => {
  try {
    const { role, status } = req.query;

    let query;

    if (role === 'owner') {
      query = { owner: req.user.id };
    } else if (role === 'member') {
      query = { 'members.user': req.user.id };
    } else {
      query = {
        $or: [{ owner: req.user.id }, { 'members.user': req.user.id }],
      };
    }

    if (status) {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate('owner', 'firstName lastName avatar')
      .populate('members.user', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

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

    if (project.owner.toString() !== req.user.id) {
      return next(
        new AppError('Only project owner can update the project', 403)
      );
    }

    const {
      title,
      description,
      category,
      skillsRequired,
      budget,
      timeline,
      tags,
      status,
      isPublic,
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
        tags,
        status,
        isPublic,
      },
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email avatar');

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

    if (project.owner.toString() !== req.user.id) {
      return next(
        new AppError('Only project owner can delete the project', 403)
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

// @desc    Apply to project
// @route   POST /api/projects/:id/apply
// @access  Private (Freelancers)
exports.applyToProject = async (req, res, next) => {
  try {
    const { message } = req.body;

    const project = await Project.findById(req.params.id).populate(
      'owner',
      'firstName lastName email'
    );

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    if (project.owner._id.toString() === req.user.id) {
      return next(new AppError('Cannot apply to your own project', 400));
    }

    if (project.isFull) {
      return next(new AppError('Project is full', 400));
    }

    const alreadyApplied = project.applicants.some(
      (app) => app.user.toString() === req.user.id
    );

    if (alreadyApplied) {
      return next(new AppError('You have already applied to this project', 400));
    }

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );

    if (alreadyMember) {
      return next(new AppError('You are already a member of this project', 400));
    }

    project.applicants.push({
      user: req.user.id,
      message: message || '',
      status: 'pending',
    });

    await project.save();

    // Send notification to project owner
    await Notification.createNotification({
      recipient: project.owner._id,
      sender: req.user.id,
      type: 'project_application',
      title: 'New Project Application',
      message: `${req.user.firstName} ${req.user.lastName} has applied to ${project.title}`,
      link: `/projects/${project._id}`,
      project: project._id,
    });

    // Send email
    try {
      await sendEmail(
        project.owner.email,
        emailTemplates.applicationReceived({
          applicantName: `${req.user.firstName} ${req.user.lastName}`,
          projectTitle: project.title,
          clientName: project.owner.firstName,
          projectId: project._id,
        })
      );
    } catch (error) {
      console.error('Email send failed:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle application (accept/reject)
// @route   PUT /api/projects/:id/applicants/:applicantId
// @access  Private (Owner only)
// backend/src/controllers/projectController.js
// Add this function or update your existing handleApplication function

const Project = require('../models/Project');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = asyncHandler(async (req, res) => {
  const projectData = {
    ...req.body,
    owner: req.user._id,
  };

  const project = await Project.create(projectData);
  const populatedProject = await Project.findById(project._id)
    .populate('owner', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar');

  res.status(201).json({
    success: true,
    data: { project: populatedProject },
  });
});

// @desc    Get all projects (with filters)
// @route   GET /api/projects
// @access  Public
const getAllProjects = asyncHandler(async (req, res) => {
  const { category, status, search, page = 1, limit = 10 } = req.query;

  const query = { isPublic: true };

  if (category && category !== 'all') query.category = category;
  if (status && status !== 'all') query.status = status;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const projects = await Project.find(query)
    .populate('owner', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Project.countDocuments(query);

  res.json({
    success: true,
    data: {
      projects,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalProjects: total,
    },
  });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar')
    .populate('applicants.user', 'firstName lastName email avatar');

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  res.json({
    success: true,
    data: { project },
  });
});

// @desc    Get my projects
// @route   GET /api/projects/user/my-projects
// @access  Private
const getMyProjects = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {
    $or: [
      { owner: req.user._id },
      { 'members.user': req.user._id }
    ]
  };

  if (status && status !== 'all') {
    query.status = status;
  }

  const projects = await Project.find(query)
    .populate('owner', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar')
    .sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: { projects },
  });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Owner only)
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this project');
  }

  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('owner', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar');

  res.json({
    success: true,
    data: { project: updatedProject },
  });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Owner only)
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this project');
  }

  await project.deleteOne();

  res.json({
    success: true,
    data: {},
  });
});

// @desc    Apply to join a project
// @route   POST /api/projects/:id/apply
// @access  Private
const applyToProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is already a member
  const isMember = project.members.some(
    (m) => m.user.toString() === req.user._id.toString()
  );

  if (isMember) {
    res.status(400);
    throw new Error('You are already a member of this project');
  }

  // Check if user has already applied
  const hasApplied = project.applicants.some(
    (a) => a.user.toString() === req.user._id.toString()
  );

  if (hasApplied) {
    res.status(400);
    throw new Error('You have already applied to this project');
  }

  // Check if project is full
  if (project.members.length >= project.maxMembers) {
    res.status(400);
    throw new Error('This project is full');
  }

  // Add application
  project.applicants.push({
    user: req.user._id,
    message: req.body.message,
    status: 'pending',
  });

  await project.save();

  res.json({
    success: true,
    message: 'Application submitted successfully',
  });
});

// @desc    Handle application (accept/reject)
// @route   PUT /api/projects/:id/applicants/:applicantId
// @access  Private (Owner only)
const handleApplication = asyncHandler(async (req, res) => {
  const { action } = req.body; // ✅ Expecting 'approve' or 'reject'
  
  const project = await Project.findById(req.params.id)
    .populate('owner', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar')
    .populate('applicants.user', 'firstName lastName email avatar');

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is project owner
  if (project.owner._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only project owner can handle applications');
  }

  // Find the application
  const application = project.applicants.find(
    (a) => a.user._id.toString() === req.params.applicantId
  );

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // ✅ Map 'approve' to 'accepted' and 'reject' to 'rejected'
  if (action === 'approve') {
    // Check if project is full
    if (project.members.length >= project.maxMembers) {
      res.status(400);
      throw new Error('Project is full');
    }

    // Update application status to 'accepted' (NOT 'approved')
    application.status = 'accepted';

    // Add user to members with 'member' role (lowercase, NOT 'Member')
    project.members.push({
      user: application.user._id,
      role: 'member',
      joinedAt: new Date(),
    });
  } else if (action === 'reject') {
    // Update application status to 'rejected'
    application.status = 'rejected';
  } else {
    res.status(400);
    throw new Error('Invalid action. Use "approve" or "reject"');
  }

  await project.save();

  // Populate and return updated project
  const updatedProject = await Project.findById(project._id)
    .populate('owner', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar')
    .populate('applicants.user', 'firstName lastName email avatar');

  res.json({
    success: true,
    data: { project: updatedProject },
  });
});

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:memberId
// @access  Private (Owner only)
const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only project owner can remove members');
  }

  // Find member
  const memberIndex = project.members.findIndex(
    (m) => m.user.toString() === req.params.memberId
  );

  if (memberIndex === -1) {
    res.status(404);
    throw new Error('Member not found');
  }

  // Can't remove owner
  if (project.members[memberIndex].role === 'owner') {
    res.status(400);
    throw new Error('Cannot remove project owner');
  }

  // Remove member
  project.members.splice(memberIndex, 1);

  // Add to applicants with 'removed' status
  const existingApplicant = project.applicants.find(
    (a) => a.user.toString() === req.params.memberId
  );

  if (existingApplicant) {
    existingApplicant.status = 'removed';
  } else {
    project.applicants.push({
      user: req.params.memberId,
      status: 'removed',
      appliedAt: new Date(),
    });
  }

  await project.save();

  const updatedProject = await Project.findById(project._id)
    .populate('owner', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar')
    .populate('applicants.user', 'firstName lastName email avatar');

  res.json({
    success: true,
    data: { project: updatedProject },
  });
});

module.exports = {
  createProject,
  getAllProjects,
  getProject,
  getMyProjects,
  updateProject,
  deleteProject,
  applyToProject,
  handleApplication,
  removeMember,
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

    if (project.owner.toString() !== req.user.id) {
      return next(new AppError('Only project owner can remove members', 403));
    }

    const memberIndex = project.members.findIndex(
      (m) => m._id.toString() === req.params.memberId
    );

    if (memberIndex === -1) {
      return next(new AppError('Member not found', 404));
    }

    const member = project.members[memberIndex];

    if (member.user.toString() === project.owner.toString()) {
      return next(new AppError('Cannot remove project owner', 400));
    }

    project.members.splice(memberIndex, 1);
    await project.save();

    await Notification.createNotification({
      recipient: member.user,
      sender: req.user.id,
      type: 'member_removed',
      title: 'Removed from Project',
      message: `You have been removed from ${project.title}`,
      link: `/projects`,
      project: project._id,
    });

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    next(error);
  }
};