const express = require('express');
const { body, validationResult } = require('express-validator');
const Role = require('../../models/rbac/Role');
const Permission = require('../../models/rbac/Permission');
const User = require('../../core/models/User');
const { auth, authorize } = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/roles
// @desc    Get all roles
// @access  Private (Admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   GET /api/roles/:id
// @desc    Get single role
// @access  Private (Admin only)
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email');

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   POST /api/roles
// @desc    Create new role
// @access  Private (Admin only)
router.post('/', auth, authorize('admin'), [
  body('name').notEmpty().withMessage('Role name is required')
    .matches(/^[a-z_]+$/).withMessage('Role name must contain only lowercase letters and underscores'),
  body('displayName').notEmpty().withMessage('Display name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('level').isInt({ min: 1, max: 10 }).withMessage('Level must be between 1 and 10'),
  body('permissions').optional().isArray(),
  body('isActive').optional().isBoolean()
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

    const { name, displayName, description, level, permissions = [], isActive = true } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ name: name.toLowerCase() });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    const role = new Role({
      name: name.toLowerCase(),
      displayName,
      description,
      level,
      permissions,
      isActive,
      createdBy: req.user.id
    });

    await role.save();

    // Populate the created role
    await role.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   PUT /api/roles/:id
// @desc    Update role
// @access  Private (Admin only)
router.put('/:id', auth, authorize('admin'), [
  body('name').optional().matches(/^[a-z_]+$/).withMessage('Role name must contain only lowercase letters and underscores'),
  body('displayName').optional().notEmpty().withMessage('Display name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('level').optional().isInt({ min: 1, max: 10 }).withMessage('Level must be between 1 and 10'),
  body('permissions').optional().isArray(),
  body('isActive').optional().isBoolean()
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

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if it's a system role
    if (role.isSystemRole) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify system roles'
      });
    }

    const { name, displayName, description, level, permissions, isActive } = req.body;

    // Check if name is being changed and if it conflicts
    if (name && name.toLowerCase() !== role.name) {
      const existingRole = await Role.findOne({ name: name.toLowerCase() });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role with this name already exists'
        });
      }
    }

    // Update role
    const updateData = {};
    if (name) updateData.name = name.toLowerCase();
    if (displayName) updateData.displayName = displayName;
    if (description) updateData.description = description;
    if (level) updateData.level = level;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'assignedUsers', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: updatedRole
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   DELETE /api/roles/:id
// @desc    Delete role
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if it's a system role
    if (role.isSystemRole) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system roles'
      });
    }

    // Check if any users are using this role
    const usersWithRole = await User.countDocuments({ role: role.name });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${usersWithRole} user(s) are currently using this role.`
      });
    }

    await Role.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   PUT /api/roles/:id/permissions
// @desc    Update role permissions
// @access  Private (Admin only)
router.put('/:id/permissions', auth, authorize('admin'), [
  body('permissions').isArray().withMessage('Permissions must be an array')
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

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if it's a system role
    if (role.isSystemRole) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify system role permissions'
      });
    }

    const { permissions } = req.body;

    // Update role permissions
    role.permissions = permissions;
    await role.save();

    // Populate and return updated role
    await role.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'assignedUsers', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Role permissions updated successfully',
      data: role
    });
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   POST /api/roles/initialize
// @desc    Initialize default roles
// @access  Private (Admin only)
router.post('/initialize', auth, authorize('admin'), async (req, res) => {
  try {
    const defaultRoles = [
      {
        name: 'admin',
        displayName: 'Administrator',
        description: 'System administrator with full access',
        level: 10,
        permissions: [
          { module: 'core', actions: ['manage'] },
          { module: 'rbac', actions: ['manage'] },
          { module: 'adoption', actions: ['manage'] },
          { module: 'petshop', actions: ['manage'] },
          { module: 'rescue', actions: ['manage'] },
          { module: 'veterinary', actions: ['manage'] },
          { module: 'ecommerce', actions: ['manage'] },
          { module: 'pharmacy', actions: ['manage'] }
        ],
        isSystemRole: true,
        isActive: true
      },
      {
        name: 'public_user',
        displayName: 'Public User',
        description: 'Regular user of the platform',
        level: 1,
        permissions: [
          { module: 'adoption', actions: ['read'] },
          { module: 'petshop', actions: ['read'] },
          { module: 'rescue', actions: ['read'] }
        ],
        isSystemRole: true,
        isActive: true
      }
    ];

    const existingRoles = await Role.find({});
    
    if (existingRoles.length === 0) {
      for (const roleData of defaultRoles) {
        const role = new Role({
          ...roleData,
          createdBy: req.user.id
        });
        await role.save();
      }
    }

    res.json({
      success: true,
      message: 'Default roles initialized successfully'
    });
  } catch (error) {
    console.error('Initialize roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

module.exports = router;