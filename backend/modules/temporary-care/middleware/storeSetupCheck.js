const User = require('../../../core/models/User');

const requireStoreSetup = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if store name is set
    if (!user.storeName || user.storeName.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Store name is required. Please set up your store name first.',
        requiresStoreSetup: true
      });
    }

    next();
  } catch (e) {
    console.error('Store setup check error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { requireStoreSetup };