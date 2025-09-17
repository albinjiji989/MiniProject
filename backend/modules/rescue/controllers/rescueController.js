const { validationResult } = require('express-validator');
const Rescue = require('../models/Rescue');
const Pet = require('../../../core/models/Pet');
const { getStoreFilter } = require('../../../utils/storeFilter');

const listRescues = async (req, res) => {
  try {
    const { status, urgency, page = 1, limit = 10 } = req.query;
    const filter = { ...getStoreFilter(req.user) };
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;

    const rescues = await Rescue.find(filter)
      .populate('pet', 'name species breed age gender images')
      .populate('assignedTo', 'name email')
      .populate('rescueTeam', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rescue.countDocuments(filter);
    res.json({ success: true, data: { rescues, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (error) {
    console.error('Get rescues error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createRescue = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const rescueId = `RESCUE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const rescueData = { ...req.body, rescueId, createdBy: req.user._id, storeId: req.user.storeId, storeName: req.user.storeName };
    const rescue = new Rescue(rescueData);
    await rescue.save();
    await rescue.populate('pet', 'name species breed age gender images');
    res.status(201).json({ success: true, message: 'Rescue case created successfully', data: { rescue } });
  } catch (error) {
    console.error('Create rescue error:', error);
    res.status(500).json({ success: false, message: 'Server error during rescue creation' });
  }
};

module.exports = { listRescues, createRescue };


