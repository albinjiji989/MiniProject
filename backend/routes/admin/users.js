const express = require('express');
const { auth, authorize } = require('../../middleware/auth');
const { body, validationResult } = require('express-validator');
const UserDetails = require('../../models/UserDetails');
const User = require('../../core/models/User');

const router = express.Router();

// Update per-user module access (block-list only; default is allow)
router.put('/:userId/module-access', [
  auth,
  authorize('admin'),
  body('blockedModules').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { userId } = req.params;
    const { blockedModules } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let details = await UserDetails.findOne({ userId });
    if (!details) details = new UserDetails({ userId });

    // Only maintain block list; clear any legacy allow list to keep logic simple
    details.allowedModules = [];
    if (Array.isArray(blockedModules)) details.blockedModules = blockedModules;

    await details.save();

    res.json({ success: true, message: 'Module access updated', data: { blockedModules: details.blockedModules } });
  } catch (error) {
    console.error('Update module access error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
