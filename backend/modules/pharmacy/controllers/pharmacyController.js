const { validationResult } = require('express-validator');
const Medication = require('../models/Medication');
const { getStoreFilter } = require('../../../utils/storeFilter');

const listMedications = async (req, res) => {
  try {
    const { category, isActive, page = 1, limit = 10 } = req.query;
    const filter = { ...getStoreFilter(req.user) };
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const medications = await Medication.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Medication.countDocuments(filter);
    res.json({ success: true, data: { medications, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createMedication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const medicationData = {
      ...req.body,
      createdBy: req.user._id,
      storeId: req.user.storeId,
      storeName: req.user.storeName
    };
    const medication = new Medication(medicationData);
    await medication.save();
    await medication.populate('createdBy', 'name email');
    res.status(201).json({ success: true, message: 'Medication created successfully', data: { medication } });
  } catch (error) {
    console.error('Create medication error:', error);
    res.status(500).json({ success: false, message: 'Server error during medication creation' });
  }
};

const getMedicationById = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...getStoreFilter(req.user) };
    const medication = await Medication.findOne(filter).populate('createdBy', 'name email');
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });
    res.json({ success: true, data: { medication } });
  } catch (error) {
    console.error('Get medication error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateMedication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    const filter = { _id: req.params.id, ...getStoreFilter(req.user) };
    const medication = await Medication.findOneAndUpdate(filter, req.body, { new: true, runValidators: true })
      .populate('createdBy', 'name email');
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found or not allowed' });
    res.json({ success: true, message: 'Medication updated successfully', data: { medication} });
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({ success: false, message: 'Server error during medication update' });
  }
};

const deleteMedication = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...getStoreFilter(req.user) };
    const medication = await Medication.findOneAndDelete(filter);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found or not allowed' });
    res.json({ success: true, message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ success: false, message: 'Server error during medication deletion' });
  }
};

module.exports = { listMedications, createMedication, getMedicationById, updateMedication, deleteMedication };


