const mongoose = require('mongoose');

const veterinaryMedicalRecordSchema = new mongoose.Schema({
  // Basic Information
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  veterinary: { type: mongoose.Schema.Types.ObjectId, ref: 'Veterinary', required: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'VeterinaryStaff' },
  
  // Visit Information
  visitDate: { type: Date, required: true },
  visitType: { 
    type: String, 
    enum: ['routine_checkup', 'vaccination', 'surgery', 'emergency', 'follow_up', 'consultation', 'other'],
    default: 'consultation'
  },
  
  // Clinical Information
  chiefComplaint: { type: String },
  history: { type: String },
  examinationFindings: { type: String },
  diagnosis: { type: String },
  treatment: { type: String },
  prescription: { type: String },
  
  // Medications
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String },
    notes: { type: String }
  }],
  
  // Procedures
  procedures: [{
    name: { type: String, required: true },
    date: { type: Date },
    notes: { type: String }
  }],
  
  // Vaccinations
  vaccinations: [{
    name: { type: String, required: true },
    date: { type: Date },
    nextDueDate: { type: Date },
    batchNumber: { type: String },
    notes: { type: String }
  }],
  
  // Laboratory Tests
  labTests: [{
    testName: { type: String, required: true },
    result: { type: String },
    date: { type: Date },
    notes: { type: String }
  }],
  
  // Weight and Vital Signs
  weight: { type: Number }, // in kg
  temperature: { type: Number }, // in Celsius
  heartRate: { type: Number }, // beats per minute
  respiratoryRate: { type: Number }, // breaths per minute
  
  // Follow-up
  followUpRequired: { type: Boolean, default: false },
  followUpDate: { type: Date },
  followUpNotes: { type: String },
  
  // Cost and Payment
  cost: { type: Number, min: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'partial', 'cancelled'],
    default: 'pending'
  },
  
  // Attachments
  attachments: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'pdf', 'document', 'other'] },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Status
  isActive: { type: Boolean, default: true },
  storeId: { type: String, index: true },
  storeName: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes
veterinaryMedicalRecordSchema.index({ pet: 1 });
veterinaryMedicalRecordSchema.index({ owner: 1 });
veterinaryMedicalRecordSchema.index({ veterinary: 1 });
veterinaryMedicalRecordSchema.index({ visitDate: -1 });
veterinaryMedicalRecordSchema.index({ diagnosis: 1 });

module.exports = mongoose.models.VeterinaryMedicalRecord || mongoose.model('VeterinaryMedicalRecord', veterinaryMedicalRecordSchema);