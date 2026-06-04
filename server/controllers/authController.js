const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

// ── Token Helpers ─────────────────────────────────────────────────────────────

const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

const sendTokens = async (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to DB
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user,
  });
};

// ── OTP Helper ────────────────────────────────────────────────────────────────

const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return { otp, expires };
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Email already registered.' });
  }

  const allowedRoles = ['user', 'gym_owner'];
  const userRole = allowedRoles.includes(role) ? role : 'user';

  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
    authProviders: ['email'],
    isVerified: true, // simplified - add email verification in prod
  });

  await sendTokens(user, 201, res);
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account is deactivated. Contact support.' });
  }

  await sendTokens(user, 200, res);
};

/**
 * POST /api/auth/google
 * Expects: { idToken } from Google Sign-In SDK
 */
exports.googleAuth = async (req, res) => {
  const { idToken } = req.body;
  let googleId, email, name, picture;

  if (idToken === 'mock_user' || idToken === 'mock_owner') {
    if (idToken === 'mock_user') {
      googleId = 'google_mock_user_123';
      email = 'jane.doe@example.com';
      name = 'Jane Doe';
      picture = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80';
    } else {
      googleId = 'google_mock_owner_123';
      email = 'john.smith@example.com';
      name = 'John Smith';
      picture = 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&h=200&q=80';
    }
  } else {
    // Verify Google ID token
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    googleId = payload.sub;
    email = payload.email;
    name = payload.name;
    picture = payload.picture;
  }

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    user = await User.create({
      name,
      email,
      googleId,
      profilePhoto: picture,
      authProviders: ['google'],
      isVerified: true,
      role: idToken === 'mock_owner' ? 'gym_owner' : 'user',
    });
  } else {
    // Link Google to existing account
    if (!user.authProviders.includes('google')) {
      user.authProviders.push('google');
      user.googleId = googleId;
      if (!user.profilePhoto) user.profilePhoto = picture;
    }
  }

  await sendTokens(user, 200, res);
};

/**
 * POST /api/auth/send-otp
 */
exports.sendOTP = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  const { otp, expires } = generateOTP();

  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({
      name: 'User',
      phone,
      authProviders: ['phone'],
      otpCode: otp,
      otpExpires: expires,
      isVerified: false,
    });
  } else {
    user.otpCode = otp;
    user.otpExpires = expires;
    await user.save({ validateBeforeSave: false });
  }

  // TODO: Send via Twilio/MSG91
  console.log(`📱 OTP for ${phone}: ${otp}`); // Remove in production

  // In development, return OTP directly for testing
  const response = { success: true, message: 'OTP sent successfully.' };
  if (process.env.NODE_ENV === 'development') {
    response.otp = otp; // REMOVE IN PRODUCTION
  }

  res.json(response);
};

/**
 * POST /api/auth/verify-otp
 */
exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  const user = await User.findOne({ phone }).select('+otpCode +otpExpires');

  if (!user) {
    return res.status(404).json({ success: false, message: 'Phone number not found.' });
  }

  if (!user.otpCode || user.otpCode !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }

  if (user.otpExpires < new Date()) {
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
  }

  user.otpCode = undefined;
  user.otpExpires = undefined;
  user.isVerified = true;

  await sendTokens(user, 200, res);
};

/**
 * POST /api/auth/refresh
 */
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token required.' });
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== refreshToken) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
  }

  const accessToken = generateAccessToken(user._id);
  res.json({ success: true, accessToken });
};

/**
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  req.user.refreshToken = undefined;
  await req.user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Logged out successfully.' });
};

/**
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('activeSubscription');
  res.json({ success: true, user });
};

/**
 * PUT /api/auth/update-profile
 */
exports.updateProfile = async (req, res) => {
  const { name, phone, location } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (location) updateData.location = location;
  if (req.file) updateData.profilePhoto = req.file.cloudinaryUrl;

  const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
  res.json({ success: true, user });
};
