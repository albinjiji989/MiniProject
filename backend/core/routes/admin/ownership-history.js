const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const OwnershipHistory = require('../../models/OwnershipHistory');
const Pet = require('../../models/Pet');
const User = require('../../models/User');

// @route   GET /api/admin/ownership-history
// @desc    Get all ownership history records with filtering and pagination
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      petId = '',
      transferType = '',
      status = '',
      isActive = 'true',
      sortBy = 'transferDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (isActive === 'true') {
      filter.isActive = true;
    } else if (isActive === 'false') {
      filter.isActive = false;
    }

    if (petId) {
      filter.pet = petId;
    }

    if (transferType) {
      filter.transferType = transferType;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { reason: { $regex: search, $options: 'i' } },
        { contractNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const records = await OwnershipHistory.find(filter)
      .populate('pet', 'name petId species breed')
      .populate('pet.species', 'displayName')
      .populate('pet.breed', 'name')
      .populate('previousOwner', 'name email phone')
      .populate('newOwner', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await OwnershipHistory.countDocuments(filter);
    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: records,
      pagination: {
        current: parseInt(page),
        pages: pages,
        total: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get ownership history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/ownership-history/:id
// @desc    Get ownership history record by ID
// @access  Private (Admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await OwnershipHistory.findById(req.params.id)
      .populate('pet', 'name petId species breed color age ageUnit')
      .populate('pet.species', 'displayName')
      .populate('pet.breed', 'name')
      .populate('previousOwner', 'name email phone address')
      .populate('newOwner', 'name email phone address')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Ownership history record not found'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Get ownership history record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/ownership-history
// @desc    Create new ownership history record
// @access  Private (Admin only)
router.post('/', [
  auth,
  [
    check('pet', 'Pet is required').isMongoId(),
    check('previousOwner', 'Previous owner is required').isMongoId(),
    check('newOwner', 'New owner is required').isMongoId(),
    check('transferType', 'Transfer type is required').not().isEmpty(),
    check('reason', 'Reason is required').not().isEmpty()
  ]
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

    const {
      pet,
      previousOwner,
      newOwner,
      transferType,
      reason,
      transferDate,
      transferFee,
      contractNumber,
      contractDate,
      contractExpiry,
      documents = [],
      conditions = [],
      specialInstructions,
      followUpRequired = false,
      followUpDate,
      followUpNotes,
      status = 'Completed',
      notes
    } = req.body;

    // Verify pet exists
    const petExists = await Pet.findById(pet);
    if (!petExists) {
      return res.status(400).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Verify previous owner exists
    const prevOwnerExists = await User.findById(previousOwner);
    if (!prevOwnerExists) {
      return res.status(400).json({
        success: false,
        message: 'Previous owner not found'
      });
    }

    // Verify new owner exists
    const newOwnerExists = await User.findById(newOwner);
    if (!newOwnerExists) {
      return res.status(400).json({
        success: false,
        message: 'New owner not found'
      });
    }

    const recordData = {
      pet,
      previousOwner,
      newOwner,
      transferType,
      reason,
      transferDate: transferDate ? new Date(transferDate) : new Date(),
      transferFee,
      contractNumber,
      contractDate: contractDate ? new Date(contractDate) : undefined,
      contractExpiry: contractExpiry ? new Date(contractExpiry) : undefined,
      documents,
      conditions,
      specialInstructions,
      followUpRequired,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      followUpNotes,
      status,
      notes,
      createdBy: req.user.id
    };

    const record = new OwnershipHistory(recordData);
    await record.save();

    // Update pet's current owner
    await Pet.findByIdAndUpdate(pet, { owner: newOwner });

    // Populate the created record
    await record.populate([
      { path: 'pet', select: 'name petId species breed' },
      { path: 'pet.species', select: 'displayName' },
      { path: 'pet.breed', select: 'name' },
      { path: 'previousOwner', select: 'name email phone' },
      { path: 'newOwner', select: 'name email phone' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      data: record,
      message: 'Ownership history record created successfully'
    });
  } catch (error) {
    console.error('Create ownership history record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/ownership-history/:id
// @desc    Update ownership history record
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  [
    check('reason', 'Reason is required').not().isEmpty()
  ]
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

    const record = await OwnershipHistory.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Ownership history record not found'
      });
    }

    const updateData = { ...req.body };
    updateData.lastUpdatedBy = req.user.id;

    // Convert date strings to Date objects
    if (updateData.transferDate) {
      updateData.transferDate = new Date(updateData.transferDate);
    }
    if (updateData.contractDate) {
      updateData.contractDate = new Date(updateData.contractDate);
    }
    if (updateData.contractExpiry) {
      updateData.contractExpiry = new Date(updateData.contractExpiry);
    }
    if (updateData.followUpDate) {
      updateData.followUpDate = new Date(updateData.followUpDate);
    }

    const updatedRecord = await OwnershipHistory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'pet', select: 'name petId species breed' },
      { path: 'pet.species', select: 'displayName' },
      { path: 'pet.breed', select: 'name' },
      { path: 'previousOwner', select: 'name email phone' },
      { path: 'newOwner', select: 'name email phone' },
      { path: 'lastUpdatedBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      data: updatedRecord,
      message: 'Ownership history record updated successfully'
    });
  } catch (error) {
    console.error('Update ownership history record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/ownership-history/:id
// @desc    Delete ownership history record (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await OwnershipHistory.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Ownership history record not found'
      });
    }

    await record.softDelete();

    res.json({
      success: true,
      message: 'Ownership history record deleted successfully'
    });
  } catch (error) {
    console.error('Delete ownership history record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/admin/ownership-history/:id/restore
// @desc    Restore deleted ownership history record
// @access  Private (Admin only)
router.patch('/:id/restore', auth, async (req, res) => {
  try {
    const record = await OwnershipHistory.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Ownership history record not found'
      });
    }

    await record.restore();

    res.json({
      success: true,
      message: 'Ownership history record restored successfully'
    });
  } catch (error) {
    console.error('Restore ownership history record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/ownership-history/pet/:petId
// @desc    Get ownership history for a specific pet
// @access  Private (Admin only)
router.get('/pet/:petId', auth, async (req, res) => {
  try {
    const { petId } = req.params;

    const records = await OwnershipHistory.findByPet(petId);

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Get pet ownership history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/ownership-history/owner/:ownerId
// @desc    Get ownership history for a specific owner
// @access  Private (Admin only)
router.get('/owner/:ownerId', auth, async (req, res) => {
  try {
    const { ownerId } = req.params;

    const records = await OwnershipHistory.findByOwner(ownerId);

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Get owner ownership history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/ownership-history/pending
// @desc    Get pending ownership transfers
// @access  Private (Admin only)
router.get('/pending', auth, async (req, res) => {
  try {
    const records = await OwnershipHistory.findPending();

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Get pending ownership transfers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/ownership-history/stats/overview
// @desc    Get ownership history statistics overview
// @access  Private (Admin only)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const [
      totalTransfers,
      transfersByType,
      pendingTransfers,
      recentTransfers
    ] = await Promise.all([
      OwnershipHistory.countDocuments({ isActive: true }),
      OwnershipHistory.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$transferType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      OwnershipHistory.countDocuments({ status: 'Pending', isActive: true }),
      OwnershipHistory.find({ isActive: true })
        .populate('pet', 'name petId')
        .populate('previousOwner', 'name')
        .populate('newOwner', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      data: {
        total: totalTransfers,
        byType: transfersByType,
        pending: pendingTransfers,
        recent: recentTransfers
      }
    });
  } catch (error) {
    console.error('Get ownership history stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
