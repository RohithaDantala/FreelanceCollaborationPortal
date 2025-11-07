// backend/src/models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    categories: {
      communication: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      quality: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      timeliness: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      professionalism: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      collaboration: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    response: {
      comment: String,
      createdAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ reviewer: 1, reviewee: 1, project: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, rating: -1 });

// Virtual for average category rating
reviewSchema.virtual('averageCategoryRating').get(function () {
  const categories = this.categories;
  const ratings = Object.values(categories).filter((r) => r !== null);
  if (ratings.length === 0) return this.rating;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
});

// Static method to calculate user's average rating
reviewSchema.statics.getUserAverageRating = async function (userId) {
  const result = await this.aggregate([
    { $match: { reviewee: mongoose.Types.ObjectId(userId), isPublic: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating',
        },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: [],
    };
  }

  const distribution = [0, 0, 0, 0, 0];
  result[0].ratingDistribution.forEach((rating) => {
    distribution[Math.floor(rating) - 1]++;
  });

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalReviews: result[0].totalReviews,
    ratingDistribution: distribution,
  };
};

module.exports = mongoose.model('Review', reviewSchema);