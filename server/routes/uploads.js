const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../config/cloudinary');

// POST /api/uploads/image
router.post('/image', protect, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file provided.' });
  const result = await uploadToCloudinary(req.file.buffer, 'gymzy/misc');
  res.json({ success: true, url: result.secure_url, publicId: result.public_id });
});

// POST /api/uploads/document
router.post('/document', protect, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file provided.' });
  const resourceType = req.file.mimetype === 'application/pdf' ? 'raw' : 'image';
  const result = await uploadToCloudinary(req.file.buffer, 'gymzy/documents', resourceType);
  res.json({ success: true, url: result.secure_url, publicId: result.public_id });
});

module.exports = router;
