// backend/src/controllers/projectController.js - COMPLETE & FIXED
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');
const { sendEmail, emailTemplates } = require('../config/email');

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
exports.handleApplication = async (req, res, next) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return next(new AppError('Invalid status', 400));
    }

    const project = await Project.findById(req.params.id).populate(
      'owner',
      'firstName lastName'
    );

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    if (project.owner._id.toString() !== req.user.id) {
      return next(
        new AppError('Only project owner can handle applications', 403)
      );
    }

    const applicant = project.applicants.find(
      (app) => app._id.toString() === req.params.applicantId
    );

    if (!applicant) {
      return next(new AppError('Applicant not found', 404));
    }

    if (status === 'accepted') {
      if (project.isFull) {
        return next(new AppError('Project is full', 400));
      }

      project.members.push({
        user: applicant.user,
        role: 'member',
      });

      applicant.status = 'accepted';

      await Notification.createNotification({
        recipient: applicant.user,
        sender: req.user.id,
        type: 'application_accepted',
        title: 'Application Accepted',
        message: `Your application for ${project.title} has been accepted!`,
        link: `/projects/${project._id}`,
        project: project._id,
      });

      // Send email
      const applicantUser = await User.findById(applicant.user);
      if (applicantUser) {
        try {
          await sendEmail(
            applicantUser.email,
            emailTemplates.applicationApproved({
              applicantName: applicantUser.firstName,
              projectTitle: project.title,
              clientName: `${project.owner.firstName} ${project.owner.lastName}`,
              projectId: project._id,
            })
          );
        } catch (error) {
          console.error('Email send failed:', error);
        }
      }
    } else {
      applicant.status = 'rejected';

      await Notification.createNotification({
        recipient: applicant.user,
        sender: req.user.id,
        type: 'application_rejected',
        title: 'Application Update',
        message: `Your application for ${project.title} was not accepted`,
        link: `/projects`,
        project: project._id,
      });

      // Send email
      const applicantUser = await User.findById(applicant.user);
      if (applicantUser) {
        try {
          await sendEmail(
            applicantUser.email,
            emailTemplates.applicationRejected({
              applicantName: applicantUser.firstName,
              projectTitle: project.title,
            })
          );
        } catch (error) {
          console.error('Email send failed:', error);
        }
      }
    }

    await project.save();

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