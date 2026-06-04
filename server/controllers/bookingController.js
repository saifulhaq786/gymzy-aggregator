const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Gym = require('../models/Gym');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/bookings
 * Create a booking and initiate payment
 */
exports.createBooking = async (req, res) => {
  const { gymId, trainerId, type, startDate, endDate, startTime, endTime } = req.body;

  const gym = await Gym.findById(gymId);
  if (!gym || !gym.isActive) {
    return res.status(404).json({ success: false, message: 'Gym not found or not active.' });
  }

  // Calculate amount based on type
  const priceMap = {
    hourly: gym.pricing.hourly,
    daily: gym.pricing.daily,
    weekly: gym.pricing.weekly,
    monthly: gym.pricing.monthly,
    session_with_trainer: gym.pricing.sessionWithTrainer,
  };

  const amount = priceMap[type] || 0;
  if (amount <= 0) {
    return res.status(400).json({ success: false, message: `Pricing for '${type}' not set by this gym.` });
  }

  // Generate unique QR data
  const qrCodeData = uuidv4();
  const qrCode = await QRCode.toDataURL(JSON.stringify({
    bookingRef: qrCodeData,
    gymId,
    userId: req.user._id,
  }));

  // Create Razorpay order
  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // in paise
      currency: 'INR',
      receipt: `booking_${Date.now()}`,
      notes: { gymId, userId: req.user._id.toString(), type },
    });
  } catch (err) {
    console.warn('⚠️ Razorpay order creation failed, falling back to mock order for testing:', err.message);
    razorpayOrder = {
      id: 'order_mock_' + Math.random().toString(36).substring(7),
      amount: amount * 100,
      currency: 'INR',
    };
  }

  // Create booking (pending payment)
  const booking = await Booking.create({
    userId: req.user._id,
    gymId,
    trainerId: trainerId || null,
    type,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    startTime,
    endTime,
    amount,
    status: 'pending',
    qrCode,
    qrCodeData,
  });

  // Create payment record
  const payment = await Payment.create({
    userId: req.user._id,
    bookingId: booking._id,
    amount,
    razorpayOrderId: razorpayOrder.id,
    status: 'created',
  });

  booking.paymentId = payment._id;
  await booking.save();

  res.status(201).json({
    success: true,
    booking,
    payment: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    },
  });
};

/**
 * POST /api/bookings/verify-payment
 */
exports.verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

  // Bypass verification in development if order/payment is mock
  const isMock = razorpayOrderId?.startsWith('order_mock_') || razorpayPaymentId?.startsWith('pay_mock_');

  if (!isMock || process.env.NODE_ENV === 'production') {
    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }
  }

  // Update payment
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    { razorpayPaymentId, razorpaySignature, status: 'success' },
    { new: true }
  );

  // Confirm booking
  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    { status: 'confirmed', isPaid: true },
    { new: true }
  ).populate('gymId', 'name location').populate('userId', 'name email');

  // Update gym booking count
  await Gym.findByIdAndUpdate(booking.gymId, { $inc: { totalBookings: 1, totalRevenue: booking.amount } });

  res.json({ success: true, message: 'Payment verified. Booking confirmed! 🎉', booking });
};

/**
 * GET /api/bookings/my
 */
exports.getMyBookings = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { userId: req.user._id };
  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate('gymId', 'name coverImage location contact')
    .populate('trainerId', 'name photo')
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await Booking.countDocuments(query);

  res.json({ success: true, total, page: parseInt(page), bookings });
};

/**
 * POST /api/bookings/:id/checkin
 * QR code check-in
 */
exports.checkIn = async (req, res) => {
  const { qrCodeData } = req.body;

  const booking = await Booking.findOne({ qrCodeData }).populate('gymId', 'name capacity currentOccupancy ownerId');

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Invalid QR code.' });
  }

  if (booking.status !== 'confirmed') {
    return res.status(400).json({ success: false, message: `Cannot check in. Booking status: ${booking.status}` });
  }

  // Verify gym staff/owner is scanning
  const gymOwnerId = booking.gymId.ownerId.toString();
  if (req.user._id.toString() !== gymOwnerId && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only gym staff can perform check-ins.' });
  }

  booking.status = 'checked_in';
  booking.checkedInAt = new Date();
  await booking.save();

  // Increment occupancy
  await Gym.findByIdAndUpdate(booking.gymId._id, { $inc: { currentOccupancy: 1 } });

  res.json({ success: true, message: 'Check-in successful! ✅', booking });
};

/**
 * PUT /api/bookings/:id/cancel
 */
exports.cancelBooking = async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

  if (['completed', 'cancelled', 'checked_in'].includes(booking.status)) {
    return res.status(400).json({ success: false, message: `Cannot cancel booking with status: ${booking.status}` });
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancellationReason = req.body.reason || 'Cancelled by user';
  await booking.save();

  // TODO: Process refund via Razorpay if paid
  if (booking.isPaid) {
    // Razorpay refund logic here
    booking.refundAmount = booking.amount; // Full refund (adjust based on policy)
  }

  res.json({ success: true, message: 'Booking cancelled.', booking });
};
