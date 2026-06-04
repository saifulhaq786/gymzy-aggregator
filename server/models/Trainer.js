const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Trainer name is required'],
      trim: true,
    },
    photo: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    specializations: {
      type: [String],
      enum: [
        'Weight Loss', 'Muscle Building', 'Bodybuilding', 'CrossFit',
        'Yoga', 'Pilates', 'HIIT', 'Cardio', 'Zumba', 'Kickboxing',
        'Functional Training', 'Rehabilitation', 'Nutrition', 'Calisthenics',
      ],
      default: [],
    },
    certifications: [String], // e.g. ["ACE CPT", "NASM", "ISSA"]
    experience: {
      type: Number, // years
      default: 0,
      min: 0,
    },
    pricing: {
      perSession: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 },
    },
    availability: {
      type: [String],
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
    timeSlots: [String], // e.g. ["06:00-08:00", "18:00-20:00"]

    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    isCertified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trainer', trainerSchema);
