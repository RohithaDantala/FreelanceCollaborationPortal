// backend/controllers/paymentController.js - Fixed version
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const { createNotification } = require('./notificationController');

// Create payment - FIXED
exports.createPayment = async (req, res) => {
  try {
    const { projectId, recipientId, amount, currency, description, milestoneId } = req.body;

    // Validate project exists and user is owner
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is project owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can create payments'
      });
    }

    // Validate recipient is a project member
    const isMember = project.members.some(
      m => m.user.toString() === recipientId
    );
    
    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'Recipient must be a project member'
      });
    }

    // Create payment
    const payment = await Payment.create({
      project: projectId,
      payer: req.user.id,
      recipient: recipientId,
      amount,
      currency: currency || 'USD',
      description,
      milestone: milestoneId || null,
      status: 'pending'
    });

    // Populate payment data before sending response
    await payment.populate([
      { path: 'payer', select: 'firstName lastName email' },
      { path: 'recipient', select: 'firstName lastName email' },
      { path: 'project', select: 'title' },
      { path: 'milestone', select: 'title' }
    ]);

    // Create notification for recipient
    await createNotification({
      userId: recipientId,
      type: 'payment_created',
      title: 'New Payment Created',
      message: `A payment of ${currency} ${amount} has been created for you`,
      link: `/projects/${projectId}/payments`,
      relatedProject: projectId
    });

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: { payment }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment'
    });
  }
};

// Get project payments - FIXED to show all payments
exports.getProjectPayments = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify user is project member
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const isMember = project.members.some(
      m => m.user.toString() === req.user.id
    ) || project.owner.toString() === req.user.id;

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get all payments for this project
    const payments = await Payment.find({ project: projectId })
      .populate('payer', 'firstName lastName email avatar')
      .populate('recipient', 'firstName lastName email avatar')
      .populate('milestone', 'title')
      .sort({ createdAt: -1 });

    // Calculate earnings by currency
    const earnings = await Payment.aggregate([
      { 
        $match: { 
          project: project._id,
          status: { $in: ['released', 'held_in_escrow'] }
        } 
      },
      {
        $group: {
          _id: '$currency',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        earnings
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payments'
    });
  }
};

// Release payment from escrow - FIXED
exports.releasePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('project')
      .populate('recipient', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user is project owner
    if (payment.project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can release payments'
      });
    }

    // Check payment status
    if (payment.status !== 'held_in_escrow') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be in escrow to be released'
      });
    }

    // Release payment
    payment.status = 'released';
    payment.releasedAt = Date.now();
    await payment.save();

    // Repopulate after save
    await payment.populate([
      { path: 'payer', select: 'firstName lastName email' },
      { path: 'recipient', select: 'firstName lastName email' },
      { path: 'milestone', select: 'title' }
    ]);

    // Create notification
    await createNotification({
      userId: payment.recipient._id,
      type: 'payment_released',
      title: 'Payment Released',
      message: `Payment of ${payment.currency} ${payment.amount} has been released`,
      link: `/projects/${payment.project._id}/payments`,
      relatedProject: payment.project._id
    });

    res.status(200).json({
      success: true,
      message: 'Payment released successfully',
      data: { payment }
    });
  } catch (error) {
    console.error('Release payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to release payment'
    });
  }
};

// Hold payment in escrow - FIXED
exports.holdInEscrow = async (req, res) => {
  try {
    const { id } = req.params;
    const { escrowDays = 7 } = req.body;

    const payment = await Payment.findById(id)
      .populate('project')
      .populate('recipient', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user is project owner
    if (payment.project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can hold payments in escrow'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending payments can be held in escrow'
      });
    }

    // Hold in escrow
    payment.status = 'held_in_escrow';
    payment.escrowReleaseDate = new Date(Date.now() + escrowDays * 24 * 60 * 60 * 1000);
    await payment.save();

    // Repopulate after save
    await payment.populate([
      { path: 'payer', select: 'firstName lastName email' },
      { path: 'recipient', select: 'firstName lastName email' },
      { path: 'milestone', select: 'title' }
    ]);

    // Create notification
    await createNotification({
      userId: payment.recipient._id,
      type: 'payment_escrowed',
      title: 'Payment Held in Escrow',
      message: `Payment of ${payment.currency} ${payment.amount} is now in escrow`,
      link: `/projects/${payment.project._id}/payments`,
      relatedProject: payment.project._id
    });

    res.status(200).json({
      success: true,
      message: 'Payment held in escrow successfully',
      data: { payment }
    });
  } catch (error) {
    console.error('Hold in escrow error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to hold payment in escrow'
    });
  }
};