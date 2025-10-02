const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  // Pet Reference
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: [true, 'Pet reference is required']
  },
  
  // Record Information
  recordType: {
    type: String,
    required: [true, 'Record type is required'],
    enum: ['Vaccination', 'Checkup', 'Surgery', 'Treatment', 'Emergency', 'Dental', 'Grooming', 'Other']
  },
  
  title: {
    type: String,
    required: [true, 'Record title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Date Information
  recordDate: {
    type: Date,
    required: [true, 'Record date is required']
  },
  
  nextDueDate: {
    type: Date
  },
  
  // Medical Details
  veterinarian: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Veterinarian name cannot exceed 100 characters']
    },
    clinic: {
      type: String,
      trim: true,
      maxlength: [200, 'Clinic name cannot exceed 200 characters']
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    }
  },
  
  // Cost Information
  cost: {
    amount: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
      default: 0
    },
    currency: {
      type: String,
      default: 'USD',
      maxlength: [3, 'Currency code cannot exceed 3 characters']
    }
  },
  
  // Medical Specific Fields
  diagnosis: {
    type: String,
    trim: true,
    maxlength: [500, 'Diagnosis cannot exceed 500 characters']
  },
  
  treatment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Treatment cannot exceed 1000 characters']
  },
  
  medications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: String,
      required: true,
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
  
  // Vaccination Specific Fields
  vaccineName: {
    type: String,
    trim: true,
    maxlength: [100, 'Vaccine name cannot exceed 100 characters']
  },
  
  vaccineType: {
    type: String,
    enum: ['Core', 'Non-Core', 'Optional'],
    default: 'Core'
  },
  
  batchNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Batch number cannot exceed 50 characters']
  },
  
  expiryDate: {
    type: Date
  },
  
  certificateNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Certificate number cannot exceed 100 characters']
  },
  
  // Files and Documents
  attachments: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['Image', 'PDF', 'Document', 'Certificate', 'Other']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Follow-up Information
  followUpRequired: {
    type: Boolean,
    default: false
  },
  
  followUpDate: {
    type: Date
  },
  
  followUpNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Follow-up notes cannot exceed 500 characters']
  },
  
  // Status
  status: {
    type: String,
    enum: ['Completed', 'Pending', 'Cancelled', 'Rescheduled'],
    default: 'Completed'
  },
  
  // Additional Notes
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
MedicalRecordSchema.index({ pet: 1 });
MedicalRecordSchema.index({ recordType: 1 });
MedicalRecordSchema.index({ recordDate: -1 });
MedicalRecordSchema.index({ veterinarian: 1 });
MedicalRecordSchema.index({ isActive: 1 });
MedicalRecordSchema.index({ createdAt: -1 });

// Virtual for age at time of record
MedicalRecordSchema.virtual('petAgeAtRecord').get(function() {
  if (this.pet && this.pet.dateOfBirth && this.recordDate) {
    const birthDate = new Date(this.pet.dateOfBirth);
    const recordDate = new Date(this.recordDate);
    const diffTime = Math.abs(recordDate - birthDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} months`;
    } else {
      return `${Math.floor(diffDays / 365)} years`;
    }
  }
  return 'Unknown';
});

// Pre-save middleware
MedicalRecordSchema.pre('save', function(next) {
  // Set next due date for vaccinations if not provided
  if (this.recordType === 'Vaccination' && !this.nextDueDate && this.recordDate) {
    const nextDue = new Date(this.recordDate);
    nextDue.setFullYear(nextDue.getFullYear() + 1); // Default 1 year for vaccinations
    this.nextDueDate = nextDue;
  }
  
  next();
});

// Static methods
MedicalRecordSchema.statics.findByPet = function(petId) {
  return this.find({ pet: petId, isActive: true }).sort({ recordDate: -1 });
};

MedicalRecordSchema.statics.findByType = function(recordType) {
  return this.find({ recordType, isActive: true }).sort({ recordDate: -1 });
};

MedicalRecordSchema.statics.findUpcoming = function() {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return this.find({
    nextDueDate: { $gte: today, $lte: nextWeek },
    isActive: true
  }).populate('pet', 'name petId');
};

MedicalRecordSchema.statics.findOverdue = function() {
  const today = new Date();
  
  return this.find({
    nextDueDate: { $lt: today },
    isActive: true
  }).populate('pet', 'name petId');
};

// Instance methods
MedicalRecordSchema.methods.softDelete = function() {
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

MedicalRecordSchema.methods.restore = function() {
  this.isActive = true;
  this.deletedAt = undefined;
  return this.save();
};

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
