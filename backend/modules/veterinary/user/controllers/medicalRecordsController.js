const { validationResult } = require('express-validator');
const MedicalRecord = require('../../../../core/models/MedicalRecord');
const Pet = require('../../../../core/models/Pet');

const createRecord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    const payload = {
      ...req.body,
      petId: req.params.petId,
      storeId: req.user.storeId,
      storeName: req.user.storeName,
      createdBy: req.user._id
    };
    const doc = await MedicalRecord.create(payload);
    res.status(201).json({ success: true, message: 'Medical record added', data: { record: doc } });
  } catch (e) {
    console.error('Create medical record error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listRecordsForPet = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ petId: req.params.petId })
      .populate({
        path: 'petId',
        select: 'name species breed imageIds',
        populate: { path: 'images', select: 'url caption isPrimary' }
      })
      .sort({ visitDate: -1 });
    res.json({ success: true, data: { records } });
  } catch (e) {
    console.error('List medical records error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createRecord, listRecordsForPet };