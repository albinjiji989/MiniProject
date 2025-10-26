const { validationResult } = require('express-validator');
const VeterinaryMedicalRecord = require('../../models/VeterinaryMedicalRecord');
const Pet = require('../../../../core/models/Pet');

const createMedicalRecord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { petId, ...recordData } = req.body;
    
    // Verify pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Create medical record
    const medicalRecord = new VeterinaryMedicalRecord({
      ...recordData,
      pet: petId,
      owner: pet.owner,
      veterinary: req.user.storeId,
      staff: req.user._id,
      storeId: req.user.storeId,
      storeName: req.user.storeName,
      createdBy: req.user._id
    });

    await medicalRecord.save();
    
    // Populate references
    await medicalRecord.populate([
      { path: 'pet', select: 'name species breed' },
      { path: 'owner', select: 'name email' },
      { path: 'veterinary', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: { medicalRecord }
    });
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMedicalRecordsByPet = async (req, res) => {
  try {
    const { petId } = req.params;
    
    // Verify pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    const medicalRecords = await VeterinaryMedicalRecord.find({ 
      pet: petId, 
      veterinary: req.user.storeId,
      isActive: true 
    })
    .populate([
      { path: 'pet', select: 'name species breed' },
      { path: 'owner', select: 'name email' },
      { path: 'staff', select: 'name role' }
    ])
    .sort({ visitDate: -1 });

    res.json({
      success: true,
      data: { medicalRecords }
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    const medicalRecord = await VeterinaryMedicalRecord.findById(id)
      .populate([
        { path: 'pet', select: 'name species breed' },
        { path: 'owner', select: 'name email' },
        { path: 'staff', select: 'name role' },
        { path: 'veterinary', select: 'name address' }
      ]);

    if (!medicalRecord) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    // Check if user has access to this record
    if (medicalRecord.veterinary.toString() !== req.user.storeId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: { medicalRecord }
    });
  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateMedicalRecord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    const medicalRecord = await VeterinaryMedicalRecord.findById(id);
    if (!medicalRecord) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    // Check if user has access to this record
    if (medicalRecord.veterinary.toString() !== req.user.storeId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Update record
    Object.assign(medicalRecord, updateData, {
      lastUpdatedBy: req.user._id
    });

    await medicalRecord.save();

    // Populate references
    await medicalRecord.populate([
      { path: 'pet', select: 'name species breed' },
      { path: 'owner', select: 'name email' },
      { path: 'staff', select: 'name role' }
    ]);

    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: { medicalRecord }
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const medicalRecord = await VeterinaryMedicalRecord.findById(id);
    if (!medicalRecord) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    // Check if user has access to this record
    if (medicalRecord.veterinary.toString() !== req.user.storeId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Soft delete
    medicalRecord.isActive = false;
    await medicalRecord.save();

    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    });
  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createMedicalRecord,
  getMedicalRecordsByPet,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord
};