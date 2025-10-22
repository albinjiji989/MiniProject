const { validationResult } = require('express-validator');
const TemporaryCareCenter = require('../models/TemporaryCareCenter');

const getMyCenter = async (req, res) => {
  try {
    const center = await TemporaryCareCenter.findOne({ owner: req.user._id });
    return res.json({ success: true, data: { center } });
  } catch (e) {
    console.error('Get center error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const upsertMyCenter = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    const payload = { ...req.body, owner: req.user._id, storeId: req.user.storeId, storeName: req.user.storeName };
    const existing = await TemporaryCareCenter.findOne({ owner: req.user._id });
    let doc;
    if (existing) {
      Object.assign(existing, payload);
      doc = await existing.save();
    } else {
      doc = await TemporaryCareCenter.create(payload);
    }
    return res.json({ success: true, message: 'Center saved', data: { center: doc } });
  } catch (e) {
    console.error('Upsert center error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getMyCenter, upsertMyCenter };


