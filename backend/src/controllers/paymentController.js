// backend/src/controllers/paymentController.js - NO NOTIFICATIONS
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');

// @desc    Create payment
// @route   POST /api/payments/create
// @access  Private (Project owner)
exports.createPayment = async (req, res, next) => {
  try {
    const {
      project,
      recipient,
      amount,
      currency,
      description,
      milestone,
      dueDate,
    } = req.body;

    // Verify project and ownership
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return next(new AppError('Project not found', 404));
    }

    if (projectDoc.owner.toString() !== req.user.id) {
      return next(new AppError('Only project owner can create payments', 403));
    }

    // Verify recipient is a project member
    const isMember = projectDoc.members.some(
      (m) => m.user.toString() === recipient
    );

    if (!isMember) {
      return next(new AppError('Recipient must be a project member', 400));
    }

    const payment = await Payment.create({
      project,
      payer: req.user.id,
      recipient,
      amount,
      currency: currency || 'USD',
      description,
      milestone,
      dueDate,
      status: 'pending',
    });

    await payment.populate([
      { path: 'payer', select: 'firstName lastName email' },
      { path: 'recipient', select: 'firstName lastName email' },
      { path: 'project', select: 'title' },
      { path: 'milestone', select: 'title' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment status
// @route   PUT /api/payments/:id/status
// @access  Private (Project owner or recipient)
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    const project = await Project.findById(payment.project);
    const isOwner = project.owner.toString() === req.user.id;
    const isRecipient = payment.recipient.toString() === req.user.id;

    if (!isOwner && !isRecipient) {
      return next(new AppError('Not authorized', 403));
    }

    // Validate status transitions
    const validTransitions = {
      pending: ['escrowed', 'cancelled'],
      escrowed: ['released', 'refunded', 'disputed'],
      disputed: ['released', 'refunded'],
      released: [],
      refunded: [],
      cancelled: [],
    };

    if (!validTransitions[payment.status]?.includes(status)) {
      return next(
        new AppError(`Cannot change status from ${payment.status} to ${status}`, 400)
      );
    }

    payment.status = status;

    // Update dates based on status
    if (status === 'escrowed') {
      payment.escrowedAt = Date.now();
    } else if (status === 'released') {
      payment.releasedAt = Date.now();
    }

    await payment.save();
    await payment.populate([
      { path: 'payer', select: 'firstName lastName email' },
      { path: 'recipient', select: 'firstName lastName email' },
      { path: 'project', select: 'title' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project payments
// @route   GET /api/payments/project/:projectId
// @access  Private (Project members)
exports.getProjectPayments = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, recipient } = req.query;

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember =
      project.members.some((m) => m.user.toString() === req.user.id) ||
      project.owner.toString() === req.user.id;

    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    const query = { project: projectId };
    if (status) query.status = status;
    if (recipient) query.recipient = recipient;

    const payments = await Payment.find(query)
      .populate('payer', 'firstName lastName email avatar')
      .populate('recipient', 'firstName lastName email avatar')
      .populate('milestone', 'title')
      .sort({ createdAt: -1 });

    // Calculate totals
    const totals = {
      total: payments.reduce((sum, p) => sum + p.amount, 0),
      pending: payments
        .filter((p) => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0),
      escrowed: payments
        .filter((p) => p.status === 'escrowed')
        .reduce((sum, p) => sum + p.amount, 0),
      released: payments
        .filter((p) => p.status === 'released')
        .reduce((sum, p) => sum + p.amount, 0),
    };

    res.status(200).json({
      success: true,
      data: {
        payments,
        count: payments.length,
        totals,
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
    const { status, type } = req.query;

    let query = {};

    if (type === 'received') {
      query.recipient = req.user.id;
    } else if (type === 'sent') {
      query.payer = req.user.id;
    } else {
      query.$or = [{ recipient: req.user.id }, { payer: req.user.id }];
    }

    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('payer', 'firstName lastName email avatar')
      .populate('recipient', 'firstName lastName email avatar')
      .populate('project', 'title')
      .populate('milestone', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        payments,
        count: payments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private (Project members)
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('payer', 'firstName lastName email avatar')
      .populate('recipient', 'firstName lastName email avatar')
      .populate('project', 'title')
      .populate('milestone', 'title');

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    const project = await Project.findById(payment.project._id);
    const isMember =
      project.members.some((m) => m.user.toString() === req.user.id) ||
      project.owner.toString() === req.user.id;

    if (!isMember) {
      return next(new AppError('Not authorized', 403));
    }

    res.status(200).json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private (Project owner, only if pending)
exports.deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    if (payment.status !== 'pending') {
      return next(
        new AppError('Can only delete payments with pending status', 400)
      );
    }

    const project = await Project.findById(payment.project);
    if (project.owner.toString() !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    await payment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};