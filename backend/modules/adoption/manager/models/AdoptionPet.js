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

// Calculate age from dateOfBirth before saving
adoptionPetSchema.pre('save', function (next) {
  // No need to calculate age anymore - it's derived from DOB dynamically
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
