// backend/src/controllers/projectController.js - COMPLETE FIXED VERSION
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

    if (category && category !== 'all') query.category = category;
    if (status && status !== 'all') query.status = status;

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

    if (status && status !== 'all') {
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
      return next(new AppError('Only project owner can update the project', 403));
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
      return next(new AppError('Only project owner can delete the project', 403));
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

    const project = await Project.findById(req.params.id).populate('owner', 'firstName lastName email');

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

    await Notification.createNotification({
      recipient: project.owner._id,
      sender: req.user.id,
      type: 'project_application',
      title: 'New Project Application',
      message: `${req.user.firstName} ${req.user.lastName} has applied to ${project.title}`,
      link: `/projects/${project._id}`,
      project: project._id,
    });

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
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
      (m) => m.user.toString() === req.params.memberId
    );

    if (memberIndex === -1) {
      return next(new AppError('Member not found', 404));
    }

    if (project.members[memberIndex].role === 'owner') {
      return next(new AppError('Cannot remove project owner', 400));
    }

    const removedMember = project.members[memberIndex];
    project.members.splice(memberIndex, 1);

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

    await Notification.createNotification({
      recipient: removedMember.user,
      sender: req.user.id,
      type: 'member_removed',
      title: 'Removed from Project',
      message: `You have been removed from ${project.title}`,
      link: `/projects`,
      project: project._id,
    });

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'firstName lastName email avatar')
      .populate('members.user', 'firstName lastName email avatar')
      .populate('applicants.user', 'firstName lastName email avatar');

    res.status(200).json({
      success: true,
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle application (accept/reject)
// @route   PUT /api/projects/:id/applicants/:applicantId
// @access  Private (Owner only)
// COMPLETE FIXED VERSION - backend/src/controllers/projectController.js
// Replace ONLY the handleApplication function

// @desc    Handle application (accept/reject)  
// @route   PUT /api/projects/:id/applicants/:applicantId
// @access  Private (Owner only)
exports.handleApplication = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const projectId = req.params.id;
    const applicantId = req.params.applicantId;
    
    console.log('🔄 handleApplication called:', { projectId, applicantId, action, ownerId: req.user.id });
    
    // Find project without population first
    let project = await Project.findById(projectId);

    if (!project) {
      console.log('❌ Project not found');
      return next(new AppError('Project not found', 404));
    }

    // Check ownership
    if (project.owner.toString() !== req.user.id) {
      console.log('❌ Not authorized - owner:', project.owner, 'user:', req.user.id);
      return next(new AppError('Only project owner can handle applications', 403));
    }

    // Find the application
    const applicationIndex = project.applicants.findIndex(
      (a) => a.user.toString() === applicantId
    );

    if (applicationIndex === -1) {
      console.log('❌ Application not found. Applicants:', project.applicants);
      return next(new AppError('Application not found', 404));
    }

    console.log('✅ Found application at index:', applicationIndex);

    if (action === 'approve') {
      // Check if project is full
      if (project.members.length >= project.maxMembers) {
        console.log('❌ Project is full:', project.members.length, '/', project.maxMembers);
        return next(new AppError('Project is full', 400));
      }

      // Check if user is already a member (compare as strings)
      const alreadyMember = project.members.some(
        (m) => m.user.toString() === applicantId
      );

      if (alreadyMember) {
        console.log('⚠️ User is already a member');
        return next(new AppError('User is already a project member', 400));
      }

      // Update application status to accepted
      project.applicants[applicationIndex].status = 'accepted';
      console.log('✅ Updated application status to accepted');

      // Add user to members array with proper structure
      project.members.push({
        user: applicantId, // Use the string ID directly
        role: 'member',
        joinedAt: new Date(),
      });

      console.log('✅ Added user to members array. Total members:', project.members.length);

      // Save the project
      await project.save();
      console.log('💾 Project saved successfully');

      // Create notification
      await createAndEmitNotification({
        recipient: project.owner._id,
        sender: req.user.id,
        type: 'project_application',
        title: 'New Project Application',
        message: `${req.user.firstName} ${req.user.lastName} has applied to ${project.title}`,
        link: `/projects/${project._id}`,
        project: project._id,
      });

      // Example 2: In handleApplication function (accept)
      await createAndEmitNotification({
        recipient: applicantId,
        sender: req.user.id,
        type: 'application_accepted',
        title: 'Application Approved!',
        message: `Your application has been approved for ${project.title}`,
        link: `/projects/${projectId}`,
        project: projectId,
      });

      // Example 3: In removeMember function
      await createAndEmitNotification({
        recipient: removedMember.user,
        sender: req.user.id,
        type: 'member_removed',
        title: 'Removed from Project',
        message: `You have been removed from ${project.title}`,
        link: `/projects`,
        project: project._id,
      });
      console.log('✅ Notification created');

    } else if (action === 'reject') {
      // Just update the application status
      project.applicants[applicationIndex].status = 'rejected';
      await project.save();
      console.log('✅ Application rejected and saved');

      // Create notification
      await Notification.createNotification({
        recipient: applicantId,
        sender: req.user.id,
        type: 'application_rejected',
        title: 'Application Update',
        message: `Your application was not accepted`,
        link: `/projects`,
        project: projectId,
      });

    } else {
      return next(new AppError('Invalid action. Use "approve" or "reject"', 400));
    }

    // NOW fetch the updated project with full population
    const updatedProject = await Project.findById(projectId)
      .populate('owner', 'firstName lastName email avatar')
      .populate('members.user', 'firstName lastName email avatar skills')
      .populate('applicants.user', 'firstName lastName email avatar skills bio');

    console.log('📤 Sending response. Members in response:', 
      updatedProject.members.length,
      updatedProject.members.map(m => ({ 
        name: m.user?.firstName, 
        role: m.role 
      }))
    );

    res.status(200).json({
      success: true,
      message: `Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: { project: updatedProject },
    });

  } catch (error) {
    console.error('❌ Error in handleApplication:', error);
    next(error);
  }
};