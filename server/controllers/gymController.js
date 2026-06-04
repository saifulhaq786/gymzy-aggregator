const Gym = require('../models/Gym');
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const { uploadToCloudinary } = require('../config/cloudinary');

// ── Public Routes ─────────────────────────────────────────────────────────────

/**
 * GET /api/gyms/nearby
 * Query: lat, lng, radius (meters, default 5000), page, limit
 */
exports.getNearbyGyms = async (req, res) => {
  const { lat, lng, radius = 5000, page = 1, limit = 20, facilities, minRating, search } = req.query;

  // Default to Bangalore coordinates if none are provided
  const queryLat = parseFloat(lat) || 12.9716;
  const queryLng = parseFloat(lng) || 77.5946;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Base geo query
  const geoQuery = {
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [queryLng, queryLat] },
        $maxDistance: parseInt(radius) || 1000000,
      },
    },
    verificationStatus: 'approved',
    isActive: true,
  };

  // Additional filters
  if (facilities) {
    geoQuery.facilities = { $in: facilities.split(',') };
  }
  if (minRating) {
    geoQuery.rating = { $gte: parseFloat(minRating) };
  }
  if (search) {
    geoQuery.$text = { $search: search };
  }

  let gyms;
  try {
    gyms = await Gym.find(geoQuery)
      .select('name coverImage images location rating totalReviews pricing facilities operatingHours capacity currentOccupancy isOpenNow occupancyPercent isFeatured tags')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('trainers', 'name photo specializations rating');
  } catch (err) {
    console.error('GeoQuery failed, falling back...', err);
    gyms = [];
  }

  // Fallback: If no gyms found near current location, fetch any approved gyms
  if (gyms.length === 0) {
    const fallbackQuery = {
      verificationStatus: 'approved',
      isActive: true,
    };
    if (facilities) {
      fallbackQuery.facilities = { $in: facilities.split(',') };
    }
    if (minRating) {
      fallbackQuery.rating = { $gte: parseFloat(minRating) };
    }
    if (search) {
      // Use case-insensitive regex for search fallback if text index isn't used
      fallbackQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
      ];
    }
    gyms = await Gym.find(fallbackQuery)
      .select('name coverImage images location rating totalReviews pricing facilities operatingHours capacity currentOccupancy isOpenNow occupancyPercent isFeatured tags')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('trainers', 'name photo specializations rating');
  }

  // Add distance field
  const gymsWithDistance = gyms.map((gym) => {
    const g = gym.toJSON();
    // Calculate distance (approximate)
    const R = 6371000; // Earth radius in meters
    const dLat = ((gym.location.coordinates[1] - queryLat) * Math.PI) / 180;
    const dLon = ((gym.location.coordinates[0] - queryLng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((queryLat * Math.PI) / 180) * Math.cos((gym.location.coordinates[1] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    g.distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    return g;
  });

  res.json({ success: true, count: gymsWithDistance.length, page: parseInt(page), gyms: gymsWithDistance });
};

/**
 * GET /api/gyms/:id
 */
exports.getGymById = async (req, res) => {
  const gym = await Gym.findById(req.params.id)
    .populate('ownerId', 'name email phone')
    .populate('trainers');

  if (!gym) {
    return res.status(404).json({ success: false, message: 'Gym not found.' });
  }

  res.json({ success: true, gym });
};

/**
 * GET /api/gyms/:id/availability
 */
exports.getGymAvailability = async (req, res) => {
  const gym = await Gym.findById(req.params.id).select('capacity currentOccupancy operatingHours');
  if (!gym) return res.status(404).json({ success: false, message: 'Gym not found.' });

  const availableSpots = Math.max(0, gym.capacity - gym.currentOccupancy);
  const occupancyPercent = Math.round((gym.currentOccupancy / gym.capacity) * 100);

  let status = 'available';
  if (occupancyPercent >= 90) status = 'almost_full';
  if (occupancyPercent >= 100) status = 'full';

  res.json({
    success: true,
    availability: {
      capacity: gym.capacity,
      currentOccupancy: gym.currentOccupancy,
      availableSpots,
      occupancyPercent,
      status,
      operatingHours: gym.operatingHours,
      isOpenNow: gym.isOpenNow,
    },
  });
};

// ── Gym Partner Routes ────────────────────────────────────────────────────────

/**
 * POST /api/gyms/register
 * Multipart: gym details + verification documents
 */
exports.registerGym = async (req, res) => {
  const {
    name, description, address, city, state, pincode, country,
    lat, lng, phone, email, website, facilities, pricing, operatingHours, capacity, tags,
  } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: 'Gym coordinates (lat, lng) are required.' });
  }

  // Upload verification documents
  const verificationDocuments = {};
  const imageUrls = [];

  if (req.files) {
    const uploadPromises = [];

    if (req.files.businessLicense) {
      uploadPromises.push(
        uploadToCloudinary(req.files.businessLicense[0].buffer, 'gymzy/documents', 'raw')
          .then((r) => { verificationDocuments.businessLicense = r.secure_url; })
      );
    }
    if (req.files.gstCertificate) {
      uploadPromises.push(
        uploadToCloudinary(req.files.gstCertificate[0].buffer, 'gymzy/documents', 'raw')
          .then((r) => { verificationDocuments.gstCertificate = r.secure_url; })
      );
    }
    if (req.files.ownerIdProof) {
      uploadPromises.push(
        uploadToCloudinary(req.files.ownerIdProof[0].buffer, 'gymzy/documents', 'raw')
          .then((r) => { verificationDocuments.ownerIdProof = r.secure_url; })
      );
    }
    if (req.files.images) {
      for (const imgFile of req.files.images) {
        uploadPromises.push(
          uploadToCloudinary(imgFile.buffer, 'gymzy/gym-images')
            .then((r) => imageUrls.push(r.secure_url))
        );
      }
    }

    await Promise.all(uploadPromises);
  }

  const gym = await Gym.create({
    ownerId: req.user._id,
    name,
    description,
    location: {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)],
      address,
      city,
      state,
      pincode,
      country: country || 'India',
    },
    contact: { phone, email, website },
    facilities: facilities ? JSON.parse(facilities) : [],
    pricing: pricing ? JSON.parse(pricing) : {},
    operatingHours: operatingHours ? JSON.parse(operatingHours) : {},
    capacity: parseInt(capacity) || 30,
    images: imageUrls,
    coverImage: imageUrls[0] || null,
    verificationDocuments,
    tags: tags ? JSON.parse(tags) : [],
    verificationStatus: process.env.NODE_ENV === 'production' ? 'pending' : 'approved',
    isActive: process.env.NODE_ENV === 'production' ? false : true,
  });

  // Update user role to gym_owner
  await User.findByIdAndUpdate(req.user._id, { role: 'gym_owner' });

  res.status(201).json({
    success: true,
    message: 'Gym registered successfully! It will go live after admin verification.',
    gym,
  });
};

/**
 * GET /api/gyms/my-gyms (Gym owner's own gyms)
 */
exports.getMyGyms = async (req, res) => {
  const gyms = await Gym.find({ ownerId: req.user._id });
  res.json({ success: true, gyms });
};

/**
 * PUT /api/gyms/:id (Update gym - owner only)
 */
exports.updateGym = async (req, res) => {
  const gym = await Gym.findOne({ _id: req.params.id, ownerId: req.user._id });
  if (!gym) return res.status(404).json({ success: false, message: 'Gym not found or unauthorized.' });

  const allowedFields = ['name', 'description', 'contact', 'facilities', 'pricing', 'operatingHours', 'capacity', 'tags'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      gym[field] = typeof req.body[field] === 'string' && field !== 'name' && field !== 'description'
        ? JSON.parse(req.body[field])
        : req.body[field];
    }
  });

  await gym.save();
  res.json({ success: true, gym });
};

/**
 * GET /api/gyms/:id/trainers
 */
exports.getGymTrainers = async (req, res) => {
  const trainers = await Trainer.find({ gymId: req.params.id, isActive: true });
  res.json({ success: true, trainers });
};
