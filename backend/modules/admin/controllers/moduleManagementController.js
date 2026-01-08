const User = require('../../../core/models/User');
const ManagerInvite = require('../../../core/models/ManagerInvite');
const Module = require('../../../core/models/Module');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * ADMIN: Module Assignment & Manager Management
 */

/**
 * Get all modules with assigned managers count
 */
exports.getAllModules = async (req, res) => {
  try {
    const modules = await Module.find({ isActive: true })
      .select('name description key features');
    
    // Get manager count for each module
    const modulesWithStats = await Promise.all(
      modules.map(async (module) => {
        const managerCount = await User.countDocuments({
          role: 'manager',
          assignedModules: module._id
        });
        
        return {
          ...module.toObject(),
          assignedManagers: managerCount
        };
      })
    );
    
    res.json({ success: true, data: modulesWithStats });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get all managers with their assigned modules and stores
 */
exports.getAllManagers = async (req, res) => {
  try {
    const { module, search, status } = req.query;
    
    const query = { role: 'manager' };
    
    if (module) {
      query.assignedModules = module;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'storeInfo.storeName': { $regex: search, $options: 'i' } }
      ];
    }
    
    const managers = await User.find(query)
      .populate('assignedModules', 'name key')
      .select('-password')
      .sort('-createdAt');
    
    res.json({ success: true, data: managers });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Invite new manager (creates user with temporary password)
 */
exports.inviteManager = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      assignedModules, // Array of module IDs
      storeName,
      storeAddress,
      storeCity,
      storeState
    } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Validate modules
    const modules = await Module.find({ 
      _id: { $in: assignedModules },
      isActive: true 
    });
    
    if (modules.length !== assignedModules.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Some modules are invalid or inactive' 
      });
    }
    
    // Generate temporary password
    const temporaryPassword = crypto.randomBytes(4).toString('hex'); // 8 characters
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    
    // Generate unique store ID
    const storeId = `STORE${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Create manager user
    const manager = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'manager',
      assignedModules,
      storeInfo: {
        storeId,
        storeName: storeName || `${name}'s Store`,
        storeAddress,
        storeCity,
        storeState,
        isActive: true
      },
      isTemporaryPassword: true,
      isActive: true
    });
    
    await manager.save();
    
    // Create invite record
    const invite = new ManagerInvite({
      manager: manager._id,
      email,
      temporaryPassword, // Store plain text for admin to send
      assignedModules,
      invitedBy: req.user._id,
      status: 'sent'
    });
    
    await invite.save();
    
    await manager.populate('assignedModules', 'name key');
    
    res.status(201).json({
      success: true,
      message: 'Manager invited successfully',
      data: {
        manager: {
          _id: manager._id,
          name: manager.name,
          email: manager.email,
          phone: manager.phone,
          storeInfo: manager.storeInfo,
          assignedModules: manager.assignedModules
        },
        temporaryPassword, // Send to admin to share with manager
        loginInstructions: {
          url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/manager/login`,
          email: manager.email,
          password: temporaryPassword,
          message: 'Manager must change password on first login'
        }
      }
    });
  } catch (error) {
    console.error('Invite manager error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update manager's assigned modules
 */
exports.updateManagerModules = async (req, res) => {
  try {
    const { managerId } = req.params;
    const { assignedModules } = req.body;
    
    const manager = await User.findOne({ 
      _id: managerId, 
      role: 'manager' 
    });
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    // Validate modules
    const modules = await Module.find({ 
      _id: { $in: assignedModules },
      isActive: true 
    });
    
    if (modules.length !== assignedModules.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Some modules are invalid' 
      });
    }
    
    manager.assignedModules = assignedModules;
    await manager.save();
    
    await manager.populate('assignedModules', 'name key');
    
    res.json({
      success: true,
      message: 'Manager modules updated successfully',
      data: manager
    });
  } catch (error) {
    console.error('Update manager modules error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update manager's store information
 */
exports.updateManagerStore = async (req, res) => {
  try {
    const { managerId } = req.params;
    const {
      storeName,
      storeAddress,
      storeCity,
      storeState,
      storePincode,
      storePhone,
      isActive
    } = req.body;
    
    const manager = await User.findOne({ 
      _id: managerId, 
      role: 'manager' 
    });
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    // Update store info
    if (storeName !== undefined) manager.storeInfo.storeName = storeName;
    if (storeAddress !== undefined) manager.storeInfo.storeAddress = storeAddress;
    if (storeCity !== undefined) manager.storeInfo.storeCity = storeCity;
    if (storeState !== undefined) manager.storeInfo.storeState = storeState;
    if (storePincode !== undefined) manager.storeInfo.storePincode = storePincode;
    if (storePhone !== undefined) manager.storeInfo.storePhone = storePhone;
    if (isActive !== undefined) manager.storeInfo.isActive = isActive;
    
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
 * Deactivate/Activate manager
 */
exports.toggleManagerStatus = async (req, res) => {
  try {
    const { managerId } = req.params;
    
    const manager = await User.findOne({ 
      _id: managerId, 
      role: 'manager' 
    });
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    manager.isActive = !manager.isActive;
    await manager.save();
    
    res.json({
      success: true,
      message: `Manager ${manager.isActive ? 'activated' : 'deactivated'} successfully`,
      data: manager
    });
  } catch (error) {
    console.error('Toggle manager status error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Reset manager password (generate new temporary password)
 */
exports.resetManagerPassword = async (req, res) => {
  try {
    const { managerId } = req.params;
    
    const manager = await User.findOne({ 
      _id: managerId, 
      role: 'manager' 
    });
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    // Generate new temporary password
    const temporaryPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    
    manager.password = hashedPassword;
    manager.isTemporaryPassword = true;
    await manager.save();
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        temporaryPassword,
        email: manager.email,
        message: 'Share this password with the manager'
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get manager statistics by module
 */
exports.getManagerStatsByModule = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { role: 'manager' } },
      { $unwind: '$assignedModules' },
      {
        $group: {
          _id: '$assignedModules',
          totalManagers: { $sum: 1 },
          activeManagers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'modules',
          localField: '_id',
          foreignField: '_id',
          as: 'module'
        }
      },
      { $unwind: '$module' },
      {
        $project: {
          moduleName: '$module.name',
          moduleKey: '$module.key',
          totalManagers: 1,
          activeManagers: 1
        }
      }
    ]);
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get manager stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get pending manager invites
 */
exports.getPendingInvites = async (req, res) => {
  try {
    const invites = await ManagerInvite.find({ 
      status: 'sent' 
    })
      .populate('manager', 'name email storeInfo')
      .populate('assignedModules', 'name key')
      .populate('invitedBy', 'name')
      .sort('-createdAt');
    
    res.json({ success: true, data: invites });
  } catch (error) {
    console.error('Get pending invites error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Delete manager
 */
exports.deleteManager = async (req, res) => {
  try {
    const { managerId } = req.params;
    
    const manager = await User.findOne({ 
      _id: managerId, 
      role: 'manager' 
    });
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    // Check if manager has active bookings/orders
    // Add checks based on modules
    
    await manager.deleteOne();
    
    // Delete associated invite
    await ManagerInvite.deleteMany({ manager: managerId });
    
    res.json({
      success: true,
      message: 'Manager deleted successfully'
    });
  } catch (error) {
    console.error('Delete manager error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
