const mongoose = require('mongoose');

const PetSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Pet name is required'],
    trim: true,
    maxlength: [100, 'Pet name cannot exceed 100 characters']
  },
  
  // Species and Breed Information
  species: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Species',
    required: [true, 'Species is required']
  },
  breed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Breed',
    required: [true, 'Breed is required']
  },
  petDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetDetails',
    required: false
  },
  
  // Owner Information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Pet owner is required']
  },
  
  // Custom Breed/Species Information (for pending approval)
  customBreedName: {
    type: String,
    trim: true,
    maxlength: [100, 'Custom breed name cannot exceed 100 characters']
  },
  customSpeciesName: {
    type: String,
    trim: true,
    maxlength: [100, 'Custom species name cannot exceed 100 characters']
  },
  customBreedRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomBreedRequest'
  },
  
  // Physical Characteristics
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Unknown'],
    default: 'Unknown'
  },
  dateOfBirth: {
    type: Date
  },
  age: {
    type: Number,
    min: [0, 'Age cannot be negative']
  },
  ageUnit: {
    type: String,
    enum: ['weeks', 'months', 'years'],
    default: 'months'
  },
  color: {
    type: String,
    required: false,
    trim: true,
    maxlength: [50, 'Color cannot exceed 50 characters']
  },
  weight: {
    value: {
      type: Number,
      min: [0, 'Weight cannot be negative']
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs', 'g'],
      default: 'kg'
    }
  },
  size: {
    type: String,
    enum: ['tiny', 'small', 'medium', 'large', 'giant'],
    default: 'medium'
  },
  
  // Status and Health
  currentStatus: {
    type: String,
    enum: ['Available', 'Adopted', 'Reserved', 'Under Treatment', 'Deceased', 'Fostered', 'in_petshop', 'available_for_sale', 'sold'],
    default: 'Available'
  },
  healthStatus: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'],
    default: 'Good'
  },
  isAdoptionReady: {
    type: Boolean,
    default: true
  },
  adoptionFee: {
    type: Number,
    min: [0, 'Adoption fee cannot be negative'],
    default: 0
  },
  
  // Location Information
  location: {
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [50, 'Country cannot exceed 50 characters']
    }
  },
  
  // Unique Pet ID (5-digit number)
  petId: {
    type: String,
    unique: true,
    required: false,
    validate: {
      validator: function(v) {
        return /^\d{5}$/.test(v);
      },
      message: 'Pet ID must be a 5-digit number'
    }
  },
  // Universal human-friendly Pet Code (3 letters + 5 digits)
  petCode: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^[A-Z]{3}\d{5}$/.test(v)
      },
      message: 'Pet Code must be 3 uppercase letters followed by 5 digits'
    }
  },
  // Medical Information (references to separate MedicalRecord model)
  // Medical records are stored in MedicalRecord collection
  
  // Behavioral Information
  temperament: [{
    type: String,
    enum: [
      'Friendly', 'Intelligent', 'Loyal', 'Active', 'Calm', 'Gentle',
      'Playful', 'Energetic', 'Quiet', 'Social', 'Independent', 'Curious',
      'Confident', 'Courageous', 'Outgoing', 'Adaptable', 'Sweet', 'Docile',
      'Alert', 'Vocal', 'Mischievous', 'Spunky', 'Merry', 'Dignified'
    ]
  }],
  behaviorNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Behavior notes cannot exceed 1000 characters']
  },
  specialNeeds: [{
    type: String,
    trim: true,
    maxlength: [100, 'Special need cannot exceed 100 characters']
  }],
  adoptionRequirements: [{
    type: String,
    trim: true,
    maxlength: [200, 'Adoption requirement cannot exceed 200 characters']
  }],
  
  // Media and Documentation
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: {
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
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['Medical Record', 'Certificate', 'License', 'Other']
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Ownership History (references to separate OwnershipHistory model)
  // Ownership transfers are stored in OwnershipHistory collection
  
  // Store Information (for e-commerce integration)
  storeId: {
    type: String,
    trim: true
  },
  storeName: {
    type: String,
    trim: true
  },
  
  // Tags and Categorization
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // Description
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
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
PetSchema.index({ name: 1 });
PetSchema.index({ species: 1 });
PetSchema.index({ breed: 1 });
PetSchema.index({ owner: 1 });
PetSchema.index({ currentStatus: 1 });
PetSchema.index({ healthStatus: 1 });
PetSchema.index({ microchipId: 1 });
PetSchema.index({ petCode: 1 }, { unique: true, sparse: true });
PetSchema.index({ isActive: 1 });
PetSchema.index({ createdAt: -1 });

// Virtual for age in months
PetSchema.virtual('ageInMonths').get(function() {
  if (this.age && this.ageUnit) {
    switch (this.ageUnit) {
      case 'weeks':
        return Math.floor(this.age / 4);
      case 'months':
        return this.age;
      case 'years':
        return this.age * 12;
      default:
        return this.age;
    }
  }
  return 0;
});

// Virtual for full address
PetSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.location.address) parts.push(this.location.address);
  if (this.location.city) parts.push(this.location.city);
  if (this.location.state) parts.push(this.location.state);
  if (this.location.country) parts.push(this.location.country);
  return parts.join(', ');
});

// Generate unique 5-digit pet ID
PetSchema.statics.generatePetId = async function() {
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

// Generate unique petCode using centralized generator
PetSchema.statics.generatePetCode = async function() {
  const PetCodeGenerator = require('../../utils/petCodeGenerator')
  return await PetCodeGenerator.generateUniquePetCode()
}

// Pre-save middleware
PetSchema.pre('save', async function(next) {
  // Generate unique pet ID if not provided
  if (!this.petId) {
    this.petId = await this.constructor.generatePetId();
  }
  // Generate universal petCode if not provided
  if (!this.petCode) {
    this.petCode = await this.constructor.generatePetCode();
  }
  
  // Calculate age from date of birth if not provided
  if (this.dateOfBirth && !this.age) {
    const now = new Date();
    const birthDate = new Date(this.dateOfBirth);
    const diffTime = Math.abs(now - birthDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      this.age = Math.floor(diffDays / 7);
      this.ageUnit = 'weeks';
    } else if (diffDays < 365) {
      this.age = Math.floor(diffDays / 30);
      this.ageUnit = 'months';
    } else {
      this.age = Math.floor(diffDays / 365);
      this.ageUnit = 'years';
    }
  }
  
  // Ensure only one primary image
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    }
  }
  
  next();
});

// Pre-insertMany to assign petCode for bulk operations
PetSchema.pre('insertMany', async function(docs) {
  for (const doc of docs) {
    if (!doc.petId) {
      // eslint-disable-next-line no-await-in-loop
      doc.petId = await this.constructor.generatePetId()
    }
    if (!doc.petCode) {
      // eslint-disable-next-line no-await-in-loop
      doc.petCode = await this.constructor.generatePetCode()
    }
  }
})

// Static methods
PetSchema.statics.findByStatus = function(status) {
  return this.find({ currentStatus: status, isActive: true });
};

PetSchema.statics.findBySpecies = function(speciesId) {
  return this.find({ species: speciesId, isActive: true });
};

PetSchema.statics.findByBreed = function(breedId) {
  return this.find({ breed: breedId, isActive: true });
};

PetSchema.statics.findByOwner = function(ownerId) {
  return this.find({ owner: ownerId, isActive: true });
};

PetSchema.statics.findAvailable = function() {
  return this.find({ currentStatus: 'Available', isActive: true });
};

PetSchema.statics.findAdopted = function() {
  return this.find({ currentStatus: 'Adopted', isActive: true });
};

// Instance methods

PetSchema.methods.addImage = function(image) {
  this.images.push(image);
  return this.save();
};

PetSchema.methods.addDocument = function(document) {
  this.documents.push(document);
  return this.save();
};


PetSchema.methods.softDelete = function() {
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

PetSchema.methods.restore = function() {
  this.isActive = true;
  this.deletedAt = undefined;
  return this.save();
};

module.exports = mongoose.model('Pet', PetSchema);