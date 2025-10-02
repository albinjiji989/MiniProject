const express = require('express');
const { body, validationResult } = require('express-validator');
const Permission = require('../../models/rbac/Permission');
const { auth, authorize } = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/permissions
// @desc    Get all permissions
// @access  Private (Admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { module, action, isActive } = req.query;
    
    const filter = {};
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const permissions = await Permission.find(filter)
      .sort({ module: 1, action: 1, name: 1 });

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   GET /api/permissions/:id
// @desc    Get single permission
// @access  Private (Admin only)
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error('Get permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   POST /api/permissions
// @desc    Create new permission
// @access  Private (Admin only)
router.post('/', auth, authorize('admin'), [
  body('name').notEmpty().withMessage('Permission name is required')
    .matches(/^[a-z_]+$/).withMessage('Permission name must contain only lowercase letters and underscores'),
  body('displayName').notEmpty().withMessage('Display name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('module').isIn(['adoption', 'petshop', 'rescue', 'veterinary', 'ecommerce', 'pharmacy', 'donation', 'boarding', 'rbac', 'core']).withMessage('Invalid module'),
  body('action').isIn(['create', 'read', 'update', 'delete', 'manage', 'approve', 'assign']).withMessage('Invalid action'),
  body('resource').notEmpty().withMessage('Resource is required'),
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

    const { name, displayName, description, module, action, resource, conditions = [], isActive = true } = req.body;

    // Check if permission already exists
    const existingPermission = await Permission.findOne({ name: name.toLowerCase() });
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: 'Permission with this name already exists'
      });
    }

    const permission = new Permission({
      name: name.toLowerCase(),
      displayName,
      description,
      module,
      action,
      resource,
      conditions,
      isActive
    });

    await permission.save();

    res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      data: permission
    });
  } catch (error) {
    console.error('Create permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   PUT /api/permissions/:id
// @desc    Update permission
// @access  Private (Admin only)
router.put('/:id', auth, authorize('admin'), [
  body('name').optional().matches(/^[a-z_]+$/).withMessage('Permission name must contain only lowercase letters and underscores'),
  body('displayName').optional().notEmpty().withMessage('Display name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('module').optional().isIn(['adoption', 'petshop', 'rescue', 'veterinary', 'ecommerce', 'pharmacy', 'donation', 'boarding', 'rbac', 'core']).withMessage('Invalid module'),
  body('action').optional().isIn(['create', 'read', 'update', 'delete', 'manage', 'approve', 'assign']).withMessage('Invalid action'),
  body('resource').optional().notEmpty().withMessage('Resource cannot be empty'),
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

    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Check if it's a system permission
    if (permission.isSystemPermission) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify system permissions'
      });
    }

    const { name, displayName, description, module, action, resource, conditions, isActive } = req.body;

    // Check if name is being changed and if it conflicts
    if (name && name.toLowerCase() !== permission.name) {
      const existingPermission = await Permission.findOne({ name: name.toLowerCase() });
      if (existingPermission) {
        return res.status(400).json({
          success: false,
          message: 'Permission with this name already exists'
        });
      }
    }

    // Update permission
    const updateData = {};
    if (name) updateData.name = name.toLowerCase();
    if (displayName) updateData.displayName = displayName;
    if (description) updateData.description = description;
    if (module) updateData.module = module;
    if (action) updateData.action = action;
    if (resource) updateData.resource = resource;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedPermission = await Permission.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Permission updated successfully',
      data: updatedPermission
    });
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   DELETE /api/permissions/:id
// @desc    Delete permission
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Check if it's a system permission
    if (permission.isSystemPermission) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system permissions'
      });
    }

    // Check if any roles are using this permission
    const Role = require('../../models/rbac/Role');
    const rolesWithPermission = await Role.countDocuments({ 
      'permissions.module': permission.module,
      'permissions.actions': permission.action
    });
    if (rolesWithPermission > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete permission. ${rolesWithPermission} role(s) are currently using this permission.`
      });
    }

    await Permission.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Permission deleted successfully'
    });
  } catch (error) {
    console.error('Delete permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   GET /api/permissions/modules
// @desc    Get available modules
// @access  Private (Admin only)
router.get('/modules', auth, authorize('admin'), async (req, res) => {
  try {
    const modules = ['adoption', 'petshop', 'rescue', 'veterinary', 'ecommerce', 'pharmacy', 'donation', 'boarding', 'rbac', 'core'];
    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

// @route   GET /api/permissions/actions
// @desc    Get available actions
// @access  Private (Admin only)
router.get('/actions', auth, authorize('admin'), async (req, res) => {
  try {
    const actions = ['create', 'read', 'update', 'delete', 'manage', 'approve', 'assign'];
    res.json({
      success: true,
      data: actions
    });
  } catch (error) {
    console.error('Get actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message || 'Unknown error'
    });
  }
});

module.exports = router;