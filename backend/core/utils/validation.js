const Joi = require('joi');

// Validation schema for creating a pet
const createPetSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Pet name must be at least 1 character',
    'string.max': 'Pet name must be less than 100 characters',
    'any.required': 'Pet name is required'
  }),
  speciesId: Joi.string().optional(),
  species: Joi.string().optional(),
  breedId: Joi.string().optional(),
  breed: Joi.string().optional(),
  gender: Joi.string().valid('Male', 'Female', 'Unknown').optional(),
  age: Joi.number().integer().min(0).max(500).optional(),
  ageUnit: Joi.string().valid('days', 'weeks', 'months', 'years').optional(),
  color: Joi.string().max(50).optional(),
  images: Joi.array().items(Joi.string()).optional()
}).xor('speciesId', 'species').xor('breedId', 'breed');

// Validation schema for updating a pet
const updatePetSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  speciesId: Joi.string().optional(),
  breedId: Joi.string().optional(),
  gender: Joi.string().valid('Male', 'Female', 'Unknown').optional(),
  age: Joi.number().integer().min(0).max(500).optional(),
  ageUnit: Joi.string().valid('days', 'weeks', 'months', 'years').optional(),
  color: Joi.string().max(50).optional(),
  currentStatus: Joi.string().max(50).optional(),
  healthStatus: Joi.string().max(50).optional()
});

// Validation schema for adding medical history
const addMedicalHistorySchema = Joi.object({
  type: Joi.string().min(1).max(100).required(),
  date: Joi.date().iso().required(),
  description: Joi.string().max(1000).required(),
  veterinarian: Joi.string().max(100).optional(),
  cost: Joi.number().min(0).optional(),
  documents: Joi.array().items(Joi.string()).optional()
});

// Validation schema for adding vaccination record
const addVaccinationRecordSchema = Joi.object({
  vaccineName: Joi.string().min(1).max(100).required(),
  dateGiven: Joi.date().iso().required(),
  nextDueDate: Joi.date().iso().optional(),
  veterinarian: Joi.string().max(100).optional(),
  batchNumber: Joi.string().max(50).optional(),
  notes: Joi.string().max(500).optional()
});

// Validation schema for adding medication record
const addMedicationRecordSchema = Joi.object({
  medicationName: Joi.string().min(1).max(100).required(),
  dosage: Joi.string().min(1).max(100).required(),
  frequency: Joi.string().min(1).max(100).required(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  prescribedBy: Joi.string().max(100).optional(),
  notes: Joi.string().max(500).optional()
});

// Validation schema for adding ownership history
const addOwnershipHistorySchema = Joi.object({
  ownerType: Joi.string().valid('individual', 'organization', 'shelter', 'other').optional(),
  ownerId: Joi.string().required(),
  ownerName: Joi.string().min(1).max(100).required(),
  startDate: Joi.date().iso().optional(),
  notes: Joi.string().max(500).optional()
});

// Validation schema for searching nearby pets
const searchNearbyPetsSchema = Joi.object({
  lng: Joi.number().min(-180).max(180).required(),
  lat: Joi.number().min(-90).max(90).required(),
  radius: Joi.number().min(1).max(100).optional().default(10)
});

// Validation schema for pet birthday preference
const setPetBirthdayPreferenceSchema = Joi.object({
  petId: Joi.string().required(),
  petModel: Joi.string().valid('Pet', 'PetNew', 'AdoptionPet', 'PetInventoryItem').required(),
  currentAge: Joi.object({
    value: Joi.number().min(0).required(),
    unit: Joi.string().valid('days', 'weeks', 'months', 'years').required()
  }).required(),
  preferredBirthday: Joi.number().integer().min(1).max(31).required()
});

// Generic validation function
const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return { isValid: false, error: errorMessage, value };
  }
  return { isValid: true, error: null, value };
};

module.exports = {
  createPetSchema,
  updatePetSchema,
  addMedicalHistorySchema,
  addVaccinationRecordSchema,
  addMedicationRecordSchema,
  addOwnershipHistorySchema,
  searchNearbyPetsSchema,
  setPetBirthdayPreferenceSchema,
  validate
};