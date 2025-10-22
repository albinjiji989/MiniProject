const { validationResult } = require('express-validator');
const User = require('../../../../core/models/User');
const UserDetails = require('../../../../core/models/UserDetails');
const { generateStoreId } = require('../../../../core/utils/storeIdGenerator');

const getMyStoreInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let storeId = user.storeId || null;
    let storeName = user.storeName || '';
    let assignedModule = user.assignedModule || null;

    const userDetails = await UserDetails.findOne({ userId: req.user.id });
    if (userDetails) {
      if (userDetails.storeId) storeId = userDetails.storeId;
      if (userDetails.storeName) storeName = userDetails.storeName;
      if (userDetails.assignedModule) assignedModule = userDetails.assignedModule;
    }

    return res.json({
      success: true,
      data: {
        role: user.role,
        assignedModule,
        storeId,
        storeName
      }
    });
  } catch (e) {
    console.error('Get my store info error (temporary-care):', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateMyStoreInfo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Ensure storeId exists; generate if missing using temporary-care module key
    if (!user.storeId) {
      const moduleKey = user.assignedModule || (user.role?.split('_')[0]) || 'temporary-care';
      try {
        user.storeId = await generateStoreId(moduleKey, [{ model: User, field: 'storeId' }]);
      } catch (genErr) {
        console.warn('StoreId generation failed, fallback temporary-care:', genErr?.message);
        user.storeId = await generateStoreId('temporary-care', [{ model: User, field: 'storeId' }]);
      }
    }

    if (typeof req.body.storeName === 'string') {
      user.storeName = String(req.body.storeName).trim();
    }

    await user.save();

    const userDetails = await UserDetails.findOne({ userId: req.user.id });
    if (userDetails) {
      userDetails.storeId = user.storeId;
      userDetails.storeName = user.storeName;
      if (!userDetails.assignedModule) userDetails.assignedModule = 'temporary-care';
      await userDetails.save();
    } else {
      await new UserDetails({
        userId: req.user.id,
        assignedModule: 'temporary-care',
        storeId: user.storeId,
        storeName: user.storeName,
        storeDetails: { status: 'active' }
      }).save();
    }

    return res.json({ success: true, message: 'Store info updated', data: { storeId: user.storeId, storeName: user.storeName } });
  } catch (e) {
    console.error('Update my store info error (temporary-care):', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getMyStoreInfo, updateMyStoreInfo };


