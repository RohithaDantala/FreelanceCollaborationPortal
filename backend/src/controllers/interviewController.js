const Interview = require('../models/Interview');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');
const { sendEmail, emailTemplates } = require('../config/email');

// Generate Google Meet/Zoom link (placeholder - you'll need to integrate with actual APIs)
const generateMeetingLink = () => {
  // For now, return a placeholder
  // In production, integrate with Google Meet API or Zoom API
  const meetingId = Math.random().toString(36).substring(7);
  return `https://meet.google.com/${meetingId}`;
};

// @desc    Propose interview dates (Freelancer)
// @route   POST /api/interviews/propose
// @access  Private (Freelancer)
exports.proposeInterviewDates = async (req, res, next) => {
  try {
    const { projectId, proposedDates } = req.body;

    const project = await Project.findById(projectId).populate('owner');
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if freelancer is a member
    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return next(new AppError('You must be a project member', 403));
    }

    // Create interview proposal
    const interview = await Interview.create({
      project: projectId,
      freelancer: req.user.id,
      client: project.owner._id,
      proposedDates: proposedDates.map(date => ({
        date,
        proposedBy: req.user.id,
        status: 'pending',
      })),
    });

    // Create notification for client
    await Notification.createNotification({
      recipient: project.owner._id,
      sender: req.user.id,
      type: 'interview_proposed',
      title: 'Interview Dates Proposed',
      message: `${req.user.firstName} ${req.user.lastName} has proposed interview dates for ${project.title}`,
      link: `/interviews/${interview._id}`,
      project: projectId,
    });

    // Send email to client
    await sendEmail(
      project.owner.email,
      {
        subject: `Interview Request for "${project.title}"`,
        html: `
          <h2>Interview Request</h2>
          <p>${req.user.firstName} ${req.user.lastName} has proposed interview dates.</p>
          <p>Please review and confirm a date.</p>
          <a href="${process.env.CLIENT_URL}/interviews/${interview._id}">View Proposal</a>
        `,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Interview dates proposed successfully',
      data: { interview },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve interview date (Client)
// @route   PUT /api/interviews/:id/approve
// @access  Private (Client)
exports.approveInterviewDate = async (req, res, next) => {
  try {
    const { dateId } = req.body;

    const interview = await Interview.findById(req.params.id)
      .populate('freelancer')
      .populate('project');

    if (!interview) {
      return next(new AppError('Interview not found', 404));
    }

    if (interview.client.toString() !== req.user.id) {
      return next(new AppError('Only the client can approve dates', 403));
    }

    // Find the proposed date
    const proposedDate = interview.proposedDates.id(dateId);
    if (!proposedDate) {
      return next(new AppError('Proposed date not found', 404));
    }

    // Update interview
    interview.confirmedDate = proposedDate.date;
    interview.status = 'scheduled';
    interview.meetingLink = generateMeetingLink();
    proposedDate.status = 'accepted';

    await interview.save();

    // Create notification for freelancer
    await Notification.createNotification({
      recipient: interview.freelancer._id,
      sender: req.user.id,
      type: 'interview_scheduled',
      title: 'Interview Scheduled!',
      message: `Your interview for ${interview.project.title} has been scheduled`,
      link: `/interviews/${interview._id}`,
      project: interview.project._id,
    });

    // Send email to both parties
    await sendEmail(
      interview.freelancer.email,
      emailTemplates.interviewScheduled(
        interview.freelancer.firstName,
        interview.project.title,
        interview.confirmedDate,
        interview.meetingLink
      )
    );

    await sendEmail(
      req.user.email,
      emailTemplates.interviewScheduled(
        req.user.firstName,
        interview.project.title,
        interview.confirmedDate,
        interview.meetingLink
      )
    );

    res.status(200).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: { interview },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's interviews
// @route   GET /api/interviews/my-interviews
// @access  Private
exports.getMyInterviews = async (req, res, next) => {
  try {
    const query = {
      $or: [
        { freelancer: req.user.id },
        { client: req.user.id },
      ],
    };

    const interviews = await Interview.find(query)
      .populate('freelancer', 'firstName lastName email avatar')
      .populate('client', 'firstName lastName email avatar')
      .populate('project', 'title')
      .sort({ createdDate: -1 });

    res.status(200).json({
      success: true,
      data: { interviews },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single interview
// @route   GET /api/interviews/:id
// @access  Private
exports.getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('freelancer', 'firstName lastName email avatar')
      .populate('client', 'firstName lastName email avatar')
      .populate('project', 'title description');

    if (!interview) {
      return next(new AppError('Interview not found', 404));
    }

    // Check authorization
    const isAuthorized = 
      interview.freelancer._id.toString() === req.user.id ||
      interview.client._id.toString() === req.user.id;

    if (!isAuthorized) {
      return next(new AppError('Not authorized', 403));
    }

    res.status(200).json({
      success: true,
      data: { interview },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel interview
// @route   DELETE /api/interviews/:id
// @access  Private
exports.cancelInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return next(new AppError('Interview not found', 404));
    }

    const isAuthorized = 
      interview.freelancer.toString() === req.user.id ||
      interview.client.toString() === req.user.id;

    if (!isAuthorized) {
      return next(new AppError('Not authorized', 403));
    }

    interview.status = 'cancelled';
    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Interview cancelled',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;