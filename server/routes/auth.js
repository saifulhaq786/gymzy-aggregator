const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register, login, googleAuth, sendOTP, verifyOTP,
  refreshToken, logout, getMe, updateProfile,
} = require('../controllers/authController');
const { upload } = require('../config/cloudinary');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, upload.single('profilePhoto'), updateProfile);

module.exports = router;
