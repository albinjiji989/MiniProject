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
  
  // Unique 5-digit Pet ID
  petId: {
    type: String,
    unique: true,
    required: false,
    validate: {
      validator: function(v) {
        return !v || /^\d{5}$/.test(v);
      },
      message: 'Pet ID must be a 5-digit number'
    }
  },
  
  // Unique pet identifier (same format as adoption/petshop: 3 letters + 5 digits)
  petCode: {
    type: String,
    validate: {
      validator: function(v) {
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
petSchema.index({ petId: 1 }, { unique: true, sparse: true });
petSchema.index({ petCode: 1 }, { unique: true, sparse: true });
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

// Virtual populate images
petSchema.virtual('images', {
  ref: 'Image',
  localField: 'imageIds',
  foreignField: '_id',
  justOne: false
});

// Virtual populate documents
petSchema.virtual('documents', {
  ref: 'Document',
  localField: 'documentIds',
  foreignField: '_id',
  justOne: false
});

// Pre-save middleware
petSchema.pre('save', async function(next) {
  console.log('💾 Saving PetNew document:', {
    name: this.name,
    age: this.age,
    gender: this.gender,
    speciesId: this.speciesId,
    breedId: this.breedId,
    ownerId: this.ownerId,
    imageIds: this.imageIds?.length || 0
  });
  
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  if (this.isModified('color')) {
    this.color = this.color.trim();
  }
  
  // Generate unique 5-digit petId if not provided
  if (!this.petId) {
    try {
      this.petId = await this.constructor.generatePetId();
    } catch (err) {
      console.error('Error generating petId for PetNew:', err);
      return next(err);
    }
  }
  
  // Generate unique petCode if not provided
  if (!this.petCode) {
    try {
      const PetCodeGenerator = require('../utils/petCodeGenerator');
      this.petCode = await PetCodeGenerator.generateUniquePetCode();
    } catch (err) {
      console.error('Error generating petCode for PetNew:', err);
      return next(err);
    }
  }
  
  next();
});

// Pre-insertMany: assign codes for bulk inserts
petSchema.pre('insertMany', async function(docs) {
  const PetCodeGenerator = require('../utils/petCodeGenerator');
  for (const doc of docs) {
    if (!doc.petCode) {
      // eslint-disable-next-line no-await-in-loop
      doc.petCode = await PetCodeGenerator.generateUniquePetCode();
    }
  }
});

// Static method to generate unique 5-digit petId
petSchema.statics.generatePetId = async function() {
  let petId;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate random 5-digit number
    petId = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Check if ID already exists
    const existingPet = await this.findOne({ petId, isActive: true });
    if (!existingPet) {
      isUnique = true;
    }
  }
  
  return petId;
};

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

// Instance methods for managing images
petSchema.methods.addImage = async function(imageData) {
  const Image = mongoose.model('Image');
  const image = new Image({
    ...imageData,
    entityType: 'PetNew',
    entityId: this._id
  });
  const savedImage = await image.save();
  this.imageIds.push(savedImage._id);
  return this.save();
};

petSchema.methods.removeImage = async function(imageId) {
  const Image = mongoose.model('Image');
  await Image.findByIdAndDelete(imageId);
  this.imageIds = this.imageIds.filter(id => id.toString() !== imageId.toString());
  return this.save();
};

// Instance methods for managing documents
petSchema.methods.addDocument = async function(documentData) {
  const Document = mongoose.model('Document');
  const document = new Document({
    ...documentData,
    entityType: 'PetNew',
    entityId: this._id
  });
  const savedDocument = await document.save();
  this.documentIds.push(savedDocument._id);
  return this.save();
};

petSchema.methods.removeDocument = async function(documentId) {
  const Document = mongoose.model('Document');
  await Document.findByIdAndDelete(documentId);
  this.documentIds = this.documentIds.filter(id => id.toString() !== documentId.toString());
  return this.save();
};

module.exports = mongoose.model('PetNew', petSchema);
