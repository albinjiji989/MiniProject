const { validationResult } = require('express-validator');
const Caregiver = require('../models/Caregiver');

const listCaregivers = async (req, res) => {
  try {
    const filter = req.user.storeId ? { storeId: req.user.storeId } : {};
    const items = await Caregiver.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) {
    console.error('List caregivers error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createCaregiver = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    const payload = { ...req.body, storeId: req.user.storeId, storeName: req.user.storeName, createdBy: req.user._id };
    const doc = await Caregiver.create(payload);
    res.status(201).json({ success: true, message: 'Caregiver created', data: { caregiver: doc } });
  } catch (e) {
    console.error('Create caregiver error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateCaregiver = async (req, res) => {
  try {
    const doc = await Caregiver.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Caregiver not found' });
    if (req.user.storeId && doc.storeId && doc.storeId !== req.user.storeId) return res.status(403).json({ success: false, message: 'Not your store caregiver' });
    Object.assign(doc, req.body || {});
    await doc.save();
    res.json({ success: true, message: 'Caregiver updated', data: { caregiver: doc } });
  } catch (e) {
    console.error('Update caregiver error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteCaregiver = async (req, res) => {
  try {
    const doc = await Caregiver.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Caregiver not found' });
    if (req.user.storeId && doc.storeId && doc.storeId !== req.user.storeId) return res.status(403).json({ success: false, message: 'Not your store caregiver' });
    await doc.deleteOne();
    res.json({ success: true, message: 'Caregiver deleted' });
  } catch (e) {
    console.error('Delete caregiver error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { listCaregivers, createCaregiver, updateCaregiver, deleteCaregiver };


