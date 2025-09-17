const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const mongoose = require('mongoose')
const { auth } = require('../../core/middleware/auth')
const SystemLog = require('../../models/core/SystemLog')
const SystemConfig = require('../../models/core/SystemConfig')
const User = require('../../core/models/User')

// @route   GET /api/core/logs
// @desc    Get system logs
// @access  Private (Super Admin, Core Admin)
router.get('/logs', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const { 
      level, 
      module, 
      resolved, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query

    const query = {}
    
    if (level) query.level = level
    if (module) query.module = module
    if (resolved !== undefined) query.resolved = resolved === 'true'
    
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const logs = await SystemLog.find(query)
      .populate('userId', 'name email role')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await SystemLog.countDocuments(query)

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/core/logs/:id/resolve
// @desc    Resolve system log
// @access  Private (Super Admin, Core Admin)
router.put('/logs/:id/resolve', [
  auth,
  body('resolution').notEmpty().withMessage('Resolution is required')
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

    const log = await SystemLog.findById(req.params.id)
    if (!log) {
      return res.status(404).json({ message: 'Log not found' })
    }

    await log.markResolved(req.user.id, req.body.resolution)

    res.json(log)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/core/config
// @desc    Get system configuration
// @access  Private (Super Admin, Core Admin)
router.get('/config', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const { category } = req.query
    const query = { isActive: true }
    
    if (category) query.category = category

    const configs = await SystemConfig.find(query)
      .populate('updatedBy', 'name email')
      .sort({ category: 1, key: 1 })

    res.json(configs)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/core/config
// @desc    Create system configuration
// @access  Private (Super Admin)
router.post('/config', [
  auth,
  body('key').notEmpty().withMessage('Key is required'),
  body('value').notEmpty().withMessage('Value is required'),
  body('type').isIn(['string', 'number', 'boolean', 'object', 'array']).withMessage('Invalid type'),
  body('category').isIn(['general', 'email', 'payment', 'storage', 'security', 'notification', 'api']).withMessage('Invalid category'),
  body('description').notEmpty().withMessage('Description is required')
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

    const configData = {
      ...req.body,
      updatedBy: req.user.id
    }

    const config = new SystemConfig(configData)
    await config.save()

    res.status(201).json(config)
  } catch (error) {
    console.error(error.message)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Configuration key already exists' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/core/config/:id
// @desc    Update system configuration
// @access  Private (Super Admin)
router.put('/config/:id', [
  auth,
  body('value').notEmpty().withMessage('Value is required')
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

    const config = await SystemConfig.findById(req.params.id)
    if (!config) {
      return res.status(404).json({ message: 'Configuration not found' })
    }

    // Prevent modification of system configs
    if (config.isSystemConfig) {
      return res.status(400).json({ message: 'Cannot modify system configurations' })
    }

    await config.updateValue(req.body.value, req.user.id)

    res.json(config)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/core/stats
// @desc    Get system statistics
// @access  Private (Super Admin, Core Admin)
router.get('/stats', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const stats = {
      users: await User.countDocuments(),
      activeUsers: await User.countDocuments({ isActive: true }),
      systemLogs: await SystemLog.countDocuments(),
      unresolvedLogs: await SystemLog.countDocuments({ resolved: false }),
      configs: await SystemConfig.countDocuments({ isActive: true })
    }

    // User role distribution
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])

    // Log level distribution
    const logLevels = await SystemLog.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])

    // Recent activity
    const recentLogs = await SystemLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({
      ...stats,
      userRoles,
      logLevels,
      recentLogs
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/core/health
// @desc    Check system health
// @access  Public
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development'
    }

    // Check database connection
    try {
      await mongoose.connection.db.admin().ping()
      health.database = 'connected'
    } catch (error) {
      health.database = 'disconnected'
      health.status = 'unhealthy'
    }

    res.json(health)
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

module.exports = router
