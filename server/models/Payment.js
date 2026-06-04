const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    // Razorpay
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    status: {
      type: String,
      enum: ['created', 'processing', 'success', 'failed', 'refunded'],
      default: 'created',
    },

    paymentMethod: String,  // 'upi', 'card', 'netbanking', etc.

    refundId: String,
    refundAmount: { type: Number, default: 0 },
    refundedAt: Date,

    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
