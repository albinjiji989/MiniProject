const { validationResult } = require('express-validator');
const TemporaryCareRequest = require('../../user/models/TemporaryCareRequest');
const TemporaryCare = require('../../models/TemporaryCare');
const Caregiver = require('../models/Caregiver');

// List requests for manager's store
const listRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    if (!req.user.storeId) return res.status(400).json({ success: false, message: 'Manager has no storeId' });
    const filter = { storeId: req.user.storeId };
    if (status) filter.status = status;
    const items = await TemporaryCareRequest.find(filter)
      .populate('pet', 'name species breed images')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10), 50))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10));
    const total = await TemporaryCareRequest.countDocuments(filter);
    res.json({ success: true, data: { requests: items, pagination: { current: parseInt(page, 10), pages: Math.ceil(total / parseInt(limit, 10) || 1), total } } });
  } catch (e) {
    console.error('TC manager list requests error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Approve or decline a request
const decideRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    const { decision } = req.body; // 'approved' or 'declined'
    const doc = await TemporaryCareRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' });
    if (doc.storeId !== req.user.storeId) return res.status(403).json({ success: false, message: 'Not your store request' });
    if (!['approved', 'declined'].includes(decision)) return res.status(400).json({ success: false, message: 'Invalid decision' });
    if (doc.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending requests can be decided' });
    doc.status = decision;
    await doc.save();
    res.json({ success: true, message: `Request ${decision}`, data: { request: doc } });
  } catch (e) {
    console.error('TC manager decide request error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Assign an approved request to a caregiver and create a TemporaryCare record
const assignRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    const { caregiverId } = req.body;
    const reqDoc = await TemporaryCareRequest.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Request not found' });
    if (reqDoc.storeId !== req.user.storeId) return res.status(403).json({ success: false, message: 'Not your store request' });
    if (!['approved', 'assigned'].includes(reqDoc.status)) return res.status(400).json({ success: false, message: 'Request must be approved or assigned' });

    const caregiver = await Caregiver.findById(caregiverId);
    if (!caregiver) return res.status(404).json({ success: false, message: 'Caregiver not found' });
    if (caregiver.storeId !== req.user.storeId) return res.status(403).json({ success: false, message: 'Caregiver not from your store' });

    // Create or update a TemporaryCare record
    const care = await TemporaryCare.create({
      pet: reqDoc.pet,
      owner: { name: reqDoc.userId?.name || 'Requester', email: reqDoc.userId?.email || 'n/a', phone: '' },
      caregiver: caregiver._id,
      startDate: reqDoc.startDate,
      endDate: reqDoc.endDate,
      careType: reqDoc.careType,
      notes: reqDoc.notes || '',
      storeId: reqDoc.storeId,
      storeName: req.user.storeName || ''
    }).catch(async (err) => {
      // Fallback with minimal owner details if required in schema
      return await TemporaryCare.create({
        pet: reqDoc.pet,
        owner: { name: 'Requester', email: 'n/a', phone: '' },
        caregiver: caregiver._id,
        startDate: reqDoc.startDate,
        endDate: reqDoc.endDate,
        careType: reqDoc.careType,
        notes: reqDoc.notes || '',
        storeId: reqDoc.storeId,
        storeName: req.user.storeName || ''
      })
    });

    reqDoc.status = 'assigned';
    reqDoc.assignedCareId = care._id;
    await reqDoc.save();

    // Optionally mark caregiver busy
    try { caregiver.status = 'busy'; await caregiver.save(); } catch (_) {}

    res.json({ success: true, message: 'Request assigned', data: { request: reqDoc, care } });
  } catch (e) {
    console.error('TC manager assign request error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { listRequests, decideRequest, assignRequest };


