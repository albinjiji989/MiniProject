const express = require('express')
const router = express.Router()
const Module = require('../core/models/Module')
const { auth, authorize } = require('../middleware/auth')

// Get all modules (public endpoint for user dashboard)
router.get('/', async (req, res) => {
  try {
    const modules = await Module.find()
      .select('key name description icon color status hasManagerDashboard maintenanceMessage blockReason displayOrder')
      .sort({ displayOrder: 1, name: 1 })
    res.json({ success: true, data: modules })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch modules', error: error.message })
  }
})

// Get modules for admin management
router.get('/admin', auth, authorize('admin'), async (req, res) => {
  try {
    const modules = await Module.find()
      .sort({ displayOrder: 1, name: 1 })
    res.json({ success: true, data: modules })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch modules', error: error.message })
  }
})

// Create new module
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    let { key, name, description, icon, color, status, hasManagerDashboard, maintenanceMessage, blockReason, displayOrder } = req.body
    if (!key || !name) {
      return res.status(400).json({ success: false, message: 'key and name are required' })
    }
    key = String(key).trim().toLowerCase().replace(/\s+/g, '-')
    
    // Check if module already exists
    const existingModule = await Module.findOne({ key })
    if (existingModule) {
      return res.status(400).json({ success: false, message: 'Module with this key already exists' })
    }

    const moduleData = {
      key,
      name,
      description,
      icon: icon || 'Business',
      color: color || '#64748b',
      status: status || 'coming_soon',
      hasManagerDashboard: hasManagerDashboard || false,
      maintenanceMessage,
      blockReason,
      displayOrder: displayOrder || 0
    }

    const module = new Module(moduleData)
    await module.save()

    res.status(201).json({ success: true, data: module })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      res.status(400).json({ success: false, message: 'Validation error', errors })
    } else {
      res.status(500).json({ success: false, message: 'Failed to create module', error: error.message })
    }
  }
})

// Update module
router.patch('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { Types } = require('mongoose')
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid module id' })
    }
    const { status, maintenanceMessage, blockReason, ...updateData } = req.body
    
    // Validate status-specific fields
    if (status === 'maintenance' && !maintenanceMessage) {
      return res.status(400).json({ success: false, message: 'Maintenance message is required for maintenance status' })
    }
    
    if (status === 'blocked' && !blockReason) {
      return res.status(400).json({ success: false, message: 'Block reason is required for blocked status' })
    }

    const module = await Module.findByIdAndUpdate(
      req.params.id,
      { ...updateData, status, maintenanceMessage, blockReason },
      { new: true, runValidators: true }
    )
    
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' })
    }

    res.json({ success: true, data: module })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      res.status(400).json({ success: false, message: 'Validation error', errors })
    } else {
      res.status(500).json({ success: false, message: 'Failed to update module', error: error.message })
    }
  }
})

// Update module status
router.patch('/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { Types } = require('mongoose')
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid module id' })
    }
    const { status, message } = req.body
    
    if (!['active', 'blocked', 'maintenance', 'coming_soon'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }

    const updateData = { status }
    
    if (status === 'maintenance') {
      updateData.maintenanceMessage = message
      updateData.blockReason = null
    } else if (status === 'blocked') {
      updateData.blockReason = message
      updateData.maintenanceMessage = null
    } else {
      updateData.maintenanceMessage = null
      updateData.blockReason = null
    }

    const module = await Module.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' })
    }

    res.json({ success: true, data: module })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update module status', error: error.message })
  }
})

// Delete module
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { Types } = require('mongoose')
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid module id' })
    }
    const module = await Module.findById(req.params.id)
    
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' })
    }

    if (module.isCoreModule) {
      return res.status(400).json({ success: false, message: 'Cannot delete core modules' })
    }

    await Module.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Module deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete module', error: error.message })
  }
})

// Reorder modules
router.patch('/reorder', auth, authorize('admin'), async (req, res) => {
  try {
    const { modules } = req.body // Array of { id, displayOrder }
    if (!Array.isArray(modules)) {
      return res.status(400).json({ success: false, message: 'modules must be an array' })
    }
    
    const updatePromises = modules.map(({ id, displayOrder }) => {
      const { Types } = require('mongoose')
      if (!Types.ObjectId.isValid(id)) return null
      return Module.findByIdAndUpdate(id, { displayOrder }, { new: true })
    }).filter(Boolean)
    
    await Promise.all(updatePromises)
    res.json({ success: true, message: 'Modules reordered successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reorder modules', error: error.message })
  }
})

module.exports = router