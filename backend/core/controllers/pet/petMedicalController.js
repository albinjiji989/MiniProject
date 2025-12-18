const Pet = require('../../models/Pet');
const PetChangeLog = require('../../models/PetChangeLog');
const { canAccessPet } = require('./helpers');
const ErrorHandler = require('../../utils/errorHandler');
const logger = require('../../utils/logger');
const { validate, addMedicalHistorySchema, addVaccinationRecordSchema, addMedicationRecordSchema } = require('../../utils/validation');

// @route   PUT /api/pets/:id/medical-history
// @desc    Add medical history entry
// @access  Private
const addMedicalHistory = async (req, res) => {
  try {
    // Validate input
    const { isValid, error } = validate(addMedicalHistorySchema, req.body);
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

    const medicalEntry = {
      ...req.body,
      date: new Date()
    };

    pet.medicalHistory.push(medicalEntry);
    pet.lastUpdatedBy = req.user._id;
    await pet.save();

    await PetChangeLog.create({
      petId: pet._id,
      action: 'medical_add',
      changedBy: req.user._id,
      meta: medicalEntry
    });

    ErrorHandler.sendSuccess(res, { pet }, 'Medical history added successfully');
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'add_medical_history');
  }
};

// @route   PUT /api/pets/:id/vaccination
// @desc    Add vaccination record
// @access  Private
const addVaccinationRecord = async (req, res) => {
  try {
    // Validate input
    const { isValid, error } = validate(addVaccinationRecordSchema, req.body);
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

    const vaccinationRecord = {
      ...req.body,
      dateGiven: new Date(req.body.dateGiven)
    };

    pet.vaccinationRecords.push(vaccinationRecord);
    pet.lastUpdatedBy = req.user._id;
    await pet.save();

    await PetChangeLog.create({
      petId: pet._id,
      action: 'vaccination_add',
      changedBy: req.user._id,
      meta: vaccinationRecord
    });

    ErrorHandler.sendSuccess(res, { pet }, 'Vaccination record added successfully');
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'add_vaccination_record');
  }
};

// @route   PUT /api/pets/:id/medications
// @desc    Add medication record
// @access  Private
const addMedicationRecord = async (req, res) => {
  try {
    // Validate input
    const { isValid, error } = validate(addMedicationRecordSchema, req.body);
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

    const record = {
      medicationName: req.body.medicationName,
      dosage: req.body.dosage,
      frequency: req.body.frequency,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      prescribedBy: req.body.prescribedBy,
      notes: req.body.notes
    };

    pet.medicationRecords.push(record);
    pet.lastUpdatedBy = req.user._id;
    await pet.save();

    await PetChangeLog.create({
      petId: pet._id,
      action: 'medication_add',
      changedBy: req.user._id,
      meta: record
    });

    ErrorHandler.sendSuccess(res, { pet }, 'Medication record added');
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'add_medication_record');
  }
};

module.exports = {
  addMedicalHistory,
  addVaccinationRecord,
  addMedicationRecord
};