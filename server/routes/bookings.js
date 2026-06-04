const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createBooking, verifyPayment, getMyBookings, checkIn, cancelBooking,
} = require('../controllers/bookingController');

router.post('/', protect, createBooking);
router.post('/verify-payment', protect, verifyPayment);
router.get('/my', protect, getMyBookings);
router.post('/:id/checkin', protect, checkIn);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
