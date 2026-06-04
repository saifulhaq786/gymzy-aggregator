const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  count: { type: Number, default: 1 },
  brand: String,
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair'],
    default: 'good',
  },
});

const operatingHoursSchema = new mongoose.Schema({
  open: String,  // "06:00"
  close: String, // "22:00"
  isClosed: { type: Boolean, default: false },
});

const pricingSchema = new mongoose.Schema({
  hourly: { type: Number, default: 0 },
  daily: { type: Number, default: 0 },
  weekly: { type: Number, default: 0 },
  monthly: { type: Number, default: 0 },
  sessionWithTrainer: { type: Number, default: 0 },
});

const gymSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Gym name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Maximum 10 images allowed',
      },
    },
    coverImage: String,

    // Location (GeoJSON)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },

    contact: {
      phone: String,
      email: String,
      website: String,
      instagram: String,
    },

    facilities: {
      type: [String],
      enum: [
        'AC', 'Parking', 'Locker Room', 'Shower', 'WiFi',
        'Steam Room', 'Sauna', 'Swimming Pool', 'Cafe/Juice Bar',
        'Cardio Zone', 'Free Weights', 'Group Classes', 'Personal Training',
        'Yoga Studio', 'Boxing Ring', 'CrossFit Area', 'Cycling',
      ],
      default: [],
    },

    equipment: [equipmentSchema],

    trainers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' }],

    pricing: { type: pricingSchema, default: {} },

    operatingHours: {
      monday:    { type: operatingHoursSchema, default: { open: '06:00', close: '22:00' } },
      tuesday:   { type: operatingHoursSchema, default: { open: '06:00', close: '22:00' } },
      wednesday: { type: operatingHoursSchema, default: { open: '06:00', close: '22:00' } },
      thursday:  { type: operatingHoursSchema, default: { open: '06:00', close: '22:00' } },
      friday:    { type: operatingHoursSchema, default: { open: '06:00', close: '22:00' } },
      saturday:  { type: operatingHoursSchema, default: { open: '08:00', close: '20:00' } },
      sunday:    { type: operatingHoursSchema, default: { open: '08:00', close: '18:00' } },
    },

    capacity: { type: Number, default: 30 },
    currentOccupancy: { type: Number, default: 0 },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },

    verificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    verificationDocuments: {
      businessLicense: String,
      gstCertificate: String,
      ownerIdProof: String,
      noc: String,
    },
    rejectionReason: String,
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    isActive: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },

    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },

    tags: [String], // e.g. ["24/7", "women-only", "budget"]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Geospatial index
gymSchema.index({ location: '2dsphere' });
gymSchema.index({ verificationStatus: 1, isActive: 1 });
gymSchema.index({ name: 'text', description: 'text' });

// Virtual: availability percentage
gymSchema.virtual('occupancyPercent').get(function () {
  if (!this.capacity) return 0;
  return Math.round((this.currentOccupancy / this.capacity) * 100);
});

// Virtual: is currently open
gymSchema.virtual('isOpenNow').get(function () {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const dayName = days[now.getDay()];
  const hours = this.operatingHours[dayName];
  if (!hours || hours.isClosed) return false;
  
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime >= hours.open && currentTime <= hours.close;
});

module.exports = mongoose.model('Gym', gymSchema);
