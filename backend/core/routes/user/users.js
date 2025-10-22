const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../../../core/models/User');
const { auth, authorize } = require('../../../core/middleware/auth');

const router = express.Router();

// @route   POST /api/users
// @desc    Create new user (Admin only)
// @access  Private (Admin only)
router.post('/', auth, authorize('admin'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'adoption_manager', 'petshop_manager', 'rescue_manager', 'ecommerce_manager', 'pharmacy_manager', 'boarding_manager', 'temporary_care_manager', 'veterinary_manager', 'public_user', 'module_worker']).withMessage('Invalid role'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, password, role, phone, address, assignedModules, isActive = true } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = new User({
      name,
      email,
      password,
      role,
      phone,
      address,
      assignedModules,
      isActive,
      authProvider: 'local'
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          assignedModules: user.assignedModules,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user creation'
    });
  }
});

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const usersRaw = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Enrich with UserDetails (allowed/blocked modules, assignedModule, etc.)
    const UserDetails = require('../../../core/models/UserDetails');
    const users = await Promise.all(
      usersRaw.map(async (u) => {
        const details = await UserDetails.findOne({ userId: u._id }).lean();
        return {
          ...u.toObject(),
          assignedModule: details?.assignedModule || u.assignedModule || null,
          allowedModules: details?.allowedModules || [],
          blockedModules: details?.blockedModules || [],
        };
      })
    );

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Move specific routes before ":id" to avoid collisions

// @route   GET /api/users/public
// @desc    Get all public users only
// @access  Private (Admin only)
router.get('/public', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1)
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 200)
    
    const filter = { role: 'public_user' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status && status !== 'all') filter.isActive = status === 'active';

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get public users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get comprehensive user and module statistics (real DB values)
// @access  Private (Admin only)
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const Module = require('../../../core/models/Module');

    // Core user counts
    let totalUsers = 0, activeUsers = 0, publicUsers = 0, adminUsers = 0, managerUsers = 0
    let publicActiveUsers = 0, publicInactiveUsers = 0
    try { totalUsers = await User.countDocuments() } catch (e) {}
    try { activeUsers = await User.countDocuments({ isActive: true }) } catch (e) {}
    try { publicUsers = await User.countDocuments({ role: 'public_user' }) } catch (e) {}
    try { publicActiveUsers = await User.countDocuments({ role: 'public_user', isActive: true }) } catch (e) {}
    try { publicInactiveUsers = await User.countDocuments({ role: 'public_user', isActive: false }) } catch (e) {}
    try { adminUsers = await User.countDocuments({ role: 'admin' }) } catch (e) {}
    try { managerUsers = await User.countDocuments({ role: { $regex: /_manager$/ } }) } catch (e) {}

    const inactiveUsers = totalUsers - activeUsers;

    // Recent registrations (last 30 days) total and by day
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let recentRegistrations = 0, registrationsByDayAgg = []
    try {
      recentRegistrations = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    } catch (e) {}
    try {
      registrationsByDayAgg = await User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    } catch (e) { registrationsByDayAgg = [] }

    const recentRegistrationsByDay = registrationsByDayAgg.map(item => ({ date: item._id, count: item.count }));

    // Managers by module (based on role suffix _manager and assignedModule field)
    let modules = []
    try {
      modules = await Module.find({}, { key: 1, name: 1, status: 1 }).sort({ displayOrder: 1, name: 1 })
    } catch (e) { modules = [] }

    const managersByModule = {};
    for (const mod of modules) {
      try {
        const managerRole = `${mod.key}_manager`;
        const [byRole, byAssignment] = await Promise.all([
          User.countDocuments({ role: managerRole }),
          User.countDocuments({ assignedModule: mod.key, role: { $regex: /_manager$/ } })
        ]);
        managersByModule[mod.key] = byRole || byAssignment;
      } catch (e) {
        managersByModule[mod.key] = 0
      }
    }

    // Module counts by status
    let totalModules = 0, activeModules = 0, blockedModules = 0, maintenanceModules = 0, comingSoonModules = 0
    try { totalModules = await Module.countDocuments() } catch (e) {}
    try { activeModules = await Module.countDocuments({ status: 'active' }) } catch (e) {}
    try { blockedModules = await Module.countDocuments({ status: 'blocked' }) } catch (e) {}
    try { maintenanceModules = await Module.countDocuments({ status: 'maintenance' }) } catch (e) {}
    try { comingSoonModules = await Module.countDocuments({ status: 'coming_soon' }) } catch (e) {}

    res.json({
      success: true,
      data: {
        // Users
        totalUsers,
        activeUsers,
        inactiveUsers,
        publicUsers,
        publicActiveUsers,
        publicInactiveUsers,
        adminUsers,
        managerUsers,
        recentRegistrations,
        recentRegistrationsByDay,
        userDistribution: {
          public: publicUsers,
          admin: adminUsers,
          managers: managerUsers
        },
        // Managers per module
        managersByModule,
        // Modules
        modules: modules.map(m => ({ key: m.key, name: m.name, status: m.status })),
        moduleCounts: {
          totalModules,
          activeModules,
          blockedModules,
          maintenanceModules,
          comingSoonModules
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error?.message || 'Unknown error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin only)
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { Types } = require('mongoose');
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    const userDoc = await User.findById(req.params.id).select('-password');
    
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach UserDetails
    const UserDetails = require('../../../core/models/UserDetails');
    const details = await UserDetails.findOne({ userId: userDoc._id }).lean();
    const user = {
      ...userDoc.toObject(),
      assignedModule: details?.assignedModule || userDoc.assignedModule || null,
      allowedModules: details?.allowedModules || [],
      blockedModules: details?.blockedModules || [],
    };

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/:id', auth, authorize('admin'), [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('role').optional().isIn(['admin', 'adoption_manager', 'petshop_manager', 'rescue_manager', 'ecommerce_manager', 'pharmacy_manager', 'boarding_manager', 'temporary_care_manager', 'veterinary_manager', 'public_user', 'module_worker']).withMessage('Invalid role'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, role, phone, address, assignedModules, isActive } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (assignedModules) updateData.assignedModules = assignedModules;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user update'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user deletion'
    });
  }
});

// @route   PUT /api/users/:id/activate
// @desc    Activate user
// @access  Private (Admin only)
router.put('/:id/activate', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User activated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user activation'
    });
  }
});

// @route   GET /api/users/module/:module
// @desc    Get users by module
// @access  Private (Admin only)
router.get('/module/:module', auth, authorize('admin'), async (req, res) => {
  try {
    const { module } = req.params;
    const validModules = ['adoption', 'petshop', 'rescue', 'ecommerce', 'pharmacy', 'boarding', 'temporary_care', 'veterinary'];
    
    if (!validModules.includes(module)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module name'
      });
    }

    const users = await User.find({
      $or: [
        { role: `${module}_manager` },
        { assignedModules: module }
      ],
      isActive: true
    }).select('-password');

    res.json({
      success: true,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Get module users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/public
// @desc    Get all public users only
// @access  Private (Admin only)
router.get('/public', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1)
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 200)
    
    const filter = { role: 'public_user' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status && status !== 'all') filter.isActive = status === 'active';

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get public users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   GET /api/users/:id/details
// @desc    Get detailed user information including pets and activities
// @access  Private (Admin only)
router.get('/:id/details', auth, authorize('admin'), async (req, res) => {
  try {
    const userDoc = await User.findById(req.params.id).select('-password');
    
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const UserDetails = require('../../../core/models/UserDetails');
    const details = await UserDetails.findOne({ userId: userDoc._id }).lean();
    const user = {
      ...userDoc.toObject(),
      assignedModule: details?.assignedModule || userDoc.assignedModule || null,
      allowedModules: details?.allowedModules || [],
      blockedModules: details?.blockedModules || [],
    };

    // Get user's pets (if Pet model exists)
    const Pet = require('../../../core/models/Pet');

    let pets = [];
    try {
      pets = await Pet.find({ ownerId: user._id }).sort({ createdAt: -1 });
    } catch (petError) {
      console.log('Pet model not available');
    }

    // Get user's activities (if Activity model exists)
    const Activity = require('../../core/models/Activity');

    let activities = [];
    try {
      activities = await Activity.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20);
    } catch (activityError) {
      console.log('Activity model not available');
    }

    // Get user's adoption applications (if Adoption model exists)
    const Adoption = require('../../../core/models/Adoption');

    let adoptions = [];
    try {
      adoptions = await Adoption.find({ adopterId: user._id }).sort({ createdAt: -1 }).limit(10);
    } catch (adoptionError) {
      console.log('Adoption model not available');
    }

    // Get user's rescue requests (if Rescue model exists)
    const Rescue = require('../../../core/models/Rescue');

    let rescues = [];
    try {
      rescues = await Rescue.find({ requesterId: user._id }).sort({ createdAt: -1 }).limit(10);
    } catch (rescueError) {
      console.log('Rescue model not available');
    }

    res.json({
      success: true,
      data: {
        user,
        pets,
        activities,
        adoptions,
        rescues,
        stats: {
          totalPets: pets.length,
          totalActivities: activities.length,
          totalAdoptions: adoptions.length,
          totalRescues: rescues.length
        }
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Toggle user active status
// @access  Private (Admin only)
router.put('/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (typeof status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Status must be a boolean value'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${status ? 'activated' : 'deactivated'} successfully`,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during status update'
    });
  }
});

// @route   DELETE /api/users/:id/permanent
// @desc    Permanently delete user
// @access  Private (Admin only)
router.delete('/:id/permanent', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User permanently deleted',
      data: {
        deletedUser: {
          _id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Permanent delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during permanent deletion'
    });
  }
});

// @route   GET /api/users/:id/activities
// @desc    Get user activities
// @access  Private (Admin only)
router.get('/:id/activities', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    let activities = [];
    try {
      const Activity = require('../../core/models/Activity');
      activities = await Activity.find({ userId: req.params.id })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } catch (error) {
      console.log('Activity model not available');
    }

    res.json({
      success: true,
      data: {
        activities
      }
    });
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id/pets
// @desc    Get user pets
// @access  Private (Admin only)
router.get('/:id/pets', auth, authorize('admin'), async (req, res) => {
  try {
    let pets = [];
    try {
      const Pet = require('../../../core/models/Pet');
      pets = await Pet.find({ ownerId: req.params.id }).sort({ createdAt: -1 });
    } catch (error) {
      console.log('Pet model not available');
    }

    res.json({
      success: true,
      data: {
        pets
      }
    });
  } catch (error) {
    console.error('Get user pets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get comprehensive user and module statistics (real DB values)
// @access  Private (Admin only)
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const Module = require('../../../core/models/Module');

    // Core user counts
    let totalUsers = 0, activeUsers = 0, publicUsers = 0, adminUsers = 0, managerUsers = 0
    try { totalUsers = await User.countDocuments() } catch (e) {}
    try { activeUsers = await User.countDocuments({ isActive: true }) } catch (e) {}
    try { publicUsers = await User.countDocuments({ role: 'public_user' }) } catch (e) {}
    try { adminUsers = await User.countDocuments({ role: 'admin' }) } catch (e) {}
    try { managerUsers = await User.countDocuments({ role: { $regex: /_manager$/ } }) } catch (e) {}

    const inactiveUsers = totalUsers - activeUsers;

    // Recent registrations (last 30 days) total and by day
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let recentRegistrations = 0, registrationsByDayAgg = []
    try {
      recentRegistrations = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    } catch (e) {}
    try {
      registrationsByDayAgg = await User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    } catch (e) { registrationsByDayAgg = [] }

    const recentRegistrationsByDay = registrationsByDayAgg.map(item => ({ date: item._id, count: item.count }));

    // Managers by module (based on role suffix _manager and assignedModule field)
    let modules = []
    try {
      modules = await Module.find({}, { key: 1, name: 1, status: 1 }).sort({ displayOrder: 1, name: 1 })
    } catch (e) { modules = [] }

    const managersByModule = {};
    for (const mod of modules) {
      try {
        const managerRole = `${mod.key}_manager`;
        const [byRole, byAssignment] = await Promise.all([
          User.countDocuments({ role: managerRole }),
          User.countDocuments({ assignedModule: mod.key, role: { $regex: /_manager$/ } })
        ]);
        managersByModule[mod.key] = byRole || byAssignment;
      } catch (e) {
        managersByModule[mod.key] = 0
      }
    }

    // Module counts by status
    let totalModules = 0, activeModules = 0, blockedModules = 0, maintenanceModules = 0, comingSoonModules = 0
    try { totalModules = await Module.countDocuments() } catch (e) {}
    try { activeModules = await Module.countDocuments({ status: 'active' }) } catch (e) {}
    try { blockedModules = await Module.countDocuments({ status: 'blocked' }) } catch (e) {}
    try { maintenanceModules = await Module.countDocuments({ status: 'maintenance' }) } catch (e) {}
    try { comingSoonModules = await Module.countDocuments({ status: 'coming_soon' }) } catch (e) {}

    res.json({
      success: true,
      data: {
        // Users
        totalUsers,
        activeUsers,
        inactiveUsers,
        publicUsers,
        adminUsers,
        managerUsers,
        recentRegistrations,
        recentRegistrationsByDay,
        userDistribution: {
          public: publicUsers,
          admin: adminUsers,
          managers: managerUsers
        },
        // Managers per module
        managersByModule,
        // Modules
        modules: modules.map(m => ({ key: m.key, name: m.name, status: m.status })),
        moduleCounts: {
          totalModules,
          activeModules,
          blockedModules,
          maintenanceModules,
          comingSoonModules
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error?.message || 'Unknown error' });
  }
});

// @route   PUT /api/users/bulk/status
// @desc    Bulk activate/deactivate users
// @access  Private (Admin only)
router.put('/bulk/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { userIds, status } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds must be a non-empty array'
      });
    }

    if (typeof status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'status must be a boolean'
      });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { isActive: status } }
    );

    res.json({
      success: true,
      message: `Updated status for ${result.modifiedCount || result.nModified || 0} users`,
      data: { modified: result.modifiedCount || result.nModified || 0 }
    });
  } catch (error) {
    console.error('Bulk status update error:', error);
    res.status(500).json({ success: false, message: 'Server error during bulk status update' });
  }
});

// @route   DELETE /api/users/bulk/delete
// @desc    Bulk permanent delete users
// @access  Private (Admin only)
router.delete('/bulk/delete', auth, authorize('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds must be a non-empty array'
      });
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount || 0} users`,
      data: { deleted: result.deletedCount || 0 }
    });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({ success: false, message: 'Server error during bulk delete' });
  }
});

module.exports = router;
