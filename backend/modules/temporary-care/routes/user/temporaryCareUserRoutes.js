const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../../../../core/middleware/auth');
const TemporaryCareRequest = require('../../user/models/TemporaryCareRequest');
const TemporaryCare = require('../../manager/models/TemporaryCare');
const TemporaryCareCenter = require('../../manager/models/TemporaryCareCenter');

const router = express.Router();

router.post(
  '/requests',
  auth,
  [
    body('pet').notEmpty(),
    body('storeId').notEmpty(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('careType').isIn(['emergency', 'vacation', 'medical', 'temporary', 'foster'])
  ],
  async (req, res) => {
    try {
      const payload = {
        ...req.body,
        userId: req.user._id
      };
      const doc = await TemporaryCareRequest.create(payload);
      res.status(201).json({ success: true, message: 'Request submitted', data: { request: doc } });
    } catch (e) {
      console.error('Create request error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

router.get('/requests', auth, async (req, res) => {
  try {
    const items = await TemporaryCareRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { requests: items } });
  } catch (e) {
    console.error('List requests error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/my-active-care', auth, async (req, res) => {
  try {
    const items = await TemporaryCare.find({ 'owner.email': req.user.email, endDate: { $gte: new Date() } }).sort({ startDate: -1 });
    res.json({ success: true, data: { items } });
  } catch (e) {
    console.error('List my active care error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

// Public centers listing (active only)
router.get('/public/centers', async (req, res) => {
  try {
    const centers = await TemporaryCareCenter.find({ isActive: true }).select('name capacity storeId storeName address');
    res.json({ success: true, data: { centers } });
  } catch (e) {
    console.error('List public centers error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


