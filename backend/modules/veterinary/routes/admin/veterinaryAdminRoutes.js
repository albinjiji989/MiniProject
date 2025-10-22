const express = require('express');
const { auth, authorize } = require('../../../../core/middleware/auth');
const VeterinaryClinic = require('../../manager/models/VeterinaryClinic');

const router = express.Router();

router.get('/clinics', auth, authorize('admin'), async (req, res) => {
  try {
    const clinics = await VeterinaryClinic.find().sort({ createdAt: -1 });
    res.json({ success: true, data: { clinics } });
  } catch (e) {
    console.error('Admin list clinics error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/clinics/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const clinic = await VeterinaryClinic.findById(req.params.id);
    if (!clinic) return res.status(404).json({ success: false, message: 'Clinic not found' });
    clinic.isActive = !!req.body.isActive;
    await clinic.save();
    res.json({ success: true, message: 'Status updated', data: { clinic } });
  } catch (e) {
    console.error('Admin clinic status error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;


