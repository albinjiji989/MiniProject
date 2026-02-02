const mongoose = require('mongoose');

const veterinaryMedicalRecordSchema = new mongoose.Schema({
  // Basic record information
  pet: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pet', 
    required: [true, 'Pet reference is required'],
    index: true
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Owner reference is required'],
    index: true
  },
  veterinary: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Veterinary', 
    required: [true, 'Veterinary clinic reference is required'],
    index: true
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Visit information
  visitDate: { 
    type: Date, 
    required: [true, 'Visit date is required'],
    index: true
  },
  diagnosis: { 
    type: String, 
    required: [true, 'Diagnosis is required'],
    trim: true,
    maxlength: [2000, 'Diagnosis cannot exceed 2000 characters']
  },
  treatment: { 
    type: String,
    trim: true,
    maxlength: [2000, 'Treatment cannot exceed 2000 characters']
  },
  notes: { 
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  
  // Medications prescribed
  medications: [{
    name: { 
      type: String, 
      required: [true, 'Medication name is required'],
      trim: true
    },
    dosage: { 
      type: String, 
      required: [true, 'Dosage is required'],
      trim: true
    },
    frequency: { 
      type: String, 
      required: [true, 'Frequency is required'],
      trim: true
    },
    duration: { 
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // Procedures performed
  procedures: [{
    name: { 
      type: String, 
      required: [true, 'Procedure name is required'],
      trim: true
    },
    description: { 
      type: String,
      trim: true
    },
    cost: { 
      type: Number, 
      min: [0, 'Cost cannot be negative'],
      default: 0
    },
    performedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Vaccinations given
  vaccinations: [{
    name: { 
      type: String, 
      required: [true, 'Vaccination name is required'],
      trim: true
    },
    batchNumber: { 
      type: String,
      trim: true
    },
    expiryDate: { 
      type: Date
    },
    nextDueDate: {
      type: Date
    },
    administeredBy: {
      type: String,
      trim: true
    }
  }],
  
  // Tests conducted
  tests: [{
    testName: { 
      type: String, 
      required: [true, 'Test name is required'],
      trim: true
    },
    result: { 
      type: String,
      trim: true
    },
    notes: { 
      type: String,
      trim: true
    },
    performedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Prescribed items
  prescriptions: [{
    name: { 
      type: String, 
      required: [true, 'Prescription item name is required'],
      trim: true
    },
    quantity: { 
      type: Number, 
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    instructions: { 
      type: String,
      trim: true
    }
  }],
  
  // Attachments (X-rays, lab reports, etc.)
  attachments: [{
    name: { 
      type: String, 
      required: [true, 'Attachment name is required'],
      trim: true
    },
    url: { 
      type: String, 
      required: [true, 'Attachment URL is required']
    },
    type: { 
      type: String,
      enum: ['image', 'pdf', 'document', 'other'],
      default: 'other'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Billing information
  totalCost: { 
    type: Number, 
    min: [0, 'Total cost cannot be negative'],
    default: 0
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'partially_paid', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  amountPaid: {
    type: Number,
    min: [0, 'Amount paid cannot be negative'],
    default: 0
  },
  
  // Follow-up information
  followUpRequired: { 
    type: Boolean, 
    default: false
  },
  followUpDate: { 
    type: Date
  },
  followUpNotes: { 
    type: String,
    trim: true
  },
  
  // Store information
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  storeId: { 
    type: String,
    required: [true, 'Store ID is required'],
    index: true
  },
  storeName: {
    type: String,
    trim: true
  },
  
  // Audit fields
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Creator is required']
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true 
});

// Compound indexes for common queries
veterinaryMedicalRecordSchema.index({ pet: 1, visitDate: -1 });
veterinaryMedicalRecordSchema.index({ owner: 1, visitDate: -1 });
veterinaryMedicalRecordSchema.index({ veterinary: 1, visitDate: -1 });
veterinaryMedicalRecordSchema.index({ storeId: 1, isActive: 1, visitDate: -1 });
veterinaryMedicalRecordSchema.index({ paymentStatus: 1, isActive: 1 });

// Virtual for balance due
veterinaryMedicalRecordSchema.virtual('balanceDue').get(function() {
  return Math.max(0, (this.totalCost || 0) - (this.amountPaid || 0));
});

// Ensure virtuals are included in JSON
veterinaryMedicalRecordSchema.set('toJSON', { virtuals: true });
veterinaryMedicalRecordSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VeterinaryMedicalRecord', veterinaryMedicalRecordSchema);