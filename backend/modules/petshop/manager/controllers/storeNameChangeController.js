const StoreNameChangeRequest = require('../../admin/models/StoreNameChangeRequest');
const User = require('../../../../core/models/User');
const UserDetails = require('../../../../core/models/UserDetails');
const { generateStoreId } = require('../../../../core/utils/storeIdGenerator');
const logger = require('winston');

// Log controller actions with user context and operation details
const logAction = (req, action, data = {}) => {
  const userInfo = req.user ? `${req.user._id} (${req.user.role})` : 'unauthenticated';
  logger.info({
    action,
    user: userInfo,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Create a store name change request (manager)
const createStoreNameChangeRequest = async (req, res) => {
  try {
    const { requestedStoreName, reason = '' } = req.body || {};
    if (!requestedStoreName || String(requestedStoreName).trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Requested store name is required (min 3 characters).' });
    }
    // Prevent multiple pendings for same user
    const existing = await StoreNameChangeRequest.findOne({ userId: req.user._id, status: 'pending' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a pending request.' });
    }
    const doc = await StoreNameChangeRequest.create({
      userId: req.user._id,
      storeId: req.user.storeId || null,
      currentStoreName: req.user.storeName || '',
      requestedStoreName: String(requestedStoreName).trim(),
      status: 'pending',
      reason: String(reason || '')
    });
    return res.status(201).json({ success: true, message: 'Request submitted', data: { request: doc } });
  } catch (e) {
    console.error('Create store name change request error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin: list store name change requests
const adminListStoreNameChangeRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const q = StoreNameChangeRequest.find(filter)
      .populate('userId', 'name email role storeId storeName')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit,10), 50))
      .skip((parseInt(page,10) - 1) * parseInt(limit,10));
    const [items, total] = await Promise.all([
      q.exec(),
      StoreNameChangeRequest.countDocuments(filter)
    ]);
    res.json({ success: true, data: { requests: items, pagination: { current: parseInt(page,10), pages: Math.ceil(total / parseInt(limit,10) || 1), total } } });
  } catch (e) {
    console.error('List store name change requests error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin: approve/decline request
const adminDecideStoreNameChangeRequest = async (req, res) => {
  try {
    const { decision, reason = '' } = req.body || {};
    if (!['approved', 'declined'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decision must be approved or declined' });
    }
    const doc = await StoreNameChangeRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' });
    if (doc.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be decided' });
    }
    doc.status = decision;
    doc.reason = String(reason || '');
    doc.decidedBy = req.user._id;
    doc.decidedAt = new Date();
    await doc.save();

    // If approved, update only the storeName of the user (keep storeId unchanged)
    if (decision === 'approved') {
      try {
        await User.findByIdAndUpdate(doc.userId, { storeName: doc.requestedStoreName }, { new: true });
      } catch (uErr) {
        console.error('Failed updating user storeName after approval:', uErr);
      }
    }
    res.json({ success: true, message: `Request ${decision}`, data: { request: doc } });
  } catch (e) {
    console.error('Decide store name change request error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createStoreNameChangeRequest,
  adminListStoreNameChangeRequests,
  adminDecideStoreNameChangeRequest
};