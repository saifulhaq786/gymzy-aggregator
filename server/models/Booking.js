const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      default: null,
    },
    type: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'session_with_trainer'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // For hourly bookings
    startTime: String, // "08:00"
    endTime: String,   // "10:00"

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: { type: String, default: 'INR' },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'refunded'],
      default: 'pending',
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    isPaid: { type: Boolean, default: false },

    // QR Code for check-in
    qrCode: String,         // base64 or URL
    qrCodeData: String,     // Unique string encoded in QR

    // Check-in tracking
    checkedInAt: Date,
    checkedOutAt: Date,

    // Cancellation
    cancelledAt: Date,
    cancellationReason: String,
    refundAmount: { type: Number, default: 0 },

    notes: String,
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ gymId: 1, startDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
