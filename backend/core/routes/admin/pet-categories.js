const express = require('express')
const router = express.Router()
const PetCategory = require('../../models/PetCategory')
const { auth, authorize } = require('../../middleware/auth')

// List categories
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', isActive } = req.query
    const query = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ]
    }
    if (isActive !== undefined) query.isActive = isActive === 'true'
    const cats = await PetCategory.find(query)
      .sort({ displayName: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
    const total = await PetCategory.countDocuments(query)
    res.json({ success: true, data: cats, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching categories', error: e.message })
  }
})

// Active categories for dropdowns
router.get('/active', auth, async (req, res) => {
  try {
    const cats = await PetCategory.find({ isActive: true }).sort({ displayName: 1 })
    res.json({ success: true, data: cats })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching categories', error: e.message })
  }
})

// Create
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, displayName, description } = req.body
    if (!name || !displayName) return res.status(400).json({ success: false, message: 'name and displayName are required' })
    const existing = await PetCategory.findByName(name)
    if (existing) return res.status(400).json({ success: false, message: 'Category with this name already exists' })
    const cat = new PetCategory({ name, displayName, description, createdBy: req.user.id })
    await cat.save()
    res.status(201).json({ success: true, message: 'Category created', data: cat })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error creating category', error: e.message })
  }
})

// Update
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, displayName, description, isActive } = req.body
    const cat = await PetCategory.findById(req.params.id)
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' })
    if (name && name !== cat.name) {
      const conflict = await PetCategory.findByName(name)
      if (conflict && conflict._id.toString() !== cat._id.toString()) return res.status(400).json({ success: false, message: 'Category name already exists' })
      cat.name = name
    }
    if (displayName) cat.displayName = displayName
    if (description !== undefined) cat.description = description
    if (isActive !== undefined) cat.isActive = isActive
    cat.lastUpdatedBy = req.user.id
    await cat.save()
    res.json({ success: true, message: 'Category updated', data: cat })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error updating category', error: e.message })
  }
})

// Delete (soft by flag)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const cat = await PetCategory.findById(req.params.id)
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' })
    cat.isActive = false
    cat.lastUpdatedBy = req.user.id
    await cat.save()
    res.json({ success: true, message: 'Category disabled' })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error deleting category', error: e.message })
  }
})

// Restore category
router.patch('/:id/restore', auth, authorize('admin'), async (req, res) => {
  try {
    const cat = await PetCategory.findById(req.params.id)
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' })
    cat.isActive = true
    cat.lastUpdatedBy = req.user.id
    await cat.save()
    res.json({ success: true, message: 'Category restored successfully', data: cat })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error restoring category', error: e.message })
  }
})

module.exports = router


