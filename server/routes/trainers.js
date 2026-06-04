const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Trainer = require('../models/Trainer');
const { upload, uploadToCloudinary } = require('../config/cloudinary');

// GET /api/trainers/:id
router.get('/:id', async (req, res) => {
  const trainer = await Trainer.findById(req.params.id).populate('gymId', 'name location');
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found.' });
  res.json({ success: true, trainer });
});

// POST /api/trainers (Gym owner adds trainer)
router.post('/', protect, authorize('gym_owner', 'admin'), upload.single('photo'), async (req, res) => {
  const { gymId, name, bio, specializations, certifications, experience, pricing, availability, timeSlots } = req.body;

  let photoUrl = null;
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'gymzy/trainers');
    photoUrl = result.secure_url;
  }

  const trainer = await Trainer.create({
    gymId,
    name,
    bio,
    photo: photoUrl,
    specializations: JSON.parse(specializations || '[]'),
    certifications: JSON.parse(certifications || '[]'),
    experience: parseInt(experience) || 0,
    pricing: JSON.parse(pricing || '{}'),
    availability: JSON.parse(availability || '[]'),
    timeSlots: JSON.parse(timeSlots || '[]'),
  });

  // Add to gym's trainer list
  const Gym = require('../models/Gym');
  await Gym.findByIdAndUpdate(gymId, { $push: { trainers: trainer._id } });

  res.status(201).json({ success: true, trainer });
});

// PUT /api/trainers/:id
router.put('/:id', protect, authorize('gym_owner', 'admin'), async (req, res) => {
  const trainer = await Trainer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found.' });
  res.json({ success: true, trainer });
});

// DELETE /api/trainers/:id
router.delete('/:id', protect, authorize('gym_owner', 'admin'), async (req, res) => {
  await Trainer.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Trainer removed.' });
});

module.exports = router;
