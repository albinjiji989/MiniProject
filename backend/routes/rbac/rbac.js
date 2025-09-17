const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const { auth } = require('../../core/middleware/auth')
const Role = require('../../models/rbac/Role')
const Permission = require('../../models/rbac/Permission')
const User = require('../../core/models/User')
const UserDetails = require('../../models/UserDetails')

// @route   GET /api/rbac/roles
// @desc    Get all roles
// @access  Private (Super Admin, RBAC Admin)
router.get('/roles', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const roles = await Role.find({ isActive: true })
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email role')
      .sort({ level: 1 })

    res.json(roles)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/rbac/roles
// @desc    Create new role
// @access  Private (Super Admin)
router.post('/roles', [
  auth,
  body('name').notEmpty().withMessage('Role name is required'),
  body('displayName').notEmpty().withMessage('Display name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('level').isInt({ min: 1, max: 10 }).withMessage('Level must be between 1 and 10'),
  body('permissions').isArray().withMessage('Permissions must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const roleData = {
      ...req.body,
      createdBy: req.user.id
    }

    const role = new Role(roleData)
    await role.save()

    res.status(201).json(role)
  } catch (error) {
    console.error(error.message)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Role name already exists' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/rbac/roles/:id
// @desc    Update role
// @access  Private (Super Admin)
router.put('/roles/:id', [
  auth,
  body('displayName').optional().notEmpty().withMessage('Display name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('level').optional().isInt({ min: 1, max: 10 }).withMessage('Level must be between 1 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const role = await Role.findById(req.params.id)
    if (!role) {
      return res.status(404).json({ message: 'Role not found' })
    }

    // Prevent modification of system roles
    if (role.isSystemRole) {
      return res.status(400).json({ message: 'Cannot modify system roles' })
    }

    Object.assign(role, req.body)
    await role.save()

    res.json(role)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/rbac/roles/:id
// @desc    Delete role
// @access  Private (Super Admin)
router.delete('/roles/:id', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const role = await Role.findById(req.params.id)
    if (!role) {
      return res.status(404).json({ message: 'Role not found' })
    }

    // Prevent deletion of system roles
    if (role.isSystemRole) {
      return res.status(400).json({ message: 'Cannot delete system roles' })
    }

    // Check if role is assigned to any users
    if (role.assignedUsers.length > 0) {
      return res.status(400).json({ message: 'Cannot delete role that is assigned to users' })
    }

    role.isActive = false
    await role.save()

    res.json({ message: 'Role deactivated successfully' })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/rbac/roles/:id/permissions
// @desc    Add permissions to role
// @access  Private (Super Admin)
router.post('/roles/:id/permissions', [
  auth,
  body('module').isIn(['adoption', 'shelter', 'rescue', 'veterinary', 'ecommerce', 'pharmacy', 'donation', 'boarding', 'rbac', 'core']).withMessage('Invalid module'),
  body('actions').isArray().withMessage('Actions must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const role = await Role.findById(req.params.id)
    if (!role) {
      return res.status(404).json({ message: 'Role not found' })
    }

    const { module, actions } = req.body
    await role.addPermission(module, actions)

    res.json(role)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/rbac/roles/:id/permissions
// @desc    Remove permissions from role
// @access  Private (Super Admin)
router.delete('/roles/:id/permissions', [
  auth,
  body('module').isIn(['adoption', 'shelter', 'rescue', 'veterinary', 'ecommerce', 'pharmacy', 'donation', 'boarding', 'rbac', 'core']).withMessage('Invalid module'),
  body('actions').isArray().withMessage('Actions must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const role = await Role.findById(req.params.id)
    if (!role) {
      return res.status(404).json({ message: 'Role not found' })
    }

    const { module, actions } = req.body
    await role.removePermission(module, actions)

    res.json(role)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/rbac/users
// @desc    Get all users with their roles
// @access  Private (Super Admin)
router.get('/users', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })

    // Get user details for each user
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const userDetails = await UserDetails.findOne({ userId: user._id });
        return {
          ...user.toObject(),
          role: user.role,
          assignedModule: userDetails ? userDetails.assignedModule : null,
          storeId: userDetails ? userDetails.storeId : null,
          storeName: userDetails ? userDetails.storeName : null,
          storeLocation: userDetails ? userDetails.storeLocation : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithDetails
      }
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/rbac/users/:id/role
// @desc    Assign role to user
// @access  Private (Super Admin)
router.put('/users/:id/role', [
  auth,
  body('role').notEmpty().withMessage('Role is required'),
  body('assignedModule').optional().isIn(['adoption', 'shelter', 'rescue', 'veterinary', 'ecommerce', 'pharmacy', 'donation', 'boarding']).withMessage('Invalid module'),
  body('supervisor').optional().isMongoId().withMessage('Invalid supervisor ID')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const { role, assignedModule, supervisor } = req.body

    // Validate role exists
    const roleExists = await Role.findOne({ name: role, isActive: true })
    if (!roleExists) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    // Update user role
    user.role = role
    if (assignedModule) user.assignedModule = assignedModule
    if (supervisor) user.supervisor = supervisor

    await user.save()

    // Update role's assigned users
    await Role.updateOne(
      { name: role },
      { $addToSet: { assignedUsers: user._id } }
    )

    res.json(user)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/rbac/permissions
// @desc    Get all permissions
// @access  Private (Super Admin)
router.get('/permissions', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const permissions = await Permission.find({ isActive: true })
      .sort({ module: 1, action: 1 })

    res.json(permissions)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/rbac/permissions
// @desc    Create new permission
// @access  Private (Super Admin)
router.post('/permissions', [
  auth,
  body('name').notEmpty().withMessage('Permission name is required'),
  body('displayName').notEmpty().withMessage('Display name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('module').isIn(['adoption', 'shelter', 'rescue', 'veterinary', 'ecommerce', 'pharmacy', 'donation', 'boarding', 'rbac', 'core']).withMessage('Invalid module'),
  body('action').isIn(['create', 'read', 'update', 'delete', 'manage', 'approve', 'assign']).withMessage('Invalid action'),
  body('resource').notEmpty().withMessage('Resource is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const permission = new Permission(req.body)
    await permission.save()

    res.status(201).json(permission)
  } catch (error) {
    console.error(error.message)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Permission name already exists' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/rbac/check-permission
// @desc    Check if user has specific permission
// @access  Private
router.get('/check-permission', auth, async (req, res) => {
  try {
    const { module, action, resource } = req.query

    if (!module || !action) {
      return res.status(400).json({ message: 'Module and action are required' })
    }

    // Get user's role
    const role = await Role.findOne({ name: req.user.role, isActive: true })
    if (!role) {
      return res.status(403).json({ hasPermission: false })
    }

    const hasPermission = role.hasPermission(module, action)
    res.json({ hasPermission })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// Helpers
const allowedModules = ['adoption', 'shelter', 'rescue', 'veterinary', 'ecommerce', 'pharmacy', 'donation', 'boarding', 'temporary-care']
const allowedModuleNames = ['Adoption', 'Shelter', 'Rescue', 'Veterinary', 'E-commerce', 'Pharmacy', 'Donation', 'Boarding', 'Temporary Care']
const moduleAdminRole = (module) => `${module}_admin`
const moduleWorkerRole = (module) => `${module}_worker`

// Helper function to convert module name to key
const moduleNameToKey = (moduleName) => {
  const mapping = {
    'Adoption': 'adoption',
    'Shelter': 'shelter', 
    'Rescue': 'rescue',
    'Veterinary': 'veterinary',
    'E-commerce': 'ecommerce',
    'Pharmacy': 'pharmacy',
    'Donation': 'donation',
    'Boarding': 'boarding',
    'Temporary Care': 'temporary-care'
  }
  return mapping[moduleName] || moduleName.toLowerCase()
}

// @route   POST /api/rbac/users/module-admin
// @desc    Super Admin creates or assigns a Module Admin
// @access  Private (Super Admin)
router.post('/users/module-admin', [
  auth,
  body('module').isIn(allowedModules).withMessage('Invalid module'),
  body('userId').optional().isMongoId(),
  body('name').optional().isString().notEmpty(),
  body('email').optional().isEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('unitId').optional().isString(),
  body('unitName').optional().isString(),
  body('unitLocation').optional().isObject()
], async (req, res) => {
  try {
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { module, userId, name, email, password, unitId, unitName, unitLocation } = req.body

    let user
    if (userId) {
      user = await User.findById(userId)
      if (!user) return res.status(404).json({ message: 'User not found' })
    } else {
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'name, email, password required when userId not provided' })
      }
      const existing = await User.findOne({ email })
      if (existing) return res.status(400).json({ message: 'Email already in use' })
      const hashed = await bcrypt.hash(password, 10)
      user = new User({ name, email, password: hashed, role: 'public_user' })
    }

    const roleName = moduleAdminRole(module)
    const role = await Role.findOne({ name: roleName, isActive: true })
    if (!role) return res.status(400).json({ message: 'Module admin role not configured' })

    user.role = roleName
    user.assignedModule = module
    if (unitId) user.unitId = unitId
    if (unitName) user.unitName = unitName
    if (unitLocation) user.unitLocation = unitLocation
    await user.save()

    await Role.updateOne({ name: roleName }, { $addToSet: { assignedUsers: user._id } })

    res.status(200).json({ message: 'Module admin assigned', user })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/rbac/users/module-staff
// @desc    Module Admin (or Super Admin) creates or assigns a module worker/staff
// @access  Private (Module Admin of module or Super Admin)
router.post('/users/module-staff', [
  auth,
  body('module').isIn(allowedModules).withMessage('Invalid module'),
  body('userId').optional().isMongoId(),
  body('name').optional().isString().notEmpty(),
  body('email').optional().isEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('unitId').optional().isString(),
  body('unitName').optional().isString(),
  body('unitLocation').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { module, userId, name, email, password, unitId, unitName, unitLocation } = req.body

    // Authorization: super_admin or module admin of the same module
    const isSuper = req.user.role === 'super_admin'
    const isModuleAdmin = req.user.role === moduleAdminRole(module)
    if (!isSuper && !isModuleAdmin) {
      return res.status(403).json({ message: 'Access denied' })
    }

    let user
    if (userId) {
      user = await User.findById(userId)
      if (!user) return res.status(404).json({ message: 'User not found' })
    } else {
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'name, email, password required when userId not provided' })
      }
      const existing = await User.findOne({ email })
      if (existing) return res.status(400).json({ message: 'Email already in use' })
      const hashed = await bcrypt.hash(password, 10)
      user = new User({ name, email, password: hashed, role: 'public_user' })
    }

    const roleName = moduleWorkerRole(module)
    const role = await Role.findOne({ name: roleName, isActive: true })
    if (!role) return res.status(400).json({ message: 'Module worker role not configured' })

    user.role = roleName
    user.assignedModule = module
    // set supervisor if created by module admin
    if (!isSuper) {
      user.supervisor = req.user.id
    }
    if (unitId) user.unitId = unitId
    if (unitName) user.unitName = unitName
    if (unitLocation) user.unitLocation = unitLocation
    await user.save()

    await Role.updateOne({ name: roleName }, { $addToSet: { assignedUsers: user._id } })

    res.status(200).json({ message: 'Module staff assigned', user })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/rbac/create-module-admin
// @desc    Super Admin creates a new module admin (simplified endpoint for dashboard)
// @access  Private (Super Admin)
router.post('/create-module-admin', [
  auth,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('assignedModule').custom((value) => {
    if (!allowedModules.includes(value) && !allowedModuleNames.includes(value)) {
      throw new Error('Invalid module')
    }
    return true
  }),
  body('unitId').optional().isString(),
  body('unitName').optional().isString(),
  body('unitLocation').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const { name, email, password, phone, assignedModule, unitId, unitName, unitLocation } = req.body

    // Convert module name to key if needed
    const moduleKey = moduleNameToKey(assignedModule)

    // Check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    // Create new user (password will be hashed by pre-save hook)
    const newUser = new User({
      name,
      email,
      password, // Let the pre-save hook handle hashing
      phone: phone || '000-000-0000', // Default phone if not provided
      role: `${moduleKey}_admin`,
      assignedModule: moduleKey,
      unitId: unitId || '',
      unitName: unitName || '',
      unitLocation: unitLocation || '',
      isActive: true
    })

    await newUser.save()

    // Update role's assigned users
    const roleName = `${moduleKey}_admin`
    await Role.updateOne(
      { name: roleName },
      { $addToSet: { assignedUsers: newUser._id } }
    )

    res.status(201).json({
      message: 'Module admin created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        assignedModule: newUser.assignedModule,
        unitId: newUser.unitId,
        unitName: newUser.unitName,
        unitLocation: newUser.unitLocation
      }
    })
  } catch (error) {
    console.error('Error creating module admin:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
