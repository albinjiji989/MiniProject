const express = require('express')
const router = express.Router()
const Module = require('../core/models/Module')
const fs = require('fs')
const path = require('path')

function getFilesystemModules() {
  try {
    const modulesDir = path.join(__dirname, '..', 'modules')
    const dirents = fs.readdirSync(modulesDir, { withFileTypes: true })
    const knownIconByKey = {
      adoption: 'Pets',
      petshop: 'Store',
      rescue: 'Support',
      ecommerce: 'ShoppingCart',
      pharmacy: 'LocalPharmacy',
      'temporary-care': 'Build',
      veterinary: 'LocalHospital',
    }
    const colorByKey = {
      adoption: '#10b981',
      petshop: '#3b82f6',
      rescue: '#f59e0b',
      ecommerce: '#8b5cf6',
      pharmacy: '#ef4444',
      'temporary-care': '#06b6d4',
      veterinary: '#64748b',
    }
    const toDisplayName = (key) => {
      if (key === 'ecommerce') return 'E-commerce'
      if (key === 'temporary-care') return 'Temporary Care'
      return key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
    const items = dirents
      .filter((d) => d.isDirectory())
      .map((d, idx) => {
        const key = d.name
        return {
          _id: key, // virtual id for frontend rendering only
          key,
          name: toDisplayName(key),
          description: '',
          icon: knownIconByKey[key] || 'Business',
          color: colorByKey[key] || '#64748b',
          status: 'coming_soon',
          hasManagerDashboard: true,
          isCoreModule: true,
          maintenanceMessage: null,
          blockReason: null,
          displayOrder: idx,
        }
      })
    return items
  } catch (e) {
    return []
  }
}

async function ensureModulesSeeded() {
  const fsModules = getFilesystemModules()
  if (!fsModules || fsModules.length === 0) return
  const ops = fsModules.map((m) => ({
    updateOne: {
      filter: { key: m.key },
      update: {
        $setOnInsert: {
          key: m.key,
          name: m.name,
          description: m.description,
          icon: m.icon,
          color: m.color,
          status: m.status,
          hasManagerDashboard: m.hasManagerDashboard,
          isCoreModule: true,
          maintenanceMessage: null,
          blockReason: null,
          displayOrder: m.displayOrder,
        },
      },
      upsert: true,
    },
  }))
  if (ops.length > 0) {
    try {
      await Module.bulkWrite(ops)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Module seeding skipped/failed:', e.message)
    }
  }
}
const { auth, authorize } = require('../middleware/auth')

// Get all modules (public endpoint for user dashboard)
router.get('/', async (req, res) => {
  try {
    let modules = await Module.find()
      .select('key name description icon color status hasManagerDashboard maintenanceMessage blockReason displayOrder')
      .sort({ displayOrder: 1, name: 1 })
    if (!modules || modules.length === 0) {
      modules = getFilesystemModules()
    }
    res.json({ success: true, data: modules })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch modules', error: error.message })
  }
})

// Get modules for admin management
router.get('/admin', auth, authorize('admin'), async (req, res) => {
  try {
    // Remove legacy 'shelter' entries if present
    try { await Module.deleteMany({ key: 'shelter' }) } catch (e) {}

    // Ensure DB has filesystem modules (petshop, etc.)
    await ensureModulesSeeded()

    let modules = await Module.find()
      .sort({ displayOrder: 1, name: 1 })
    if (!modules || modules.length === 0) {
      modules = getFilesystemModules()
    }
    res.json({ success: true, data: modules })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch modules', error: error.message })
  }
})

// Create new module - disabled per requirements
router.post('/', auth, authorize('admin'), async (req, res) => {
  return res.status(403).json({ success: false, message: 'Creating new modules is disabled. Admin can only manage existing modules.' })
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

// Delete module - disabled per requirements
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  return res.status(403).json({ success: false, message: 'Deleting modules is disabled. Admin can only update existing modules.' })
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