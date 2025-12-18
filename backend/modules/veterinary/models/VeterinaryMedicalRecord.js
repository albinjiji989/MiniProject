const mongoose = require('mongoose');

const veterinaryMedicalRecordSchema = new mongoose.Schema({
  // Basic record information
  pet: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pet', 
    required: true 
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  veterinary: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Veterinary', 
    required: true 
  },
  
  // Visit information
  visitDate: { 
    type: Date, 
    required: true 
  },
  diagnosis: { 
    type: String, 
    required: true 
  },
  treatment: { 
    type: String 
  },
  notes: { 
    type: String 
  },
  
  // Medications prescribed
  medications: [{
    name: { 
      type: String, 
      required: true 
    },
    dosage: { 
      type: String, 
      required: true 
    },
    frequency: { 
      type: String, 
      required: true 
    },
    duration: { 
      type: String 
    }
  }],
  
  // Procedures performed
  procedures: [{
    name: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String 
    },
    cost: { 
      type: Number, 
      min: 0 
    }
  }],
  
  // Vaccinations given
  vaccinations: [{
    name: { 
      type: String, 
      required: true 
    },
    batchNumber: { 
      type: String 
    },
    expiryDate: { 
      type: Date 
    }
  }],
  
  // Tests conducted
  tests: [{
    testName: { 
      type: String, 
      required: true 
    },
    result: { 
      type: String 
    },
    notes: { 
      type: String 
    }
  }],
  
  // Prescribed items
  prescriptions: [{
    name: { 
      type: String, 
      required: true 
    },
    quantity: { 
      type: Number, 
      min: 1 
    },
    instructions: { 
      type: String 
    }
  }],
  
  // Attachments
  attachments: [{
    name: { 
      type: String, 
      required: true 
    },
    url: { 
      type: String, 
      required: true 
    },
    type: { 
      type: String 
    }
  }],
  
  // Billing information
  totalCost: { 
    type: Number, 
    min: 0 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
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
    type: String 
  },
  
  // Store information
  isActive: { 
    type: Boolean, 
    default: true 
  },
  storeId: { 
    type: String
  },
  
  // Audit fields
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true 
});

// Indexes
veterinaryMedicalRecordSchema.index({ pet: 1 });
veterinaryMedicalRecordSchema.index({ owner: 1 });
veterinaryMedicalRecordSchema.index({ veterinary: 1 });
veterinaryMedicalRecordSchema.index({ visitDate: 1 });
veterinaryMedicalRecordSchema.index({ storeId: 1 });

module.exports = mongoose.model('VeterinaryMedicalRecord', veterinaryMedicalRecordSchema);