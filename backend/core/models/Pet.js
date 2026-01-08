const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  // Basic pet information
  name: {
    type: String,
    required: true,
    trim: true
  },

  // Reference to master pet details
  petDetailsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetDetails',
    required: false
  },

  // Direct links to species and breed for simple public pet creation
  speciesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Species',
    required: false
  },
  breedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Breed',
    required: false
  },

  // Individual pet specific information
  dateOfBirth: {
    type: Date
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  age: {
    type: Number,
    required: true,
    min: 0
  },
  ageUnit: {
    type: String,
    enum: ['weeks', 'months', 'years'],
    default: 'months'
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Unknown']
  },
  weight: {
    value: {
      type: Number,
      required: false,
      min: 0
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs', 'g'],
      default: 'kg'
    }
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: String,
    enum: ['tiny', 'small', 'medium', 'large', 'giant'],
    default: 'medium'
  },

  // Unique 5-digit Pet ID
  petId: {
    type: String,
    unique: true,
    required: false,
    validate: {
      validator: function (v) {
        return !v || /^\d{5}$/.test(v);
      },
      message: 'Pet ID must be a 5-digit number'
    }
  },

  // Unique pet identifier (same format as adoption/petshop: 3 letters + 5 digits)
  petCode: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || /^[A-Z]{3}\d{5}$/.test(v)
      },
      message: 'petCode must be 3 uppercase letters followed by 5 digits'
    }
  },

  // Status and availability
  currentStatus: {
    type: String,
    enum: ['Available', 'Adopted', 'Reserved', 'Under Treatment', 'Deceased', 'Fostered'],
    default: 'Available'
  },

  // Health and medical information
  healthStatus: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'],
    default: 'Good'
  },
  medicalHistory: [{
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    veterinarian: {
      type: String,
      trim: true
    },
    cost: {
      type: Number,
      min: 0
    }
  }],
  vaccinations: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    nextDue: {
      type: Date
    },
    veterinarian: {
      type: String,
      trim: true
    },
    certificate: {
      type: String,
      trim: true
    }
  }],
  specialNeeds: [{
    type: String,
    trim: true
  }],

  // Behavioral information
  temperament: [{
    type: String,
    trim: true
  }],
  behaviorNotes: {
    type: String,
    trim: true
  },

  // Adoption information
  adoptionFee: {
    type: Number,
    default: 0,
    min: 0
  },
  adoptionRequirements: [{
    type: String,
    trim: true
  }],
  isAdoptionReady: {
    type: Boolean,
    default: true
  },

  // Media and documentation - REPLACED EMBEDDED STRUCTURE WITH REFERENCES
  imageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  documentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],

  // Location information (optional)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: false
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: false
    },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true }
  },

  // Tags and categorization
  tags: [{
    type: String,
    trim: true
  }],

  // Custom breed information (if not from master list)
  customBreedInfo: {
    species: {
      type: String,
      trim: true
    },
    breed: {
      type: String,
      trim: true
    },
    isPendingApproval: {
      type: Boolean,
      default: false
    },
    customBreedRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomBreedRequest'
    }
  },

  // Ownership and management
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Ownership history
  ownershipHistory: [{
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    ownerName: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      default: null
    },
    reason: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  }],

  // Temporary Care Status
  temporaryCareStatus: {
    inCare: {
      type: Boolean,
      default: false
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TemporaryCareApplication'
    },
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TemporaryCareCenter'
    },
    startDate: {
      type: Date
    },
    expectedEndDate: {
      type: Date
    }
  },

  // Soft delete
  isActive: {
    type: Boolean,
    default: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate age from dateOfBirth before saving
petSchema.pre('save', function (next) {
  if (this.dateOfBirth) {
    const now = new Date();
    const diffTime = Math.abs(now - this.dateOfBirth);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Calculate age based on the unit
    switch (this.ageUnit) {
      case 'days':
        this.age = diffDays;
        break;
      case 'weeks':
        this.age = Math.floor(diffDays / 7);
        break;
      case 'months':
        this.age = Math.floor(diffDays / 30.44); // Average days in a month
        break;
      case 'years':
        this.age = Math.floor(diffDays / 365.25); // Account for leap years
        break;
      default:
        this.age = Math.floor(diffDays / 30.44); // Default to months
    }
  }
  next();
});

// Static: generate unique pet code using centralized generator
petSchema.statics.generatePetCode = async function () {
  const PetCodeGenerator = require('../utils/petCodeGenerator')
  return await PetCodeGenerator.generateUniquePetCode()
}

// Pre-save: assign petCode if missing
petSchema.pre('save', async function (next) {
  try {
    if (!this.petCode) {
      const Model = this.constructor
      this.petCode = await Model.generatePetCode()
    }
    next()
  } catch (err) {
    next(err)
  }
})

// Post-save: register in centralized PetRegistry
petSchema.post('save', async function(doc) {
  try {
    // Only register if petCode exists
    if (doc.petCode) {
      const PetRegistry = require('./PetRegistry');
      
      // Register the pet in the centralized registry
      await PetRegistry.ensureRegistered({
        petCode: doc.petCode,
        name: doc.name,
        species: doc.speciesId,
        breed: doc.breedId,
        images: doc.imageIds || [],
        source: 'user',
        userPetId: doc._id,
        actorUserId: doc.createdBy,
        firstAddedSource: 'user',
        firstAddedBy: doc.createdBy,
        gender: doc.gender,
        age: doc.age,
        ageUnit: doc.ageUnit,
        color: doc.color
      }, {
        currentOwnerId: doc.ownerId,
        currentLocation: 'at_owner',
        currentStatus: doc.currentStatus
      });
    }
  } catch (err) {
    console.warn('Failed to register user pet in PetRegistry:', err.message);
  }
});

// Pre-insertMany: assign codes for bulk inserts (e.g., CSV import)
petSchema.pre('insertMany', async function (docs) {
  const Model = this.model ? this.model : this.constructor
  for (const doc of docs) {
    if (!doc.petCode) {
      // eslint-disable-next-line no-await-in-loop
      doc.petCode = await Model.generatePetCode()
    }
  }
})

// Indexes
petSchema.index({ name: 1 });
petSchema.index({ speciesId: 1 });
petSchema.index({ breedId: 1 });
petSchema.index({ ownerId: 1 });
petSchema.index({ petCode: 1 }, { unique: true, sparse: true });
petSchema.index({ dateOfBirth: 1 });

module.exports = mongoose.model('Pet', petSchema);