const { validationResult } = require('express-validator');
const VeterinaryStaff = require('../models/VeterinaryStaff');

const listStaff = async (req, res) => {
  try {
    const items = await VeterinaryStaff.find({ storeId: req.user.storeId }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) {
    console.error('List staff error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createStaff = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    const payload = { ...req.body, storeId: req.user.storeId, storeName: req.user.storeName, createdBy: req.user._id };
    const doc = await VeterinaryStaff.create(payload);
    res.status(201).json({ success: true, message: 'Staff created', data: { staff: doc } });
  } catch (e) {
    console.error('Create staff error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateStaff = async (req, res) => {
  try {
    const doc = await VeterinaryStaff.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Staff not found' });
    if (doc.storeId !== req.user.storeId) return res.status(403).json({ success: false, message: 'Not your store staff' });
    Object.assign(doc, req.body || {});
    await doc.save();
    res.json({ success: true, message: 'Staff updated', data: { staff: doc } });
  } catch (e) {
    console.error('Update staff error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const doc = await VeterinaryStaff.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Staff not found' });
    if (doc.storeId !== req.user.storeId) return res.status(403).json({ success: false, message: 'Not your store staff' });
    await doc.deleteOne();
    res.json({ success: true, message: 'Staff deleted' });
  } catch (e) {
    console.error('Delete staff error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { listStaff, createStaff, updateStaff, deleteStaff };


