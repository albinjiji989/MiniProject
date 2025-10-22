const SystemLog = require('../models/SystemLog');
const SystemConfig = require('../models/SystemConfig');
const User = require('../models/User');
const mongoose = require('mongoose');

// @route   GET /api/core/logs
// @desc    Get system logs
// @access  Private (Admin)
const getSystemLogs = async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { 
      level, 
      module, 
      resolved, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;

    const query = {};
    
    if (level) query.level = level;
    if (module) query.module = module;
    if (resolved !== undefined) query.resolved = resolved === 'true';
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await SystemLog.find(query)
      .populate('userId', 'name email role')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SystemLog.countDocuments(query);

    return res.json({
      logs: logs || [],
      totalPages: Math.ceil((total || 0) / (limit || 50)),
      currentPage: page,
      total: total || 0
    });
  } catch (error) {
    console.error(error.message);
    // Backend-level guard: return empty logs array instead of 500 for dashboard use
    return res.json({ logs: [], totalPages: 0, currentPage: 1, total: 0 });
  }
};

// @route   PUT /api/core/logs/:id/resolve
// @desc    Resolve system log
// @access  Private (Admin)
const resolveSystemLog = async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const log = await SystemLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    await log.markResolved(req.user.id, req.body.resolution);

    res.json(log);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/core/config
// @desc    Get system configuration
// @access  Private (Admin)
const getSystemConfig = async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { category } = req.query;
    const query = { isActive: true };
    
    if (category) query.category = category;

    const configs = await SystemConfig.find(query)
      .populate('updatedBy', 'name email')
      .sort({ category: 1, key: 1 });

    res.json(configs);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/core/config
// @desc    Create system configuration
// @access  Private (Admin)
const createSystemConfig = async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const configData = {
      ...req.body,
      updatedBy: req.user.id
    };

    const config = new SystemConfig(configData);
    await config.save();

    res.status(201).json(config);
  } catch (error) {
    console.error(error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Configuration key already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   PUT /api/core/config/:id
// @desc    Update system configuration
// @access  Private (Admin)
const updateSystemConfig = async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const config = await SystemConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'Configuration not found' });
    }

    // Prevent modification of system configs
    if (config.isSystemConfig) {
      return res.status(400).json({ message: 'Cannot modify system configurations' });
    }

    await config.updateValue(req.body.value, req.user.id);

    res.json(config);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/core/stats
// @desc    Get system statistics
// @access  Private (Admin)
const getSystemStats = async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = {
      users: await User.countDocuments(),
      activeUsers: await User.countDocuments({ isActive: true }),
      systemLogs: await SystemLog.countDocuments(),
      unresolvedLogs: await SystemLog.countDocuments({ resolved: false }),
      configs: await SystemConfig.countDocuments({ isActive: true })
    };

    // User role distribution
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Log level distribution
    const logLevels = await SystemLog.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent activity
    const recentLogs = await SystemLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      ...stats,
      userRoles,
      logLevels,
      recentLogs
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/core/health
// @desc    Check system health
// @access  Public
const getSystemHealth = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development'
    };

    // Check database connection
    try {
      await mongoose.connection.db.admin().ping();
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
      health.status = 'unhealthy';
    }

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

module.exports = {
  getSystemLogs,
  resolveSystemLog,
  getSystemConfig,
  createSystemConfig,
  updateSystemConfig,
  getSystemStats,
  getSystemHealth
};