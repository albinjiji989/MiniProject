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
    
    console.log('Creating medical record for petId:', petId);
    console.log('Record data:', recordData);
    
    // Verify petId is valid
    if (!petId || typeof petId !== 'string' || petId.length !== 24) {
      return res.status(400).json({ success: false, message: 'Invalid pet ID format' });
    }
    
    // Try to find pet in different models
    let pet = await Pet.findById(petId);
    let petModel = 'Pet';
    
    if (!pet) {
      // Try AdoptionPet
      const mongoose = require('mongoose');
      const AdoptionPet = mongoose.models.AdoptionPet;
      if (AdoptionPet) {
        pet = await AdoptionPet.findById(petId);
        if (pet) petModel = 'AdoptionPet';
      }
    }
    
    if (!pet) {
      // Try PetInventoryItem
      const mongoose = require('mongoose');
      const PetInventoryItem = mongoose.models.PetInventoryItem;
      if (PetInventoryItem) {
        pet = await PetInventoryItem.findById(petId);
        if (pet) petModel = 'PetInventoryItem';
      }
    }
    
    if (!pet) {
      // Try PetNew
      const mongoose = require('mongoose');
      const PetNew = mongoose.models.PetNew;
      if (PetNew) {
        pet = await PetNew.findById(petId);
        if (pet) petModel = 'PetNew';
      }
    }
    
    if (!pet) {
      console.error('Pet not found in any model with ID:', petId);
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }
    
    console.log('Pet found in model:', petModel);
    
    // Get veterinary store ObjectId
    const Veterinary = require('../../models/Veterinary');
    const veterinaryStore = await Veterinary.findOne({ storeId: req.user.storeId });
    
    if (!veterinaryStore) {
      return res.status(404).json({ success: false, message: 'Veterinary store not found' });
    }

    // Map prescriptions to medications (the schema uses medications array)
    const medications = recordData.prescriptions?.map(p => ({
      name: p.medication,
      dosage: p.dosage,
      frequency: p.frequency,
      duration: p.duration,
      notes: p.instructions
    })) || [];
    
    // Map vaccinations to correct field names
    const vaccinations = recordData.vaccinations?.map(v => ({
      name: v.vaccineName,
      batchNumber: v.batchNumber,
      expiryDate: v.expiryDate,
      nextDueDate: v.nextDueDate,
      administeredBy: req.user.name
    })) || [];

    // Create medical record
    const medicalRecord = new VeterinaryMedicalRecord({
      pet: petId,
      owner: pet.owner || pet.currentOwnerId || pet.adopterUserId || pet.createdBy,
      veterinary: veterinaryStore._id, // Use ObjectId not string storeId
      staff: req.user._id,
      storeId: req.user.storeId,
      storeName: req.user.storeName,
      visitDate: recordData.visitDate,
      visitType: recordData.visitType,
      vitalSigns: recordData.vitalSigns,
      chiefComplaint: recordData.chiefComplaint,
      symptoms: recordData.symptoms,
      physicalExamination: recordData.physicalExamination,
      diagnosis: recordData.diagnosis,
      treatment: recordData.treatment,
      recommendations: recordData.recommendations,
      notes: recordData.notes,
      medications: medications,
      vaccinations: vaccinations,
      followUpRequired: recordData.followUpRequired || false,
      followUpDate: recordData.followUpDate,
      followUpNotes: recordData.followUpNotes,
      createdBy: req.user._id
    });

    await medicalRecord.save();
    
    console.log('Medical record saved successfully');

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: { medicalRecord }
    });
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
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
        { path: 'pet', select: 'name species breed age sex' },
        { path: 'owner', select: 'name email phone' },
        { path: 'staff', select: 'name role' },
        { path: 'veterinary', select: 'name storeName address' }
      ]);

    if (!medicalRecord) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    // Check if user has access to this record
    // Compare storeId field (string) not veterinary ObjectId
    if (medicalRecord.storeId !== req.user.storeId) {
      console.log('Access denied:', {
        recordStoreId: medicalRecord.storeId,
        userStoreId: req.user.storeId
      });
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: { medicalRecord }
    });
  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
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
    if (medicalRecord.storeId !== req.user.storeId) {
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
    if (medicalRecord.storeId !== req.user.storeId) {
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