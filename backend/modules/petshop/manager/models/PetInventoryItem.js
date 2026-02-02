const mongoose = require('mongoose')
const PetCodeGenerator = require('../../../../core/utils/petCodeGenerator')

const petInventoryItemSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Pet name is required'],
    trim: true,
    maxlength: [100, 'Pet name cannot exceed 100 characters']
  },
  petCode: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        return !v || /^[A-Z]{3}\d{5}$/.test(v)
      },
      message: 'Pet Code must be 3 uppercase letters followed by 5 digits'
    }
  },
  
  // Species and Breed Information
  speciesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Species',
    required: [true, 'Species is required']
  },
  breedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Breed',
    required: [true, 'Breed is required']
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
  dobAccuracy: {
    type: String,
    enum: ['exact', 'estimated'],
    default: 'estimated'
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  color: {
    type: String,
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
  
  // Description and Notes
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  specialNeeds: [{
    type: String,
    trim: true,
    maxlength: [100, 'Special need cannot exceed 100 characters']
  }],
  behaviorNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Behavior notes cannot exceed 1000 characters']
  },
  
  // Pricing Information
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative']
  },
  
  // Status and Availability
  status: {
    type: String,
    enum: ['in_petshop', 'available_for_sale', 'reserved', 'sold'],
    default: 'in_petshop'
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  
  // Sold information
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  soldAt: {
    type: Date
  },
  
  // Media and Documentation (references to separate collections)
  imageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  documentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  
  // Store Information
  storeId: {
    type: mongoose.Schema.Types.Mixed, // Accept both ObjectId and String (store codes like "PSP138250")
    ref: 'PetShop',
    required: true
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
  
  // Relationship to stock if generated from stock
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetStock',
    index: true,
    sparse: true
  },
  generatedFromStock: {
    type: Boolean,
    default: false
  },

  // Relationship to batch (new batch system)
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetBatch',
    index: true,
    sparse: true
  },

  // Batch reservation tracking
  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  reservedAt: {
    type: Date,
    sparse: true
  },
  reservationExpiresAt: {
    type: Date,
    sparse: true
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  confirmedAt: {
    type: Date,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Calculate age from dateOfBirth before saving
petInventoryItemSchema.pre('save', function(next) {
  // No need to calculate age anymore - it's derived from DOB dynamically
  next();
});

// Static: generate unique pet code using centralized generator
petInventoryItemSchema.statics.generatePetCode = async function() {
  const PetCodeGenerator = require('../../../../core/utils/petCodeGenerator')
  return await PetCodeGenerator.generateUniquePetCode()
}

// Pre-save: assign petCode if missing
petInventoryItemSchema.pre('save', async function(next) {
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
petInventoryItemSchema.post('save', async function(doc) {
  try {
    // Only register if petCode exists and this is a new document or has a relevant status
    if (doc.petCode && (doc.isNew || ['available_for_sale', 'in_petshop', 'sold'].includes(doc.status))) {
      const PetRegistry = require('../../../../core/models/PetRegistry');
      
      // Register the pet in the centralized registry
      await PetRegistry.ensureRegistered({
        petCode: doc.petCode,
        name: doc.name,
        species: doc.speciesId,
        breed: doc.breedId,
        images: doc.imageIds || [],
        source: 'petshop',
        petShopItemId: doc._id,
        actorUserId: doc.createdBy,
        firstAddedSource: 'pet_shop',
        firstAddedBy: doc.createdBy,
        gender: doc.gender,
        dateOfBirth: doc.dateOfBirth,
        dobAccuracy: doc.dobAccuracy,
        color: doc.color
      }, {
        currentOwnerId: doc.createdBy, // Pet shop manager who added it
        currentLocation: doc.status === 'sold' ? 'at_owner' : 'at_petshop',
        currentStatus: doc.status === 'available_for_sale' ? 'available' : doc.status
      });
      
      // Add to blockchain if this is a new pet
      if (doc.isNew) {
        try {
          const petshopBlockchainService = require('../../../core/services/petshopBlockchainService');
          await petshopBlockchainService.addBlock('pet_added', {
            petId: doc._id,
            petCode: doc.petCode,
            name: doc.name,
            species: doc.speciesId,
            breed: doc.breedId,
            gender: doc.gender,
            dateOfBirth: doc.dateOfBirth,
            price: doc.price,
            status: doc.status,
            storeId: doc.storeId,
            storeName: doc.storeName,
            createdBy: doc.createdBy,
            managedBy: doc.createdBy,
            timestamp: new Date()
          });
          console.log(`🔗 Blockchain: Pet ${doc.petCode} added to blockchain`);
        } catch (blockchainErr) {
          console.warn('⚠️  Blockchain logging failed:', blockchainErr.message);
        }
      }
    }
  } catch (err) {
    console.warn('Failed to register petshop item in PetRegistry:', err.message);
  }
});

// Pre-insertMany: assign codes for bulk inserts (e.g., CSV import)
petInventoryItemSchema.pre('insertMany', async function(docs) {
  const Model = this.model ? this.model : this.constructor
  for (const doc of docs) {
    if (!doc.petCode) {
      // eslint-disable-next-line no-await-in-loop
      doc.petCode = await Model.generatePetCode()
    }
  }
})

// Virtuals for populating images and documents
petInventoryItemSchema.virtual('images', {
  ref: 'Image',
  localField: 'imageIds',
  foreignField: '_id',
  justOne: false
});

petInventoryItemSchema.virtual('documents', {
  ref: 'Document',
  localField: 'documentIds',
  foreignField: '_id',
  justOne: false
});

// Virtual for age (backward compatibility)
petInventoryItemSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return 0;
  const ageCalc = require('../../../../core/utils/ageCalculator');
  return ageCalc.calculateAgeFromDOB(this.dateOfBirth, 'months');
});

petInventoryItemSchema.virtual('ageUnit').get(function () {
  return 'months'; // Default unit for backward compatibility
});

petInventoryItemSchema.virtual('ageDisplay').get(function () {
  if (!this.dateOfBirth) return 'Unknown';
  const ageCalc = require('../../../../core/utils/ageCalculator');
  return ageCalc.formatAge(this.dateOfBirth);
});

// Include virtuals in JSON/Object outputs
petInventoryItemSchema.set('toJSON', { virtuals: true })
petInventoryItemSchema.set('toObject', { virtuals: true })

// Indexes
petInventoryItemSchema.index({ name: 1 })
petInventoryItemSchema.index({ speciesId: 1 })
petInventoryItemSchema.index({ breedId: 1 })
petInventoryItemSchema.index({ status: 1 })
petInventoryItemSchema.index({ price: 1 })
petInventoryItemSchema.index({ storeId: 1 })
petInventoryItemSchema.index({ petCode: 1 }, { unique: true, sparse: true })
petInventoryItemSchema.index({ isActive: 1 })
petInventoryItemSchema.index({ dateOfBirth: 1 })

module.exports = mongoose.model('PetInventoryItem', petInventoryItemSchema);