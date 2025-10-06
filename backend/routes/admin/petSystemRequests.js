const express = require('express')
const router = express.Router()
const PetSystemRequest = require('../../core/models/PetSystemRequest')
const PetCategory = require('../../core/models/PetCategory')
const Species = require('../../core/models/Species')
const Breed = require('../../core/models/Breed')
const { auth, authorizeModule } = require('../../middleware/auth')

// @route   POST /api/admin/pet-system-requests
// @desc    Create a new pet system request
// @access  Private (authenticated users)
router.post('/', auth, async (req, res) => {
  try {
    const { type, requestedData, explanation } = req.body

    // Validate request type
    if (!['category', 'species', 'breed'].includes(type)) {
      return res.status(400).json({ message: 'Invalid request type' })
    }

    // Validate requested data based on type
    if (!requestedData || typeof requestedData !== 'object') {
      return res.status(400).json({ message: 'Requested data is required' })
    }

    const request = new PetSystemRequest({
      userId: req.user.id,
      type,
      requestedData,
      explanation: explanation || '',
      status: 'pending',
      submittedAt: new Date()
    })

    await request.save()
    
    res.status(201).json({
      message: 'Request submitted successfully',
      data: request
    })
  } catch (error) {
    console.error('Create pet system request error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/pet-system-requests
// @desc    Get all pet system requests (admin only)
// @access  Private (admin)
router.get('/', auth, authorizeModule('admin'), async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query
    
    const filter = {}
    if (status) filter.status = status
    if (type) filter.type = type

    const requests = await PetSystemRequest.find(filter)
      .populate('userId', 'name email')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await PetSystemRequest.countDocuments(filter)

    res.json({
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get pet system requests error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/pet-system-requests/:id
// @desc    Get a specific pet system request
// @access  Private (admin)
router.get('/:id', auth, authorizeModule('admin'), async (req, res) => {
  try {
    const request = await PetSystemRequest.findById(req.params.id)
      .populate('userId', 'name email')

    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    res.json({ data: request })
  } catch (error) {
    console.error('Get pet system request error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/pet-system-requests/:id/approve
// @desc    Approve a pet system request and create the requested item
// @access  Private (admin)
router.put('/:id/approve', auth, authorizeModule('admin'), async (req, res) => {
  try {
    const request = await PetSystemRequest.findById(req.params.id)
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' })
    }

    let createdItem = null

    // Create the requested item based on type
    if (request.type === 'category') {
      const existingCategory = await PetCategory.findOne({ 
        name: { $regex: new RegExp(`^${request.requestedData.name}$`, 'i') }
      })
      
      if (existingCategory) {
        return res.status(400).json({ message: 'Category already exists' })
      }

      createdItem = new PetCategory({
        name: request.requestedData.name,
        displayName: request.requestedData.displayName || request.requestedData.name,
        description: request.requestedData.description || '',
        isActive: true
      })
      await createdItem.save()

    } else if (request.type === 'species') {
      const existingSpecies = await Species.findOne({ 
        name: { $regex: new RegExp(`^${request.requestedData.name}$`, 'i') }
      })
      
      if (existingSpecies) {
        return res.status(400).json({ message: 'Species already exists' })
      }

      // Find category if specified
      let categoryId = null
      if (request.requestedData.category) {
        const category = await PetCategory.findOne({ 
          name: { $regex: new RegExp(`^${request.requestedData.category}$`, 'i') }
        })
        if (category) categoryId = category._id
      }

      createdItem = new Species({
        name: request.requestedData.name,
        displayName: request.requestedData.displayName || request.requestedData.name,
        category: categoryId,
        description: request.requestedData.description || '',
        isActive: true
      })
      await createdItem.save()

    } else if (request.type === 'breed') {
      const existingBreed = await Breed.findOne({ 
        name: { $regex: new RegExp(`^${request.requestedData.name}$`, 'i') }
      })
      
      if (existingBreed) {
        return res.status(400).json({ message: 'Breed already exists' })
      }

      // Find species if specified
      let speciesId = null
      if (request.requestedData.species) {
        const species = await Species.findOne({ 
          name: { $regex: new RegExp(`^${request.requestedData.species}$`, 'i') }
        })
        if (species) speciesId = species._id
      }

      createdItem = new Breed({
        name: request.requestedData.name,
        displayName: request.requestedData.displayName || request.requestedData.name,
        speciesId: speciesId,
        description: request.requestedData.description || '',
        isActive: true
      })
      await createdItem.save()
    }

    // Update request status
    request.status = 'approved'
    request.approvedAt = new Date()
    request.approvedBy = req.user.id
    request.createdItemId = createdItem._id
    await request.save()

    res.json({
      message: 'Request approved successfully',
      data: request,
      createdItem
    })
  } catch (error) {
    console.error('Approve pet system request error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/pet-system-requests/:id/decline
// @desc    Decline a pet system request
// @access  Private (admin)
router.put('/:id/decline', auth, authorizeModule('admin'), async (req, res) => {
  try {
    const { reason } = req.body
    const request = await PetSystemRequest.findById(req.params.id)
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' })
    }

    request.status = 'declined'
    request.declinedAt = new Date()
    request.declinedBy = req.user.id
    request.declineReason = reason || 'No reason provided'
    await request.save()

    res.json({
      message: 'Request declined successfully',
      data: request
    })
  } catch (error) {
    console.error('Decline pet system request error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/pet-system-requests/stats
// @desc    Get pet system requests statistics
// @access  Private (admin)
router.get('/stats/overview', auth, authorizeModule('admin'), async (req, res) => {
  try {
    const [pending, approved, declined, byType] = await Promise.all([
      PetSystemRequest.countDocuments({ status: 'pending' }),
      PetSystemRequest.countDocuments({ status: 'approved' }),
      PetSystemRequest.countDocuments({ status: 'declined' }),
      PetSystemRequest.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ])

    const typeStats = {}
    byType.forEach(item => {
      typeStats[item._id] = item.count
    })

    res.json({
      data: {
        pending,
        approved,
        declined,
        total: pending + approved + declined,
        byType: typeStats
      }
    })
  } catch (error) {
    console.error('Get pet system requests stats error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
