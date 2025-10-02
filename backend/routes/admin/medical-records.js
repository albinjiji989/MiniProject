const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const MedicalRecord = require('../../core/models/MedicalRecord');
const Pet = require('../../core/models/Pet');

// @route   GET /api/admin/medical-records
// @desc    Get all medical records with filtering and pagination
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      petId = '',
      recordType = '',
      status = '',
      isActive = 'true',
      sortBy = 'recordDate',
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

    if (recordType) {
      filter.recordType = recordType;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'veterinarian.name': { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const records = await MedicalRecord.find(filter)
      .populate('pet', 'name petId species breed')
      .populate('pet.species', 'displayName')
      .populate('pet.breed', 'name')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MedicalRecord.countDocuments(filter);
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
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/medical-records/:id
// @desc    Get medical record by ID
// @access  Private (Admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('pet', 'name petId species breed color age ageUnit')
      .populate('pet.species', 'displayName')
      .populate('pet.breed', 'name')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/medical-records
// @desc    Create new medical record
// @access  Private (Admin only)
router.post('/', [
  auth,
  [
    check('pet', 'Pet is required').isMongoId(),
    check('recordType', 'Record type is required').not().isEmpty(),
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('recordDate', 'Record date is required').isISO8601()
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
      recordType,
      title,
      description,
      recordDate,
      nextDueDate,
      veterinarian,
      cost,
      diagnosis,
      treatment,
      medications = [],
      vaccineName,
      vaccineType,
      batchNumber,
      expiryDate,
      certificateNumber,
      attachments = [],
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

    const recordData = {
      pet,
      recordType,
      title,
      description,
      recordDate: new Date(recordDate),
      nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined,
      veterinarian,
      cost,
      diagnosis,
      treatment,
      medications,
      vaccineName,
      vaccineType,
      batchNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      certificateNumber,
      attachments,
      followUpRequired,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      followUpNotes,
      status,
      notes,
      createdBy: req.user.id
    };

    const record = new MedicalRecord(recordData);
    await record.save();

    // Populate the created record
    await record.populate([
      { path: 'pet', select: 'name petId species breed' },
      { path: 'pet.species', select: 'displayName' },
      { path: 'pet.breed', select: 'name' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      data: record,
      message: 'Medical record created successfully'
    });
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/medical-records/:id
// @desc    Update medical record
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty()
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

    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    const updateData = { ...req.body };
    updateData.lastUpdatedBy = req.user.id;

    // Convert date strings to Date objects
    if (updateData.recordDate) {
      updateData.recordDate = new Date(updateData.recordDate);
    }
    if (updateData.nextDueDate) {
      updateData.nextDueDate = new Date(updateData.nextDueDate);
    }
    if (updateData.expiryDate) {
      updateData.expiryDate = new Date(updateData.expiryDate);
    }
    if (updateData.followUpDate) {
      updateData.followUpDate = new Date(updateData.followUpDate);
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'pet', select: 'name petId species breed' },
      { path: 'pet.species', select: 'displayName' },
      { path: 'pet.breed', select: 'name' },
      { path: 'lastUpdatedBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      data: updatedRecord,
      message: 'Medical record updated successfully'
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/medical-records/:id
// @desc    Delete medical record (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    await record.softDelete();

    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    });
  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/admin/medical-records/:id/restore
// @desc    Restore deleted medical record
// @access  Private (Admin only)
router.patch('/:id/restore', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    await record.restore();

    res.json({
      success: true,
      message: 'Medical record restored successfully'
    });
  } catch (error) {
    console.error('Restore medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/medical-records/pet/:petId
// @desc    Get medical records for a specific pet
// @access  Private (Admin only)
router.get('/pet/:petId', auth, async (req, res) => {
  try {
    const { petId } = req.params;
    const { recordType = '', limit = 50 } = req.query;

    const filter = { pet: petId, isActive: true };
    if (recordType) {
      filter.recordType = recordType;
    }

    const records = await MedicalRecord.find(filter)
      .populate('createdBy', 'name email')
      .sort({ recordDate: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Get pet medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/medical-records/upcoming
// @desc    Get upcoming medical records (due within 7 days)
// @access  Private (Admin only)
router.get('/upcoming', auth, async (req, res) => {
  try {
    const records = await MedicalRecord.findUpcoming()
      .populate('pet', 'name petId species breed')
      .populate('pet.species', 'displayName')
      .populate('pet.breed', 'name');

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Get upcoming medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/medical-records/overdue
// @desc    Get overdue medical records
// @access  Private (Admin only)
router.get('/overdue', auth, async (req, res) => {
  try {
    const records = await MedicalRecord.findOverdue()
      .populate('pet', 'name petId species breed')
      .populate('pet.species', 'displayName')
      .populate('pet.breed', 'name');

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Get overdue medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/medical-records/stats/overview
// @desc    Get medical records statistics overview
// @access  Private (Admin only)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const [
      totalRecords,
      recordsByType,
      upcomingRecords,
      overdueRecords,
      recentRecords
    ] = await Promise.all([
      MedicalRecord.countDocuments({ isActive: true }),
      MedicalRecord.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$recordType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      MedicalRecord.countDocuments({
        nextDueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        isActive: true
      }),
      MedicalRecord.countDocuments({
        nextDueDate: { $lt: new Date() },
        isActive: true
      }),
      MedicalRecord.find({ isActive: true })
        .populate('pet', 'name petId')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      data: {
        total: totalRecords,
        byType: recordsByType,
        upcoming: upcomingRecords,
        overdue: overdueRecords,
        recent: recentRecords
      }
    });
  } catch (error) {
    console.error('Get medical records stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
