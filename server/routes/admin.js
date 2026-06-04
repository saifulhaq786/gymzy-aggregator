const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboard, getPendingGyms, approveGym, rejectGym,
  getAllGyms, getAllUsers, deactivateUser, toggleFeatureGym,
} = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/gyms', getAllGyms);
router.get('/gyms/pending', getPendingGyms);
router.put('/gyms/:id/approve', approveGym);
router.put('/gyms/:id/reject', rejectGym);
router.put('/gyms/:id/feature', toggleFeatureGym);
router.get('/users', getAllUsers);
router.put('/users/:id/deactivate', deactivateUser);

module.exports = router;
