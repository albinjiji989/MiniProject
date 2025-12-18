const Pet = require('../../models/Pet');
const PetRegistryService = require('../../services/centralizedPetService');
const PetChangeLog = require('../../models/PetChangeLog');
const { canAccessPet } = require('./helpers');
const ErrorHandler = require('../../utils/errorHandler');
const logger = require('../../utils/logger');
const { validate, addOwnershipHistorySchema } = require('../../utils/validation');

// @route   PUT /api/pets/:id/owners
// @desc    Add ownership history entry (and close previous open ownership if any)
// @access  Private
const addOwnershipHistory = async (req, res) => {
  try {
    // Validate input
    const { isValid, error } = validate(addOwnershipHistorySchema, req.body);
    if (!isValid) {
      return ErrorHandler.sendError(res, error, 400);
    }

    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return ErrorHandler.sendError(res, 'Pet not found', 404);
    }

    if (!canAccessPet(req.user, pet)) {
      return ErrorHandler.sendError(res, 'Forbidden', 403);
    }

    // Close previous open ownership (no endDate)
    if (pet.ownershipHistory && pet.ownershipHistory.length > 0) {
      const last = pet.ownershipHistory[pet.ownershipHistory.length - 1];
      if (!last.endDate) {
        last.endDate = new Date();
      }
    }

    const entry = {
      ownerType: req.body.ownerType || 'other',
      ownerId: req.body.ownerId,
      ownerName: req.body.ownerName,
      startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
      notes: req.body.notes || ''
    };

    pet.ownershipHistory.push(entry);
    pet.lastUpdatedBy = req.user._id;
    await pet.save();

    // Sync centralized registry state
    try {
      // Prefer explicit ownerId from request; else keep as-is
      const newOwnerId = req.body.ownerId || undefined
      await PetRegistryService.updateState({
        petCode: pet.petCode,
        currentOwnerId: newOwnerId,
        currentLocation: newOwnerId ? 'at_owner' : undefined,
        currentStatus: newOwnerId ? 'owned' : undefined,
        actorUserId: req.user._id,
        lastTransferAt: newOwnerId ? new Date() : undefined
      })
    } catch (regErr) {
      logger.warn('PetRegistry state sync failed (ownership_add):', regErr?.message || regErr)
    }

    await PetChangeLog.create({
      petId: pet._id,
      action: 'ownership_add',
      changedBy: req.user._id,
      meta: entry
    });

    ErrorHandler.sendSuccess(res, { pet }, 'Ownership history updated');
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'add_ownership_history');
  }
};

// @route   GET /api/pets/:id/history
// @desc    Get combined history (ownership, medical, vaccinations, medications)
// @access  Private
const getPetHistory = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).select('name storeId');
    if (!pet) {
      return ErrorHandler.sendError(res, 'Pet not found', 404);
    }

    if (!canAccessPet(req.user, pet)) {
      return ErrorHandler.sendError(res, 'Forbidden', 403);
    }

    // Fetch ownership history from OwnershipHistory collection
    const OwnershipHistory = require('../../models/OwnershipHistory');
    const ownershipHistory = await OwnershipHistory.findByPet(req.params.id);

    // Fetch medical history from MedicalRecord collection
    const MedicalRecord = require('../../models/MedicalRecord');
    const medicalRecords = await MedicalRecord.findByPet(req.params.id);

    // Separate different types of medical records
    const medicalHistory = medicalRecords.filter(record => record.recordType === 'Treatment' || record.recordType === 'Checkup' || record.recordType === 'Surgery' || record.recordType === 'Emergency' || record.recordType === 'Dental' || record.recordType === 'Grooming' || record.recordType === 'Other');
    const vaccinationRecords = medicalRecords.filter(record => record.recordType === 'Vaccination');
    const medicationRecords = medicalRecords.filter(record => record.medications && record.medications.length > 0);

    ErrorHandler.sendSuccess(res, {
      name: pet.name,
      ownershipHistory: ownershipHistory || [],
      medicalHistory: medicalHistory || [],
      vaccinationRecords: vaccinationRecords || [],
      medicationRecords: medicationRecords || []
    });
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'get_pet_history');
  }
};

module.exports = {
  addOwnershipHistory,
  getPetHistory
};