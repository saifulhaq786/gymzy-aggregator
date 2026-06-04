const express = require('express');
const router = express.Router();

// Placeholder - payment webhook from Razorpay
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  // TODO: Verify Razorpay webhook signature
  // const signature = req.headers['x-razorpay-signature'];
  res.json({ success: true });
});

module.exports = router;
