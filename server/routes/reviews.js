const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const Review = require('../models/Review');

// GET /api/reviews/gym/:gymId
router.get('/gym/:gymId', optionalAuth, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const reviews = await Review.find({ gymId: req.params.gymId, isHidden: false })
    .populate('userId', 'name profilePhoto')
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await Review.countDocuments({ gymId: req.params.gymId, isHidden: false });
  res.json({ success: true, total, page: parseInt(page), reviews });
});

// POST /api/reviews
router.post('/', protect, async (req, res) => {
  const { gymId, rating, comment, ratings, bookingId } = req.body;

  const existing = await Review.findOne({ gymId, userId: req.user._id });
  if (existing) {
    return res.status(409).json({ success: false, message: 'You have already reviewed this gym.' });
  }

  const review = await Review.create({
    gymId,
    userId: req.user._id,
    bookingId,
    rating,
    comment,
    ratings,
  });

  await review.populate('userId', 'name profilePhoto');
  res.status(201).json({ success: true, review });
});

// PUT /api/reviews/:id/reply (Gym owner replies)
router.put('/:id/reply', protect, async (req, res) => {
  const { comment } = req.body;
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { ownerReply: { comment, repliedAt: new Date() } },
    { new: true }
  );
  if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
  res.json({ success: true, review });
});

// DELETE /api/reviews/:id
router.delete('/:id', protect, async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, userId: req.user._id });
  if (!review) return res.status(404).json({ success: false, message: 'Review not found or unauthorized.' });
  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted.' });
});

module.exports = router;
