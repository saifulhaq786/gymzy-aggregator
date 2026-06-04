const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  getNearbyGyms, getGymById, getGymAvailability,
  registerGym, getMyGyms, updateGym, getGymTrainers,
} = require('../controllers/gymController');

// Public
router.get('/nearby', optionalAuth, getNearbyGyms);
router.get('/:id', getGymById);
router.get('/:id/availability', getGymAvailability);
router.get('/:id/trainers', getGymTrainers);

// Authenticated user
router.post(
  '/register',
  protect,
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'businessLicense', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'ownerIdProof', maxCount: 1 },
    { name: 'noc', maxCount: 1 },
  ]),
  registerGym
);
router.get('/my/gyms', protect, authorize('gym_owner', 'admin'), getMyGyms);
router.put('/:id', protect, authorize('gym_owner', 'admin'), updateGym);

module.exports = router;
