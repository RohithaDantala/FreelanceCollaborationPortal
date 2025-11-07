// backend/src/controllers/paymentController.js
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private (Project Owner)
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { projectId, milestoneId, amount, currency, recipientId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    if (project.owner.toString() !== req.user.id) {
      return next(new AppError('Only project owner can create payments', 403));
    }

    const payment = await Payment.create({
      project: projectId,
      milestone: milestoneId || null,
      payer: req.user.id,
      recipient: recipientId,
      amount,
      currency,
      status: 'pending',
      description: req.body.description || '',
    });

    await payment.populate([
      { path: 'payer', select: 'firstName lastName email' },
      { path: 'recipient', select: 'firstName lastName email' },
      { path: 'project', select: 'title' },
    ]);

    // Create notification for recipient
    await Notification.createNotification({
      recipient: recipientId,
      sender: req.user.id,
      type: 'payment_created',
      title: 'Payment Initiated',
      message: `A payment of ${amount} ${currency} has been initiated for your work`,
      link: `/projects/${projectId}/payments`,
      project: projectId,
    });

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Hold payment in escrow
// @route   POST /api/payments/:id/escrow
// @access  Private
exports.holdInEscrow = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    if (payment.payer.toString() !== req.user.id) {
      return next(new AppError('Unauthorized', 403));
    }

    payment.status = 'held_in_escrow';
    payment.escrowReleaseDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await payment.save();

    await Notification.createNotification({
      recipient: payment.recipient,
      sender: req.user.id,
      type: 'payment_escrowed',
      title: 'Payment Held in Escrow',
      message: `Payment of ${payment.amount} ${payment.currency} is now held in escrow`,
      link: `/projects/${payment.project}/payments`,
      project: payment.project,
    });

    res.status(200).json({
      success: true,
      message: 'Payment held in escrow',
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Release payment from escrow
// @route   POST /api/payments/:id/release
// @access  Private
exports.releasePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    if (payment.payer.toString() !== req.user.id) {
      return next(new AppError('Only payer can release payment', 403));
    }

    if (payment.status !== 'held_in_escrow') {
      return next(new AppError('Payment is not in escrow', 400));
    }

    payment.status = 'released';
    payment.releasedAt = Date.now();
    await payment.save();

    await Notification.createNotification({
      recipient: payment.recipient,
      sender: req.user.id,
      type: 'payment_released',
      title: 'Payment Released!',
      message: `Payment of ${payment.amount} ${payment.currency} has been released to you`,
      link: `/projects/${payment.project}/payments`,
      project: payment.project,
    });

    res.status(200).json({
      success: true,
      message: 'Payment released successfully',
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request refund
// @route   POST /api/payments/:id/refund
// @access  Private
exports.requestRefund = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    if (payment.payer.toString() !== req.user.id) {
      return next(new AppError('Unauthorized', 403));
    }

    if (payment.status === 'released') {
      return next(new AppError('Cannot refund released payment', 400));
    }

    payment.status = 'refunded';
    payment.refundedAt = Date.now();
    payment.refundReason = reason;
    await payment.save();

    await Notification.createNotification({
      recipient: payment.recipient,
      sender: req.user.id,
      type: 'payment_refunded',
      title: 'Payment Refunded',
      message: `Payment of ${payment.amount} ${payment.currency} has been refunded`,
      link: `/projects/${payment.project}/payments`,
      project: payment.project,
    });

    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully',
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create dispute
// @route   POST /api/payments/:id/dispute
// @access  Private
exports.createDispute = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    const isInvolved =
      payment.payer.toString() === req.user.id ||
      payment.recipient.toString() === req.user.id;

    if (!isInvolved) {
      return next(new AppError('Unauthorized', 403));
    }

    payment.status = 'disputed';
    payment.dispute = {
      reason,
      createdAt: Date.now(),
    };
    await payment.save();

    const otherParty =
      payment.payer.toString() === req.user.id ? payment.recipient : payment.payer;

    await Notification.createNotification({
      recipient: otherParty,
      sender: req.user.id,
      type: 'payment_disputed',
      title: 'Payment Disputed',
      message: `A dispute has been raised for payment of ${payment.amount} ${payment.currency}`,
      link: `/projects/${payment.project}/payments`,
      project: payment.project,
    });

    res.status(200).json({
      success: true,
      message: 'Dispute created successfully',
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project payments
// @route   GET /api/projects/:projectId/payments
// @access  Private
exports.getProjectPayments = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember = project.members.some((m) => m.user.toString() === req.user.id);
    if (!isMember) {
      return next(new AppError('Unauthorized', 403));
    }

    const query = { project: projectId };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('payer', 'firstName lastName email avatar')
      .populate('recipient', 'firstName lastName email avatar')
      .populate('milestone', 'title')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Payment.countDocuments(query);
    const earnings = await Payment.getProjectEarnings(projectId);

    res.status(200).json({
      success: true,
      data: {
        payments,
        earnings,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalPayments: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user payments
// @route   GET /api/payments/my-payments
// @access  Private
exports.getMyPayments = async (req, res, next) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;

    let query = {};
    if (type === 'sent') {
      query.payer = req.user.id;
    } else if (type === 'received') {
      query.recipient = req.user.id;
    } else {
      query.$or = [{ payer: req.user.id }, { recipient: req.user.id }];
    }

    const payments = await Payment.find(query)
      .populate('payer', 'firstName lastName email avatar')
      .populate('recipient', 'firstName lastName email avatar')
      .populate('project', 'title')
      .populate('milestone', 'title')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        payments,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalPayments: count,
      },
    });
  } catch (error) {
    next(error);
  }
};