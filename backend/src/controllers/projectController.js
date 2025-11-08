// backend/src/controllers/projectController.js - ENHANCED METHODS
const Project = require('../models/Project');
const emailService = require('../services/emailService');

// Apply to project - ENHANCED with email notification
exports.applyToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { coverLetter, proposedBudget } = req.body;

    const project = await Project.findById(projectId)
      .populate('owner', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot apply to your own project' });
    }

    // Check if already applied
    const alreadyApplied = project.team.some(
      member => member.user.toString() === req.user.id
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied to this project' });
    }

    // Add application
    project.team.push({
      user: req.user.id,
      role: 'freelancer',
      status: 'pending',
      coverLetter,
      proposedBudget,
      appliedAt: new Date()
    });

    await project.save();

    // Send email notification to project owner
    await emailService.sendApplicationNotification(
      project.owner.email,
      req.user.name,
      project.title,
      project._id
    );

    res.status(200).json({
      message: 'Application submitted successfully',
      project
    });
  } catch (error) {
    console.error('Apply to project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve freelancer application - ENHANCED with email
exports.approveFreelancer = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId)
      .populate('team.user', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify requester is project owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only project owner can approve applications' });
    }

    // Find team member
    const teamMember = project.team.find(
      member => member.user._id.toString() === userId
    );

    if (!teamMember) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (teamMember.status === 'approved') {
      return res.status(400).json({ message: 'Application already approved' });
    }

    // Approve the application
    teamMember.status = 'approved';
    teamMember.approvedAt = new Date();
    await project.save();

    // Send approval email to freelancer
    await emailService.sendApplicationApproved(
      teamMember.user.email,
      project.title,
      req.user.name,
      project._id
    );

    res.json({
      message: 'Freelancer approved successfully',
      project
    });
  } catch (error) {
    console.error('Approve freelancer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reject freelancer application - ENHANCED with email
exports.rejectFreelancer = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId)
      .populate('team.user', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only project owner can reject applications' });
    }

    const teamMemberIndex = project.team.findIndex(
      member => member.user._id.toString() === userId
    );

    if (teamMemberIndex === -1) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const teamMember = project.team[teamMemberIndex];

    // Send rejection email
    await emailService.sendApplicationRejected(
      teamMember.user.email,
      project.title,
      req.user.name
    );

    // Remove from team
    project.team.splice(teamMemberIndex, 1);
    await project.save();

    res.json({
      message: 'Application rejected',
      project
    });
  } catch (error) {
    console.error('Reject freelancer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create project - ENHANCED with matching notification
exports.createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      budget,
      deadline,
      tags,
      requirements
    } = req.body;

    const project = new Project({
      title,
      description,
      category,
      budget,
      deadline,
      tags: tags || [],
      requirements,
      owner: req.user.id,
      status: 'open'
    });

    await project.save();

    // Find and notify matching freelancers (async, don't wait)
    if (tags && tags.length > 0) {
      const User = require('../models/User');
      
      User.find({
        role: 'freelancer',
        skills: { $in: tags },
        emailNotifications: { $ne: false }
      }).then(freelancers => {
        if (freelancers.length > 0) {
          const freelancersWithMatches = freelancers.map(freelancer => ({
            email: freelancer.email,
            name: freelancer.name,
            matchingTags: tags.filter(tag => freelancer.skills.includes(tag))
          }));

          emailService.sendBatchProjectMatches(project, freelancersWithMatches)
            .then(() => {
              console.log(`Sent match notifications for project: ${project.title}`);
              // Mark notifications as sent
              Project.findByIdAndUpdate(project._id, { 
                matchNotificationsSent: true 
              }).catch(err => console.error('Update error:', err));
            })
            .catch(err => console.error('Match notification error:', err));
        }
      }).catch(err => console.error('Find freelancers error:', err));
    }

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add these routes to projectRoutes.js:
/*
router.post('/:projectId/apply', auth, projectController.applyToProject);
router.put('/:projectId/approve/:userId', auth, projectController.approveFreelancer);
router.delete('/:projectId/reject/:userId', auth, projectController.rejectFreelancer);
*/