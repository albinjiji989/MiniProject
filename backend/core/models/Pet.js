const mongoose = require('mongoose');

const OwnershipHistorySchema = new mongoose.Schema({
  ownerType: { type: String, enum: ['public_user', 'shelter', 'adoption_center', 'rescue', 'temporary_care', 'veterinary', 'pharmacy', 'pet_shop', 'other'], default: 'other' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  ownerName: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  notes: { type: String, default: '' }
}, { _id: false });

const MedicalHistorySchema = new mongoose.Schema({
  condition: { type: String, required: true },
  diagnosisDate: { type: Date },
  treatment: { type: String, default: '' },
  veterinarian: { type: String, default: '' },
  notes: { type: String, default: '' },
  attachments: [{ type: String }],
  date: { type: Date, default: Date.now }
}, { _id: false });

const VaccinationRecordSchema = new mongoose.Schema({
  vaccineName: { type: String, required: true },
  dateGiven: { type: Date, required: true },
  veterinarian: { type: String, default: '' },
  batchNumber: { type: String, default: '' },
  nextDueDate: { type: Date }
}, { _id: false });

const MedicationRecordSchema = new mongoose.Schema({
  medicationName: { type: String, required: true },
  dosage: { type: String, default: '' },
  frequency: { type: String, default: '' },
  startDate: { type: Date },
  endDate: { type: Date },
  prescribedBy: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { _id: false });

const petSchema = new mongoose.Schema({
  // Identification
  name: { type: String, required: true, index: true },
  species: { type: String, required: true, enum: ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'] },
  breed: { type: String, default: '' },
  color: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
  dateOfBirth: { type: Date },
  ageYears: { type: Number, default: 0 },
  size: { type: String, enum: ['small', 'medium', 'large', 'extra_large'], default: 'medium' },
  weightKg: { type: Number, default: 0 },
  microchipId: { type: String, index: true },
  tags: [{ type: String }],
  images: [{ type: String }],

  // Status
  currentStatus: { type: String, enum: ['available', 'adopted', 'rescued', 'in_care', 'lost', 'deceased', 'not_available'], default: 'available', index: true },
  adoptionFee: { type: Number, default: 0 },

  // Location (GeoJSON)
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined } // [lng, lat]
  },

  // Ownership and medical history
  ownershipHistory: [OwnershipHistorySchema],
  medicalHistory: [MedicalHistorySchema],
  vaccinationRecords: [VaccinationRecordSchema],
  medicationRecords: [MedicationRecordSchema],

  // Auditing and tenancy
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  storeId: { type: String, index: true },
  storeName: { type: String }
}, { timestamps: true });

petSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Pet', petSchema);


