const Gym = require('../models/Gym');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

/**
 * GET /api/admin/dashboard
 */
exports.getDashboard = async (req, res) => {
  const [
    totalUsers, totalGyms, totalBookings, totalRevenue,
    pendingGyms, activeGyms, todayBookings,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Gym.countDocuments(),
    Booking.countDocuments(),
    Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Gym.countDocuments({ verificationStatus: 'pending' }),
    Gym.countDocuments({ verificationStatus: 'approved', isActive: true }),
    Booking.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalGyms,
      activeGyms,
      pendingGyms,
      totalBookings,
      todayBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
    },
  });
};

/**
 * GET /api/admin/gyms/pending
 */
exports.getPendingGyms = async (req, res) => {
  const gyms = await Gym.find({ verificationStatus: { $in: ['pending', 'under_review'] } })
    .populate('ownerId', 'name email phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: gyms.length, gyms });
};

/**
 * PUT /api/admin/gyms/:id/approve
 */
exports.approveGym = async (req, res) => {
  const gym = await Gym.findByIdAndUpdate(
    req.params.id,
    {
      verificationStatus: 'approved',
      isActive: true,
      verifiedAt: new Date(),
      verifiedBy: req.user._id,
      rejectionReason: undefined,
    },
    { new: true }
  ).populate('ownerId', 'name email');

  if (!gym) return res.status(404).json({ success: false, message: 'Gym not found.' });

  // TODO: Send email notification to gym owner
  console.log(`✅ Gym "${gym.name}" approved. Notifying ${gym.ownerId.email}`);

  res.json({ success: true, message: `Gym "${gym.name}" has been approved and is now live!`, gym });
};

/**
 * PUT /api/admin/gyms/:id/reject
 */
exports.rejectGym = async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
  }

  const gym = await Gym.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: 'rejected', isActive: false, rejectionReason: reason },
    { new: true }
  ).populate('ownerId', 'name email');

  if (!gym) return res.status(404).json({ success: false, message: 'Gym not found.' });

  // TODO: Send rejection email with reason
  console.log(`❌ Gym "${gym.name}" rejected. Reason: ${reason}`);

  res.json({ success: true, message: 'Gym has been rejected.', gym });
};

/**
 * GET /api/admin/gyms
 */
exports.getAllGyms = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { verificationStatus: status } : {};

  const gyms = await Gym.find(query)
    .populate('ownerId', 'name email')
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await Gym.countDocuments(query);
  res.json({ success: true, total, page: parseInt(page), gyms });
};

/**
 * GET /api/admin/users
 */
exports.getAllUsers = async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const query = role ? { role } : {};

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);
  res.json({ success: true, total, page: parseInt(page), users });
};

/**
 * PUT /api/admin/users/:id/deactivate
 */
exports.deactivateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, message: 'User deactivated.', user });
};

/**
 * PUT /api/admin/gyms/:id/feature
 */
exports.toggleFeatureGym = async (req, res) => {
  const gym = await Gym.findById(req.params.id);
  if (!gym) return res.status(404).json({ success: false, message: 'Gym not found.' });
  gym.isFeatured = !gym.isFeatured;
  await gym.save();
  res.json({ success: true, message: `Gym ${gym.isFeatured ? 'featured' : 'unfeatured'}.`, gym });
};
