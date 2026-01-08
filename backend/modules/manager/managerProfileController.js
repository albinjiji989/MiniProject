const User = require('../../core/models/User');

/**
 * MANAGER: Get own profile and store information
 */
exports.getProfile = async (req, res) => {
  try {
    const manager = await User.findById(req.user._id)
      .populate('assignedModules', 'name key description features')
      .select('-password');
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: {
        ...manager.toObject(),
        needsPasswordChange: manager.isTemporaryPassword
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * MANAGER: Update own store information
 */
exports.updateStoreInfo = async (req, res) => {
  try {
    const {
      storeName,
      storeAddress,
      storeCity,
      storeState,
      storePincode,
      storePhone,
      storeDescription
    } = req.body;
    
    const manager = await User.findById(req.user._id);
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    // Update allowed fields
    if (storeName !== undefined) manager.storeInfo.storeName = storeName;
    if (storeAddress !== undefined) manager.storeInfo.storeAddress = storeAddress;
    if (storeCity !== undefined) manager.storeInfo.storeCity = storeCity;
    if (storeState !== undefined) manager.storeInfo.storeState = storeState;
    if (storePincode !== undefined) manager.storeInfo.storePincode = storePincode;
    if (storePhone !== undefined) manager.storeInfo.storePhone = storePhone;
    if (storeDescription !== undefined) manager.storeInfo.storeDescription = storeDescription;
    
    await manager.save();
    
    res.json({
      success: true,
      message: 'Store information updated successfully',
      data: manager.storeInfo
    });
  } catch (error) {
    console.error('Update store info error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * MANAGER: Change password (required on first login)
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const manager = await User.findById(req.user._id);
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    // Verify current password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, manager.password);
    
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    manager.password = hashedPassword;
    manager.isTemporaryPassword = false;
    await manager.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * MANAGER: Get dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const manager = await User.findById(req.user._id)
      .populate('assignedModules', 'key');
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    const stats = {
      storeInfo: manager.storeInfo,
      assignedModules: manager.assignedModules,
      moduleStats: []
    };
    
    // Get stats for each assigned module
    for (const module of manager.assignedModules) {
      if (module.key === 'temporary-care') {
        const CareBooking = require('../../modules/temporary-care/models/CareBooking');
        
        const [totalBookings, activeBookings, revenue] = await Promise.all([
          CareBooking.countDocuments({ storeId: manager.storeInfo.storeId }),
          CareBooking.countDocuments({ 
            storeId: manager.storeInfo.storeId,
            status: { $in: ['confirmed', 'in_progress'] }
          }),
          CareBooking.aggregate([
            { 
              $match: { 
                storeId: manager.storeInfo.storeId,
                'payment.status': 'completed'
              } 
            },
            { $group: { _id: null, total: { $sum: '$pricing.finalAmount' } } }
          ])
        ]);
        
        stats.moduleStats.push({
          module: 'Temporary Care',
          key: 'temporary-care',
          totalBookings,
          activeBookings,
          revenue: revenue[0]?.total || 0
        });
      }
      
      if (module.key === 'ecommerce') {
        const Order = require('../../modules/ecommerce/models/Order');
        const Product = require('../../modules/ecommerce/models/Product');
        
        const [totalProducts, activeProducts, totalOrders, pendingOrders, revenue] = await Promise.all([
          Product.countDocuments({ storeId: manager.storeInfo.storeId }),
          Product.countDocuments({ 
            storeId: manager.storeInfo.storeId,
            status: 'active'
          }),
          Order.countDocuments({ seller: manager._id }),
          Order.countDocuments({ 
            seller: manager._id,
            status: 'pending'
          }),
          Order.aggregate([
            { 
              $match: { 
                seller: manager._id,
                'payment.status': 'completed'
              } 
            },
            { $group: { _id: null, total: { $sum: '$pricing.total' } } }
          ])
        ]);
        
        stats.moduleStats.push({
          module: 'E-Commerce',
          key: 'ecommerce',
          totalProducts,
          activeProducts,
          totalOrders,
          pendingOrders,
          revenue: revenue[0]?.total || 0
        });
      }
      
      // Add other modules as needed
    }
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
