const { validationResult } = require('express-validator');
const Veterinary = require('../models/Veterinary');

const listClinics = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const clinics = await Veterinary.find(filter)
      .populate('createdBy', 'name email')
      .populate('veterinarians.user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Veterinary.countDocuments(filter);

    res.json({
      success: true,
      data: {
        clinics,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get clinics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createClinic = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const clinicData = { ...req.body, createdBy: req.user._id };
    const clinic = new Veterinary(clinicData);
    await clinic.save();
    await clinic.populate('createdBy', 'name email');

    res.status(201).json({ success: true, message: 'Veterinary clinic created successfully', data: { clinic } });
  } catch (error) {
    console.error('Create clinic error:', error);
    res.status(500).json({ success: false, message: 'Server error during clinic creation' });
  }
};

module.exports = { listClinics, createClinic };


