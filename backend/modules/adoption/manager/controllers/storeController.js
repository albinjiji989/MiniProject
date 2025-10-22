const User = require('../../../../core/models/User');
const UserDetails = require('../../../../core/models/UserDetails');
const { generateStoreId } = require('../../../../core/utils/storeIdGenerator');

// Get current manager's store info
const getMyStoreInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        storeId: user.storeId || null,
        storeName: user.storeName || '',
        assignedModule: user.assignedModule || 'adoption'
      }
    });
  } catch (error) {
    console.error('Adoption getMyStoreInfo error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update current manager's store info (storeName only)
const updateMyStoreInfo = async (req, res) => {
  try {
    const { storeName } = req.body;

    if (!storeName || storeName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Store name must be at least 3 characters'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate storeId if doesn't exist
    if (!user.storeId) {
      const moduleId = user.assignedModule || 'adoption';
      user.storeId = await generateStoreId(moduleId);
    }

    user.storeName = storeName.trim();
    await user.save();

    // Also update UserDetails model to ensure consistency with auth middleware
    const userDetails = await UserDetails.findOne({ userId: req.user.id });
    if (userDetails) {
      userDetails.storeId = user.storeId;
      userDetails.storeName = user.storeName;
      if (!userDetails.assignedModule) userDetails.assignedModule = 'adoption';
      await userDetails.save();
    } else {
      await new UserDetails({
        userId: req.user.id,
        assignedModule: 'adoption',
        storeId: user.storeId,
        storeName: user.storeName,
        storeDetails: { status: 'active' }
      }).save();
    }

    res.json({
      success: true,
      message: 'Store information updated successfully',
      data: {
        storeId: user.storeId,
        storeName: user.storeName,
        assignedModule: user.assignedModule || 'adoption'
      }
    });
  } catch (error) {
    console.error('Adoption updateMyStoreInfo error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMyStoreInfo,
  updateMyStoreInfo
};
