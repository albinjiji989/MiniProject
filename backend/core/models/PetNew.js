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
    required: false,
    index: true
  },
  breedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Breed',
    required: false,
    index: true
  },
  
  // Individual pet specific information
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
  
  // Media and documentation
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  documents: [{
    type: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
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

// Indexes
petSchema.index({ ownerId: 1 });
petSchema.index({ petDetailsId: 1 });
petSchema.index({ speciesId: 1 });
petSchema.index({ breedId: 1 });
petSchema.index({ currentStatus: 1 });
petSchema.index({ healthStatus: 1 });
// Create a partial 2dsphere index only when coordinates exist to avoid insertion errors
petSchema.index(
  { location: '2dsphere' },
  { partialFilterExpression: { 'location.coordinates': { $type: 'array' } } }
);
petSchema.index({ tags: 1 });
petSchema.index({ createdBy: 1 });
petSchema.index({ isActive: 1 });
petSchema.index({ 'customBreedInfo.isPendingApproval': 1 });

// Virtual for owner info
petSchema.virtual('owner', {
  ref: 'User',
  localField: 'ownerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for creator info
petSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Virtual for pet details
petSchema.virtual('petDetails', {
  ref: 'PetDetails',
  localField: 'petDetailsId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
petSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  if (this.isModified('color')) {
    this.color = this.color.trim();
  }
  next();
});

// Static methods
petSchema.statics.findByOwner = function(ownerId) {
  return this.find({ ownerId, isActive: true })
    .populate('owner', 'name email phone')
    .populate('petDetails', 'name species breed')
    .populate('petDetails.species', 'displayName')
    .populate('petDetails.breed', 'name');
};

petSchema.statics.findByStatus = function(status) {
  return this.find({ currentStatus: status, isActive: true })
    .populate('owner', 'name email phone')
    .populate('petDetails', 'name species breed')
    .populate('petDetails.species', 'displayName')
    .populate('petDetails.breed', 'name');
};

petSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true
  })
  .populate('owner', 'name email phone')
  .populate('petDetails', 'name species breed')
  .populate('petDetails.species', 'displayName')
  .populate('petDetails.breed', 'name');
};

petSchema.statics.findBySpeciesAndBreed = function(speciesId, breedId) {
  return this.find({ 
    'petDetails.speciesId': speciesId, 
    'petDetails.breedId': breedId,
    isActive: true 
  })
  .populate('owner', 'name email phone')
  .populate('petDetails', 'name species breed')
  .populate('petDetails.species', 'displayName')
  .populate('petDetails.breed', 'name');
};

// Instance methods
petSchema.methods.updateStatus = function(newStatus, userId) {
  this.currentStatus = newStatus;
  this.lastUpdatedBy = userId;
  return this.save();
};

petSchema.methods.addOwnershipRecord = function(ownerId, ownerName, reason, notes = '') {
  this.ownershipHistory.push({
    ownerId,
    ownerName,
    startDate: new Date(),
    reason,
    notes
  });
  return this.save();
};

petSchema.methods.addMedicalRecord = function(type, description, veterinarian = '', cost = 0) {
  this.medicalHistory.push({
    date: new Date(),
    type,
    description,
    veterinarian,
    cost
  });
  return this.save();
};

petSchema.methods.addVaccination = function(name, date, nextDue = null, veterinarian = '', certificate = '') {
  this.vaccinations.push({
    name,
    date,
    nextDue,
    veterinarian,
    certificate
  });
  return this.save();
};

petSchema.methods.softDelete = function(userId) {
  this.isActive = false;
  this.deletedAt = new Date();
  this.lastUpdatedBy = userId;
  return this.save();
};

module.exports = mongoose.model('PetNew', petSchema);
