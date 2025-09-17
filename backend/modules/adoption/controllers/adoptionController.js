const { validationResult } = require('express-validator');
const Adoption = require('../models/Adoption');
const Pet = require('../../../core/models/Pet');
const { getStoreFilter } = require('../../../utils/storeFilter');

// GET /api/adoption
const listAdoptions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { ...getStoreFilter(req.user) };
    if (status) filter.status = status;

    const adoptions = await Adoption.find(filter)
      .populate('pet', 'name species breed age gender images')
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Adoption.countDocuments(filter);

    res.json({
      success: true,
      data: {
        adoptions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get adoptions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/adoption/:id
const getAdoptionById = async (req, res) => {
  try {
    const adoption = await Adoption.findOne({ _id: req.params.id, ...getStoreFilter(req.user) })
      .populate('pet', 'name species breed age gender images medicalHistory vaccinationRecords')
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!adoption) {
      return res.status(404).json({ success: false, message: 'Adoption application not found' });
    }

    res.json({ success: true, data: { adoption } });
  } catch (error) {
    console.error('Get adoption error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/adoption
const createAdoption = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { pet, adopter, adoptionFee } = req.body;

    const petDoc = await Pet.findById(pet);
    if (!petDoc) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    if (petDoc.currentStatus !== 'available_for_adoption') {
      return res.status(400).json({ success: false, message: 'Pet is not available for adoption' });
    }

    const adoptionData = {
      pet,
      adopter,
      adoptionFee: adoptionFee || petDoc.adoptionFee,
      processedBy: req.user._id,
      storeId: req.user.storeId,
      storeName: req.user.storeName
    };

    const adoption = new Adoption(adoptionData);
    await adoption.save();
    await adoption.populate('pet', 'name species breed age gender images');

    res.status(201).json({ success: true, message: 'Adoption application created successfully', data: { adoption } });
  } catch (error) {
    console.error('Create adoption error:', error);
    res.status(500).json({ success: false, message: 'Server error during adoption creation' });
  }
};

// PUT /api/adoption/:id/status
const updateAdoptionStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { status, reviewNotes, homeVisitDate, homeVisitNotes } = req.body;
    const adoption = await Adoption.findById(req.params.id);

    if (!adoption) {
      return res.status(404).json({ success: false, message: 'Adoption application not found' });
    }

    const updateData = { status };
    if (reviewNotes) updateData.reviewNotes = reviewNotes;
    if (homeVisitDate) updateData.homeVisitDate = homeVisitDate;
    if (homeVisitNotes) updateData.homeVisitNotes = homeVisitNotes;
    if (status === 'approved') updateData.approvedBy = req.user._id;

    const updatedAdoption = await Adoption.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('pet', 'name species breed age gender images');

    if (status === 'approved') {
      await Pet.findByIdAndUpdate(adoption.pet, { currentStatus: 'adopted', lastUpdatedBy: req.user._id });
    }

    res.json({ success: true, message: 'Adoption status updated successfully', data: { adoption: updatedAdoption } });
  } catch (error) {
    console.error('Update adoption status error:', error);
    res.status(500).json({ success: false, message: 'Server error during status update' });
  }
};

module.exports = {
  listAdoptions,
  getAdoptionById,
  createAdoption,
  updateAdoptionStatus,
};


