const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../../../../core/middleware/auth');
const TemporaryCareCenter = require('../../manager/models/TemporaryCareCenter');
const analyticsController = require('../../admin/controllers/analyticsController');

const router = express.Router();

router.get('/centers', auth, authorize('admin'), async (req, res) => {
  try {
    const centers = await TemporaryCareCenter.find().sort({ createdAt: -1 });
    res.json({ success: true, data: { centers } });
  } catch (e) {
    console.error('Admin list centers error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/centers/:id/status', auth, authorize('admin'), [ body('isActive').isBoolean() ], async (req, res) => {
  try {
    const center = await TemporaryCareCenter.findById(req.params.id);
    if (!center) return res.status(404).json({ success: false, message: 'Center not found' });
    center.isActive = !!req.body.isActive;
    await center.save();
    res.json({ success: true, message: 'Status updated', data: { center } });
  } catch (e) {
    console.error('Admin update center status error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Analytics and monitoring
router.get('/stats', auth, authorize('admin'), analyticsController.getStats);
router.get('/reports/revenue', auth, authorize('admin'), analyticsController.getRevenueReport);
router.get('/reports/care-types', auth, authorize('admin'), analyticsController.getCareTypeDistribution);

module.exports = router;


