const mongoose = require('mongoose');

const adoptionPetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  breed: {
    type: String,
    required: true,
    trim: true,
  },
  species: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  dobAccuracy: {
    type: String,
    enum: ['exact', 'estimated'],
    default: 'estimated'
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: false,
    default: 'male'
  },
  color: {
    type: String,
    required: false,
    default: 'unknown'
  },
  weight: {
    type: Number,
    required: false,
    default: 0,
  },
  vaccinationStatus: {
    type: String,
    enum: ['up_to_date', 'partial', 'not_vaccinated'],
    default: 'not_vaccinated',
  },
  // Optional: array form to align with spec; keep string for back-compat
  vaccinationStatusList: [{ type: String }],
  description: {
    type: String,
    required: false,
    default: ''
  },
  // Spec alias field (keep alongside description)
  healthHistory: { type: String },
  // References to separate Image and Document collections
  imageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  documentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  status: {
    type: String,
    enum: ['pending', 'available', 'reserved', 'adopted'],
    default: 'pending',
  },
  adoptionFee: {
    type: Number,
    required: false,
    min: 0,
    default: 0,
  },
  // Unique adoption pet code: 3 letters (A-Z) + 5 digits
  petCode: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || /^[A-Z]{3}\d{5}$/.test(v)
      },
      message: 'petCode must be 3 uppercase letters followed by 5 digits'
    }
  },
  adopterUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  adoptionDate: {
    type: Date,
    default: null,
  },
  specialNeeds: [{
    type: String,
  }],
  medicalHistory: [{
    date: Date,
    description: String,
    veterinarian: String,
  }],
  
  // Smart Matching Attributes
  compatibilityProfile: {
    // Size Classification
    size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    
    // Energy & Activity
    energyLevel: { type: Number, min: 1, max: 5, default: 3 }, // 1=very low, 5=very high
    exerciseNeeds: { type: String, enum: ['minimal', 'moderate', 'high', 'very_high'], default: 'moderate' },
    
    // Training & Behavior
    trainingNeeds: { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
    trainedLevel: { type: String, enum: ['untrained', 'basic', 'intermediate', 'advanced'], default: 'untrained' },
    
    // Social Compatibility Scores (1-10)
    childFriendlyScore: { type: Number, min: 0, max: 10, default: 5 },
    petFriendlyScore: { type: Number, min: 0, max: 10, default: 5 },
    strangerFriendlyScore: { type: Number, min: 0, max: 10, default: 5 },
    
    // Living Requirements
    minHomeSize: { type: Number, default: 0 }, // sq ft
    needsYard: { type: Boolean, default: false },
    canLiveInApartment: { type: Boolean, default: true },
    
    // Care Requirements
    groomingNeeds: { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
    estimatedMonthlyCost: { type: Number, default: 100 }, // USD
    
    // Behavioral Traits
    temperamentTags: [{ type: String }], // ['calm', 'playful', 'protective', etc]
    noiseLevel: { type: String, enum: ['quiet', 'moderate', 'vocal'], default: 'moderate' },
    
    // Special Notes
    canBeLeftAlone: { type: Boolean, default: true },
    maxHoursAlone: { type: Number, default: 8 },
    requiresExperiencedOwner: { type: Boolean, default: false }
  },
  
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Temporary Care Status
  temporaryCareStatus: {
    inCare: {
      type: Boolean,
      default: false,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TemporaryCareApplication',
    },
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TemporaryCareCenter',
    },
    startDate: {
      type: Date,
    },
    expectedEndDate: {
      type: Date,
    },
  },
  
  // Adoption History Tracking (for ML)
  adoptionHistory: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    adoptionDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null  // Score from our matching algorithm
    },
    algorithmVersion: {
      type: String,
      default: 'content-v1'  // Which algorithm was used
    },
    algorithmBreakdown: {
      contentScore: Number,
      collaborativeScore: Number,
      xgboostScore: Number,
      clusterScore: Number,
      hybridScore: Number
    },
    returnedDate: {
      type: Date,
      default: null  // If pet was returned
    },
    returnReason: {
      type: String,
      default: ''
    },
    successfulAdoption: {
      type: Boolean,
      default: null  // null=pending, true=success, false=returned
    },
    daysUntilReturn: {
      type: Number,
      default: null
    },
    userFeedbackScore: {
      type: Number,
      min: 1,
      max: 5,
      default: null  // 1-5 star rating from user
    },
    userFeedbackText: {
      type: String,
      default: ''
    },
    feedbackDate: {
      type: Date,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  
  // Soft Delete
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
});

// Include virtuals in JSON/Object outputs
adoptionPetSchema.set('toJSON', { virtuals: true })
adoptionPetSchema.set('toObject', { virtuals: true })

// Virtuals for populating images and documents
adoptionPetSchema.virtual('images', {
  ref: 'Image',
  localField: 'imageIds',
  foreignField: '_id',
  justOne: false
});

adoptionPetSchema.virtual('documents', {
  ref: 'Document',
  localField: 'documentIds',
  foreignField: '_id',
  justOne: false
});

// Auto-fill missing compatibility profile fields from breed-specific defaults
adoptionPetSchema.pre('save', function (next) {
  try {
    const { applyBreedDefaults } = require('../../services/breedDefaults');
    
    // Only run if the pet has a breed and compatibility profile exists (even partial)
    if (this.breed) {
      const currentProfile = this.compatibilityProfile
        ? this.compatibilityProfile.toObject ? this.compatibilityProfile.toObject() : { ...this.compatibilityProfile }
        : {};
      
      const filled = applyBreedDefaults(currentProfile, this.breed, this.species);
      
      // Apply the filled defaults back to the document
      if (!this.compatibilityProfile) {
        this.compatibilityProfile = {};
      }
      for (const [key, val] of Object.entries(filled)) {
        if (this.compatibilityProfile[key] === undefined || this.compatibilityProfile[key] === null || this.compatibilityProfile[key] === '') {
          this.compatibilityProfile[key] = val;
        }
      }
    }
  } catch (err) {
    // Non-fatal: don't block save if breed defaults fail
    console.warn('[BreedDefaults] Failed to auto-fill compatibility profile:', err.message);
  }
  next();
});

// Indexes for better query performance
adoptionPetSchema.index({ status: 1 });
adoptionPetSchema.index({ breed: 1 });
adoptionPetSchema.index({ species: 1 });
adoptionPetSchema.index({ adopterUserId: 1 });
adoptionPetSchema.index({ createdBy: 1 });
adoptionPetSchema.index({ petCode: 1 }, { unique: true, sparse: true });
adoptionPetSchema.index({ dateOfBirth: 1 });
adoptionPetSchema.index({ isDeleted: 1 });

// Compound indexes for performance
adoptionPetSchema.index({ status: 1, isDeleted: 1 });
adoptionPetSchema.index({ createdBy: 1, status: 1 });
adoptionPetSchema.index({ species: 1, breed: 1 });
adoptionPetSchema.index({ isDeleted: 1, isActive: 1 });

// Virtual for age display
adoptionPetSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return 0;
  const ageCalc = require('../../../../core/utils/ageCalculator');
  return ageCalc.calculateAgeFromDOB(this.dateOfBirth, 'months');
});

adoptionPetSchema.virtual('ageUnit').get(function () {
  return 'months'; // Default unit for backward compatibility
});

adoptionPetSchema.virtual('ageDisplay').get(function () {
  if (!this.dateOfBirth) return 'Unknown';
  const ageCalc = require('../../../../core/utils/ageCalculator');
  return ageCalc.formatAge(this.dateOfBirth);
});

// Spec-friendly virtuals
adoptionPetSchema.virtual('photos').get(function () {
  // This will work with populated images
  if (this.images && this.images.length > 0) {
    return this.images.map(img => ({ url: img.url, caption: img.caption }));
  }
  return [];
})

adoptionPetSchema.virtual('availabilityStatus').get(function () {
  return this.status
})

adoptionPetSchema.virtual('documentsUrls').get(function () {
  // This will work with populated documents
  if (this.documents && this.documents.length > 0) {
    return this.documents.map(d => d.url).filter(Boolean);
  }
  return [];
})

// Method to check if pet is available for adoption
adoptionPetSchema.methods.isAvailable = function () {
  return this.status === 'available' && this.isActive;
};

// Method to reserve pet
adoptionPetSchema.methods.reserve = function (userId) {
  if (this.status === 'available') {
    this.status = 'reserved';
    this.adopterUserId = userId;
    return true;
  }
  return false;
};

// Method to complete adoption
adoptionPetSchema.methods.completeAdoption = function () {
  if (this.status === 'reserved') {
    this.status = 'adopted';
    this.adoptionDate = new Date();
    return true;
  }
  return false;
};

// Method to record adoption for ML tracking
adoptionPetSchema.methods.recordAdoption = function(userId, matchScore, algorithmVersion = 'content-v1', algorithmBreakdown = {}) {
  this.adoptionHistory.push({
    userId,
    adoptionDate: new Date(),
    matchScore,
    algorithmVersion,
    algorithmBreakdown,
    successfulAdoption: null  // Pending - will be updated later
  });
  return this.save();
};

// Method to mark adoption as successful (for ML training)
adoptionPetSchema.methods.markAdoptionSuccessful = function(userId, feedbackScore = null, feedbackText = '') {
  const adoption = this.adoptionHistory.find(
    a => a.userId.toString() === userId.toString() && a.successfulAdoption === null
  );
  
  if (adoption) {
    adoption.successfulAdoption = true;
    adoption.userFeedbackScore = feedbackScore;
    adoption.userFeedbackText = feedbackText;
    adoption.feedbackDate = new Date();
    return this.save();
  }
  
  return Promise.reject(new Error('No pending adoption found for this user'));
};

// Method to mark adoption as failed/returned (for ML training)
adoptionPetSchema.methods.markAdoptionFailed = function(userId, returnReason = '') {
  const adoption = this.adoptionHistory.find(
    a => a.userId.toString() === userId.toString() && a.successfulAdoption === null
  );
  
  if (adoption) {
    adoption.successfulAdoption = false;
    adoption.returnedDate = new Date();
    adoption.returnReason = returnReason;
    
    // Calculate days until return
    const adoptionDate = new Date(adoption.adoptionDate);
    const returnDate = new Date(adoption.returnedDate);
    adoption.daysUntilReturn = Math.floor((returnDate - adoptionDate) / (1000 * 60 * 60 * 24));
    
    // Reset pet status to available
    this.status = 'available';
    this.adopterUserId = null;
    
    return this.save();
  }
  
  return Promise.reject(new Error('No pending adoption found for this user'));
};

// Static method to get successful adoptions for ML training
adoptionPetSchema.statics.getAdoptionsForTraining = async function() {
  const pets = await this.find({
    'adoptionHistory.successfulAdoption': { $ne: null }
  }).populate('adoptionHistory.userId', 'adoptionProfile').lean();
  
  const trainingData = [];
  pets.forEach(pet => {
    pet.adoptionHistory.forEach(adoption => {
      if (adoption.successfulAdoption !== null) {
        trainingData.push({
          petId: pet._id,
          userId: adoption.userId._id,
          userProfile: adoption.userId.adoptionProfile,
          petProfile: pet.compatibilityProfile,
          matchScore: adoption.matchScore,
          algorithmVersion: adoption.algorithmVersion,
          algorithmBreakdown: adoption.algorithmBreakdown,
          successfulAdoption: adoption.successfulAdoption,
          daysUntilReturn: adoption.daysUntilReturn,
          feedbackScore: adoption.userFeedbackScore,
          adoptionDate: adoption.adoptionDate,
          returnedDate: adoption.returnedDate
        });
      }
    });
  });
  
  return trainingData;
};

// Static: generate unique pet code using centralized generator
adoptionPetSchema.statics.generatePetCode = async function () {
  const PetCodeGenerator = require('../../../../core/utils/petCodeGenerator')
  return await PetCodeGenerator.generateUniquePetCode()
}

// Pre-save: assign petCode if missing
adoptionPetSchema.pre('save', async function (next) {
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
adoptionPetSchema.post('save', async function(doc) {
  try {
    // Only register if petCode exists
    if (doc.petCode) {
      const PetRegistry = require('../../../../core/models/PetRegistry');
      
      // Check if pet is already registered
      const existingRegistryEntry = await PetRegistry.findOne({ petCode: doc.petCode });
      if (!existingRegistryEntry) {
        // Register the pet in the centralized registry
        await PetRegistry.ensureRegistered({
          petCode: doc.petCode,
          name: doc.name,
          species: doc.species,
          breed: doc.breed,
          imageIds: doc.imageIds || [],
          source: 'adoption',
          adoptionPetId: doc._id,
          firstAddedSource: 'adoption_center',
          firstAddedBy: doc.createdBy,
          gender: doc.gender,
          dateOfBirth: doc.dateOfBirth,
          dobAccuracy: doc.dobAccuracy,
          color: doc.color
        }, {
          currentOwnerId: doc.adopterUserId,
          currentLocation: doc.status === 'adopted' ? 'at_owner' : 'at_adoption_center',
          currentStatus: doc.status
        });
      } else {
        // Update existing registry entry with current status
        await PetRegistry.updateOne(
          { petCode: doc.petCode },
          { 
            $set: { 
              currentOwnerId: doc.adopterUserId,
              currentLocation: doc.status === 'adopted' ? 'at_owner' : (doc.status === 'reserved' ? 'reserved_for_adoption' : 'at_adoption_center'),
              currentStatus: doc.status,
              lastSeenAt: new Date()
            }
          }
        );
      }
    }
  } catch (err) {
    console.warn('Failed to register/update adoption pet in PetRegistry:', err.message);
  }
});

// Pre-insertMany: assign codes for bulk inserts (e.g., CSV import)
adoptionPetSchema.pre('insertMany', async function (docs) {
  const Model = this.model ? this.model : this.constructor
  for (const doc of docs) {
    if (!doc.petCode) {
      // eslint-disable-next-line no-await-in-loop
      doc.petCode = await Model.generatePetCode()
    }
  }
})

// Post-insertMany: register pets in centralized registry
adoptionPetSchema.post('insertMany', async function(docs) {
  try {
    const PetRegistry = require('../../../../core/models/PetRegistry');
    
    // Register all inserted pets
    for (const doc of docs) {
      if (doc.petCode) {
        // Check if pet is already registered
        const existingRegistryEntry = await PetRegistry.findOne({ petCode: doc.petCode });
        if (!existingRegistryEntry) {
          await PetRegistry.ensureRegistered({
            petCode: doc.petCode,
            name: doc.name,
            species: doc.species,
            breed: doc.breed,
            imageIds: doc.imageIds || [],
            source: 'adoption',
            adoptionPetId: doc._id,
            firstAddedSource: 'adoption_center',
            firstAddedBy: doc.createdBy,
            gender: doc.gender,
            dateOfBirth: doc.dateOfBirth,
            dobAccuracy: doc.dobAccuracy,
            color: doc.color
          }, {
            currentOwnerId: doc.adopterUserId,
            currentLocation: doc.status === 'adopted' ? 'at_owner' : 'at_adoption_center',
            currentStatus: doc.status
          });
        } else {
          // Update existing registry entry with current status
          await PetRegistry.updateOne(
            { petCode: doc.petCode },
            { 
              $set: { 
                currentOwnerId: doc.adopterUserId,
                currentLocation: doc.status === 'adopted' ? 'at_owner' : (doc.status === 'reserved' ? 'reserved_for_adoption' : 'at_adoption_center'),
                currentStatus: doc.status,
                lastSeenAt: new Date()
              }
            }
          );
        }
      }
    }
  } catch (err) {
    console.warn('Failed to register/update adoption pets in PetRegistry:', err.message);
  }
})

module.exports = mongoose.model('AdoptionPet', adoptionPetSchema);
