const { validationResult } = require('express-validator');
const TemporaryCare = require('../models/TemporaryCare');
const Caregiver = require('../models/Caregiver');
const { getStoreFilter } = require('../../../utils/storeFilter');

const listTemporaryCares = async (req, res) => {
  try {
    const { status, careType, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (careType) filter.careType = careType;

    const temporaryCares = await TemporaryCare.find(filter)
      .populate('pet', 'name species breed age gender images')
      .populate('caregiver', 'name email phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TemporaryCare.countDocuments(filter);
    res.json({ success: true, data: { temporaryCares, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (error) {
    console.error('Get temporary care error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createTemporaryCare = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const temporaryCareData = { ...req.body, createdBy: req.user._id };
    const temporaryCare = new TemporaryCare(temporaryCareData);
    await temporaryCare.save();
    await temporaryCare.populate('pet', 'name species breed age gender images');
    await temporaryCare.populate('caregiver', 'name email phone');
    res.status(201).json({ success: true, message: 'Temporary care record created successfully', data: { temporaryCare } });
  } catch (error) {
    console.error('Create temporary care error:', error);
    res.status(500).json({ success: false, message: 'Server error during temporary care creation' });
  }
};

const getTemporaryCareStats = async (req, res) => {
  try {
    const storeFilter = getStoreFilter(req.user);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRequests, activeCare, availableCaregivers, completedCare] = await Promise.all([
      TemporaryCare.countDocuments({ ...storeFilter }),
      TemporaryCare.countDocuments({ ...storeFilter, status: 'active' }),
      Caregiver.countDocuments({ ...storeFilter, status: 'available' }),
      TemporaryCare.countDocuments({ ...storeFilter, status: 'completed', createdAt: { $gte: startOfMonth } })
    ]);

    res.json({ success: true, data: { totalRequests, activeCare, availableCaregivers, completedCare } });
  } catch (e) {
    console.error('Temporary care stats error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listCaregivers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const storeFilter = getStoreFilter(req.user);
    const filter = { ...storeFilter };
    if (status) filter.status = status;

    const caregivers = await Caregiver.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Caregiver.countDocuments(filter);
    res.json({ success: true, data: { caregivers, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (e) {
    console.error('List caregivers error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createCaregiver = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const payload = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      status: req.body.status || 'available',
      skills: req.body.skills || [],
      notes: req.body.notes || '',
      address: req.body.address || {},
      storeId: req.user.storeId || req.body.storeId,
      storeName: req.user.storeName || req.body.storeName,
      createdBy: req.user._id
    };
    const caregiver = await Caregiver.create(payload);
    res.status(201).json({ success: true, message: 'Caregiver created', data: { caregiver } });
  } catch (e) {
    console.error('Create caregiver error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateCaregiver = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const storeFilter = getStoreFilter(req.user);
    const caregiver = await Caregiver.findOneAndUpdate({ _id: id, ...storeFilter }, updates, { new: true });
    if (!caregiver) return res.status(404).json({ success: false, message: 'Caregiver not found' });
    res.json({ success: true, message: 'Caregiver updated', data: { caregiver } });
  } catch (e) {
    console.error('Update caregiver error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteCaregiver = async (req, res) => {
  try {
    const { id } = req.params;
    const storeFilter = getStoreFilter(req.user);
    const deleted = await Caregiver.findOneAndDelete({ _id: id, ...storeFilter });
    if (!deleted) return res.status(404).json({ success: false, message: 'Caregiver not found' });
    res.json({ success: true, message: 'Caregiver removed' });
  } catch (e) {
    console.error('Delete caregiver error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { listTemporaryCares, createTemporaryCare, getTemporaryCareStats, listCaregivers, createCaregiver, updateCaregiver, deleteCaregiver };


