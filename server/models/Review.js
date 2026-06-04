const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    images: [String],
    
    // Detailed ratings
    ratings: {
      cleanliness: { type: Number, min: 1, max: 5 },
      equipment: { type: Number, min: 1, max: 5 },
      staff: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
    },
    
    ownerReply: {
      comment: String,
      repliedAt: Date,
    },
    
    isVerified: { type: Boolean, default: false }, // verified purchase
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per gym
reviewSchema.index({ gymId: 1, userId: 1 }, { unique: true });

// After saving a review, update gym's average rating
reviewSchema.post('save', async function () {
  const Gym = require('./Gym');
  const result = await mongoose.model('Review').aggregate([
    { $match: { gymId: this.gymId, isHidden: false } },
    { $group: { _id: '$gymId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (result.length > 0) {
    await Gym.findByIdAndUpdate(this.gymId, {
      rating: Math.round(result[0].avgRating * 10) / 10,
      totalReviews: result[0].count,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
