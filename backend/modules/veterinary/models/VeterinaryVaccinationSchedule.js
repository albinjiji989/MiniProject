const mongoose = require('mongoose');

const veterinaryVaccinationScheduleSchema = new mongoose.Schema({
  // Pet reference
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: [true, 'Pet is required'],
    index: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required'],
    index: true
  },

  // Vaccination details
  vaccineName: {
    type: String,
    required: [true, 'Vaccine name is required'],
    trim: true
  },
  vaccineType: {
    type: String,
    enum: ['core', 'non-core', 'optional'],
    default: 'core'
  },
  description: {
    type: String,
    trim: true
  },

  // Schedule
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
    index: true
  },
  dueDate: {
    type: Date,
    index: true
  },
  administeredDate: {
    type: Date
  },

  // Status
  status: {
    type: String,
    enum: ['scheduled', 'due', 'overdue', 'completed', 'skipped', 'cancelled'],
    default: 'scheduled',
    index: true
  },

  // Vaccination record (when completed)
  batchNumber: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  administeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  medicalRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VeterinaryMedicalRecord'
  },

  // Next dose
  nextDoseDate: {
    type: Date
  },
  isBooster: {
    type: Boolean,
    default: false
  },
  boosterNumber: {
    type: Number,
    default: 0
  },

  // Reminders
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date
  },

  // Notes
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  sideEffects: {
    type: String,
    trim: true
  },

  // Store information
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
  }
}, {
  timestamps: true
});

// Indexes
veterinaryVaccinationScheduleSchema.index({ pet: 1, scheduledDate: -1 });
veterinaryVaccinationScheduleSchema.index({ owner: 1, status: 1 });
veterinaryVaccinationScheduleSchema.index({ storeId: 1, scheduledDate: 1, status: 1 });
veterinaryVaccinationScheduleSchema.index({ status: 1, dueDate: 1 });

// Update status based on dates
veterinaryVaccinationScheduleSchema.pre('save', function(next) {
  if (this.status !== 'completed' && this.status !== 'cancelled' && this.status !== 'skipped') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (this.dueDate) {
      const dueDate = new Date(this.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        this.status = 'overdue';
      } else if (dueDate.getTime() === today.getTime()) {
        this.status = 'due';
      }
    }
  }
  next();
});

veterinaryVaccinationScheduleSchema.set('toJSON', { virtuals: true });
veterinaryVaccinationScheduleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VeterinaryVaccinationSchedule', veterinaryVaccinationScheduleSchema);
