// backend/src/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null,
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR'],
    },
    status: {
      type: String,
      enum: ['pending', 'held_in_escrow', 'released', 'refunded', 'disputed', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'bank_transfer', 'other'],
      default: 'stripe',
    },
    transactionId: {
      type: String,
      default: null,
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    escrowReleaseDate: {
      type: Date,
      default: null,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    refundReason: {
      type: String,
      default: null,
    },
    dispute: {
      reason: String,
      createdAt: Date,
      resolvedAt: Date,
      resolution: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentSchema.index({ project: 1, status: 1 });
paymentSchema.index({ payer: 1, status: 1 });
paymentSchema.index({ recipient: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });

// Static method to calculate project earnings
paymentSchema.statics.getProjectEarnings = async function(projectId) {
  const result = await this.aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
        status: { $in: ['released', 'held_in_escrow'] },
      },
    },
    {
      $group: {
        _id: '$currency',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
  return result;
};

// Virtual for payment age
paymentSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Payment', paymentSchema);