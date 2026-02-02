const { validationResult } = require('express-validator');
const VeterinaryAppointment = require('../../models/VeterinaryAppointment');
const VeterinaryMedicalRecord = require('../../models/VeterinaryMedicalRecord');
const Pet = require('../../../../core/models/Pet');
const User = require('../../../../core/models/User');
const Veterinary = require('../../models/Veterinary');
const mongoose = require('mongoose');

// Get pending applications (appointments waiting for approval)
const getPendingApplications = async (req, res) => {
  try {
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required. Please complete store setup first.'
      });
    }

    // Find the veterinary store
    const veterinaryStore = await Veterinary.findOne({ storeId });
    if (!veterinaryStore) {
      return res.status(404).json({
        success: false,
        message: 'Veterinary store not found'
      });
    }

    const { page = 1, limit = 20, bookingType } = req.query;
    const filter = {
      storeId: veterinaryStore._id,
      status: 'pending_approval'
    };

    if (bookingType) {
      filter.bookingType = bookingType;
    }

    const applications = await VeterinaryAppointment.find(filter)
      .populate({
        path: 'petId',
        select: 'name species breed age gender weight imageIds medicalHistory',
        populate: { path: 'images', select: 'url caption isPrimary' }
      })
      .populate('ownerId', 'name email phone')
      .populate('serviceId', 'name price duration')
      .sort({ bookingType: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await VeterinaryAppointment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get pending applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching applications',
      error: error.message
    });
  }
};

// Accept application (approve appointment)
const acceptApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, timeSlot, notes } = req.body;
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Find the veterinary store
    const veterinaryStore = await Veterinary.findOne({ storeId });
    if (!veterinaryStore) {
      return res.status(404).json({
        success: false,
        message: 'Veterinary store not found'
      });
    }

    const appointment = await VeterinaryAppointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify appointment belongs to this store
    if (appointment.storeId.toString() !== veterinaryStore._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Application does not belong to your clinic'
      });
    }

    if (appointment.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Only pending applications can be accepted'
      });
    }

    // Update appointment
    appointment.status = 'confirmed';
    if (appointmentDate) appointment.appointmentDate = appointmentDate;
    if (timeSlot) appointment.timeSlot = timeSlot;
    if (notes) appointment.notes = notes;
    appointment.updatedBy = req.user._id;

    await appointment.save();

    // Populate for response
    await appointment.populate([
      {
        path: 'petId',
        select: 'name species breed age gender',
        populate: { path: 'images', select: 'url caption isPrimary' }
      },
      { path: 'ownerId', select: 'name email phone' },
      { path: 'serviceId', select: 'name price duration' }
    ]);

    res.json({
      success: true,
      message: 'Application accepted successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Accept application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting application',
      error: error.message
    });
  }
};

// Reject application
const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Find the veterinary store
    const veterinaryStore = await Veterinary.findOne({ storeId });
    if (!veterinaryStore) {
      return res.status(404).json({
        success: false,
        message: 'Veterinary store not found'
      });
    }

    const appointment = await VeterinaryAppointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify appointment belongs to this store
    if (appointment.storeId.toString() !== veterinaryStore._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Application does not belong to your clinic'
      });
    }

    if (appointment.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Only pending applications can be rejected'
      });
    }

    // Update appointment
    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    appointment.notes = reason || 'Application rejected by clinic';
    appointment.updatedBy = req.user._id;

    await appointment.save();

    res.json({
      success: true,
      message: 'Application rejected successfully'
    });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting application',
      error: error.message
    });
  }
};

// Start consultation (mark appointment as in_progress)
const startConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Find the veterinary store
    const veterinaryStore = await Veterinary.findOne({ storeId });
    if (!veterinaryStore) {
      return res.status(404).json({
        success: false,
        message: 'Veterinary store not found'
      });
    }

    const appointment = await VeterinaryAppointment.findById(id)
      .populate({
        path: 'petId',
        select: 'name species breed age gender weight color microchipId medicalHistory vaccinations',
        populate: { path: 'images', select: 'url caption isPrimary' }
      })
      .populate({
        path: 'pets.petId',
        select: 'name species breed age gender weight color microchipId medicalHistory vaccinations',
        populate: { path: 'images', select: 'url caption isPrimary' }
      })
      .populate('ownerId', 'name email phone address')
      .populate('serviceId', 'name price duration category');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify appointment belongs to this store
    if (appointment.storeId.toString() !== veterinaryStore._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Appointment does not belong to your clinic'
      });
    }

    if (!['confirmed', 'scheduled'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed or scheduled appointments can be started'
      });
    }

    // Update appointment status
    appointment.status = 'in_progress';
    appointment.updatedBy = req.user._id;
    
    // Update all pets status to in_progress
    if (appointment.isMultiplePets && appointment.pets.length > 0) {
      appointment.pets.forEach(pet => {
        pet.status = 'in_progress';
      });
    }
    
    await appointment.save();

    // Get previous medical records for all pets
    const petIds = appointment.isMultiplePets 
      ? appointment.pets.map(p => p.petId._id)
      : [appointment.petId._id];

    const previousRecords = await VeterinaryMedicalRecord.find({
      pet: { $in: petIds },
      isActive: true
    })
      .populate('pet', 'name species breed')
      .populate('staff', 'name role')
      .sort({ visitDate: -1 })
      .limit(10);

    // Group records by pet
    const recordsByPet = {};
    previousRecords.forEach(record => {
      const petId = record.pet._id.toString();
      if (!recordsByPet[petId]) {
        recordsByPet[petId] = [];
      }
      recordsByPet[petId].push(record);
    });

    res.json({
      success: true,
      message: 'Consultation started',
      data: {
        appointment,
        previousRecords,
        recordsByPet,
        petHistory: {
          totalVisits: previousRecords.length,
          lastVisit: previousRecords[0]?.visitDate || null
        },
        isMultiplePets: appointment.isMultiplePets,
        petsCount: appointment.isMultiplePets ? appointment.pets.length : 1
      }
    });
  } catch (error) {
    console.error('Start consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting consultation',
      error: error.message
    });
  }
};

// Complete consultation and create medical record
const completeConsultation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      diagnosis,
      treatment,
      notes,
      medications,
      procedures,
      vaccinations,
      tests,
      prescriptions,
      followUpRequired,
      followUpDate,
      followUpNotes,
      totalCost,
      paymentStatus,
      amountPaid
    } = req.body;

    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Find the veterinary store
    const veterinaryStore = await Veterinary.findOne({ storeId });
    if (!veterinaryStore) {
      return res.status(404).json({
        success: false,
        message: 'Veterinary store not found'
      });
    }

    const appointment = await VeterinaryAppointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify appointment belongs to this store
    if (appointment.storeId.toString() !== veterinaryStore._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Appointment does not belong to your clinic'
      });
    }

    if (appointment.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Only in-progress consultations can be completed'
      });
    }

    // Create medical record
    const medicalRecord = new VeterinaryMedicalRecord({
      pet: appointment.petId,
      owner: appointment.ownerId,
      veterinary: veterinaryStore._id,
      staff: req.user._id,
      visitDate: new Date(),
      diagnosis: diagnosis.trim(),
      treatment: treatment ? treatment.trim() : '',
      notes: notes ? notes.trim() : '',
      medications: medications || [],
      procedures: procedures || [],
      vaccinations: vaccinations || [],
      tests: tests || [],
      prescriptions: prescriptions || [],
      followUpRequired: followUpRequired || false,
      followUpDate: followUpDate || null,
      followUpNotes: followUpNotes ? followUpNotes.trim() : '',
      totalCost: totalCost || 0,
      paymentStatus: paymentStatus || 'pending',
      amountPaid: amountPaid || 0,
      storeId,
      storeName: req.user.storeName || veterinaryStore.storeName || veterinaryStore.name,
      isActive: true,
      createdBy: req.user._id
    });

    await medicalRecord.save();

    // Update appointment
    appointment.status = 'completed';
    appointment.updatedBy = req.user._id;
    await appointment.save();

    // Populate medical record for response
    await medicalRecord.populate([
      {
        path: 'pet',
        select: 'name species breed age gender',
        populate: { path: 'images', select: 'url caption isPrimary' }
      },
      { path: 'owner', select: 'name email phone' },
      { path: 'staff', select: 'name email role' },
      { path: 'veterinary', select: 'name storeName address contact' }
    ]);

    res.json({
      success: true,
      message: 'Consultation completed and medical record created successfully',
      data: {
        medicalRecord,
        appointment
      }
    });
  } catch (error) {
    console.error('Complete consultation error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map((err) => err.message)
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while completing consultation',
      error: error.message
    });
  }
};

// Get consultation details (for doctor page)
const getConsultationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Find the veterinary store
    const veterinaryStore = await Veterinary.findOne({ storeId });
    if (!veterinaryStore) {
      return res.status(404).json({
        success: false,
        message: 'Veterinary store not found'
      });
    }

    const appointment = await VeterinaryAppointment.findById(id)
      .populate({
        path: 'petId',
        select: 'name species breed age gender weight color microchipId medicalHistory vaccinations allergies',
        populate: { path: 'images', select: 'url caption isPrimary' }
      })
      .populate('ownerId', 'name email phone address')
      .populate('serviceId', 'name price duration category description');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify appointment belongs to this store
    if (appointment.storeId.toString() !== veterinaryStore._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Appointment does not belong to your clinic'
      });
    }

    // Get all previous medical records for this pet at this clinic
    const medicalHistory = await VeterinaryMedicalRecord.find({
      pet: appointment.petId._id,
      veterinary: veterinaryStore._id,
      isActive: true
    })
      .populate('staff', 'name role specialization')
      .sort({ visitDate: -1 });

    // Get statistics
    const stats = {
      totalVisits: medicalHistory.length,
      lastVisit: medicalHistory[0]?.visitDate || null,
      totalSpent: medicalHistory.reduce((sum, record) => sum + (record.totalCost || 0), 0),
      pendingBalance: medicalHistory.reduce((sum, record) => sum + (record.balanceDue || 0), 0)
    };

    res.json({
      success: true,
      data: {
        appointment,
        medicalHistory,
        stats
      }
    });
  } catch (error) {
    console.error('Get consultation details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching consultation details',
      error: error.message
    });
  }
};

// Update medical record
const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const medicalRecord = await VeterinaryMedicalRecord.findById(id);
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Verify record belongs to this store
    if (medicalRecord.storeId !== storeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Medical record does not belong to your clinic'
      });
    }

    // Prevent updating certain fields
    delete updates._id;
    delete updates.pet;
    delete updates.owner;
    delete updates.veterinary;
    delete updates.storeId;
    delete updates.createdBy;
    delete updates.createdAt;

    // Trim string fields
    if (updates.diagnosis) updates.diagnosis = updates.diagnosis.trim();
    if (updates.treatment) updates.treatment = updates.treatment.trim();
    if (updates.notes) updates.notes = updates.notes.trim();
    if (updates.followUpNotes) updates.followUpNotes = updates.followUpNotes.trim();

    Object.assign(medicalRecord, updates);
    medicalRecord.updatedBy = req.user._id;
    medicalRecord.lastUpdatedBy = req.user._id;

    await medicalRecord.save();

    // Populate for response
    await medicalRecord.populate([
      {
        path: 'pet',
        select: 'name species breed age gender',
        populate: { path: 'images', select: 'url caption isPrimary' }
      },
      { path: 'owner', select: 'name email phone' },
      { path: 'staff', select: 'name email role' }
    ]);

    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: { medicalRecord }
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map((err) => err.message)
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating medical record',
      error: error.message
    });
  }
};

// Complete consultation for a specific pet in multiple-pet appointment
const completePetConsultation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id, petId } = req.params;
    const {
      diagnosis,
      treatment,
      notes,
      medications,
      procedures,
      vaccinations,
      tests,
      prescriptions,
      followUpRequired,
      followUpDate,
      followUpNotes,
      totalCost,
      paymentStatus,
      amountPaid
    } = req.body;

    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Find the veterinary store
    const veterinaryStore = await Veterinary.findOne({ storeId });
    if (!veterinaryStore) {
      return res.status(404).json({
        success: false,
        message: 'Veterinary store not found'
      });
    }

    const appointment = await VeterinaryAppointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify appointment belongs to this store
    if (appointment.storeId.toString() !== veterinaryStore._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Appointment does not belong to your clinic'
      });
    }

    if (appointment.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Only in-progress consultations can be completed'
      });
    }

    // Find the specific pet in the appointment
    const petIndex = appointment.pets.findIndex(p => p.petId.toString() === petId);
    if (petIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found in this appointment'
      });
    }

    // Create medical record for this pet
    const medicalRecord = new VeterinaryMedicalRecord({
      pet: petId,
      owner: appointment.ownerId,
      veterinary: veterinaryStore._id,
      staff: req.user._id,
      visitDate: new Date(),
      diagnosis: diagnosis.trim(),
      treatment: treatment ? treatment.trim() : '',
      notes: notes ? notes.trim() : '',
      medications: medications || [],
      procedures: procedures || [],
      vaccinations: vaccinations || [],
      tests: tests || [],
      prescriptions: prescriptions || [],
      followUpRequired: followUpRequired || false,
      followUpDate: followUpDate || null,
      followUpNotes: followUpNotes ? followUpNotes.trim() : '',
      totalCost: totalCost || 0,
      paymentStatus: paymentStatus || 'pending',
      amountPaid: amountPaid || 0,
      storeId,
      storeName: req.user.storeName || veterinaryStore.storeName || veterinaryStore.name,
      isActive: true,
      createdBy: req.user._id
    });

    await medicalRecord.save();

    // Update pet status in appointment
    appointment.pets[petIndex].status = 'completed';
    appointment.pets[petIndex].medicalRecordId = medicalRecord._id;

    // Check if all pets are completed
    const allCompleted = appointment.pets.every(p => p.status === 'completed');
    if (allCompleted) {
      appointment.status = 'completed';
    }

    appointment.updatedBy = req.user._id;
    await appointment.save();

    // Populate medical record for response
    await medicalRecord.populate([
      {
        path: 'pet',
        select: 'name species breed age gender',
        populate: { path: 'images', select: 'url caption isPrimary' }
      },
      { path: 'owner', select: 'name email phone' },
      { path: 'staff', select: 'name email role' },
      { path: 'veterinary', select: 'name storeName address contact' }
    ]);

    res.json({
      success: true,
      message: `Consultation completed for pet. ${allCompleted ? 'All pets completed!' : `${appointment.pets.filter(p => p.status !== 'completed').length} pet(s) remaining.`}`,
      data: {
        medicalRecord,
        appointment,
        allCompleted,
        remainingPets: appointment.pets.filter(p => p.status !== 'completed').length
      }
    });
  } catch (error) {
    console.error('Complete pet consultation error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map((err) => err.message)
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while completing consultation',
      error: error.message
    });
  }
};

module.exports = {
  getPendingApplications,
  acceptApplication,
  rejectApplication,
  startConsultation,
  completeConsultation,
  completePetConsultation,
  getConsultationDetails,
  updateMedicalRecord
};
