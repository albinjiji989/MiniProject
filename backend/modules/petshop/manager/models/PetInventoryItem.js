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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetShopStore',
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
petInventoryItemSchema.index({ name: 1 })
petInventoryItemSchema.index({ speciesId: 1 })
petInventoryItemSchema.index({ breedId: 1 })
petInventoryItemSchema.index({ status: 1 })
petInventoryItemSchema.index({ price: 1 })
petInventoryItemSchema.index({ storeId: 1 })
petInventoryItemSchema.index({ petCode: 1 }, { unique: true, sparse: true })
petInventoryItemSchema.index({ isActive: 1 })

// Virtual populate images
petInventoryItemSchema.virtual('images', {
  ref: 'Image',
  localField: 'imageIds',
  foreignField: '_id',
  justOne: false
})

// Virtual populate documents
petInventoryItemSchema.virtual('documents', {
  ref: 'Document',
  localField: 'documentIds',
  foreignField: '_id',
  justOne: false
})

// Generate unique petCode before saving
petInventoryItemSchema.pre('save', async function(next) {
  // Generate unique petCode if not provided
  if (!this.petCode) {
    try {
      this.petCode = await PetCodeGenerator.generateUniquePetCode();
    } catch (err) {
      console.error('Error generating petCode for PetInventoryItem:', err);
      return next(err);
    }
  }
  
  // Ensure name is trimmed and not empty
  if (this.isModified('name')) {
    this.name = (this.name || '').trim();
    if (!this.name) {
      this.name = 'Unnamed Pet';
    }
  }
  
  // Ensure color is trimmed
  if (this.isModified('color')) {
    this.color = (this.color || '').trim();
  }
  
  // Ensure description is trimmed
  if (this.isModified('description')) {
    this.description = (this.description || '').trim();
  }
  
  next();
})

// Validate required fields before saving
petInventoryItemSchema.pre('validate', function(next) {
  // Validate required fields
  if (!this.speciesId) {
    return next(new Error('Species is required'));
  }
  
  if (!this.breedId) {
    return next(new Error('Breed is required'));
  }
  
  if (this.price === undefined || this.price === null) {
    return next(new Error('Price is required'));
  }
  
  if (this.price < 0) {
    return next(new Error('Price cannot be negative'));
  }
  
  if (this.storeId === undefined || this.storeId === null) {
    return next(new Error('Store is required'));
  }
  
  next();
})

// Post-save hook to register in PetRegistry
petInventoryItemSchema.post('save', async function(doc) {
  try {
    // Register the pet in the centralized PetRegistry
    const PetRegistry = require('../../../../core/models/PetRegistry');
    const Species = require('../../../../core/models/Species');
    const Breed = require('../../../../core/models/Breed');
    
    // Get species and breed details
    const speciesDoc = await Species.findById(doc.speciesId);
    const breedDoc = await Breed.findById(doc.breedId);
    
    // Validate required data before registration
    if (!doc.petCode) {
      console.error(`❌ PetInventoryItem ${doc._id} missing petCode`);
      return;
    }
    
    if (!doc.speciesId || !speciesDoc) {
      console.error(`❌ PetInventoryItem ${doc._id} missing valid species`);
      return;
    }
    
    if (!doc.breedId || !breedDoc) {
      console.error(`❌ PetInventoryItem ${doc._id} missing valid breed`);
      return;
    }
    
    // Create registry entry with source tracking
    await PetRegistry.ensureRegistered({
      petCode: doc.petCode,
      name: doc.name || 'Unnamed Pet',
      species: speciesDoc?._id,
      breed: breedDoc?._id,
      imageIds: doc.imageIds || [],
      source: 'petshop',
      petShopItemId: doc._id,
      firstAddedSource: 'pet_shop',
      firstAddedBy: doc.createdBy
    }, {
      currentLocation: 'at_petshop',
      currentStatus: doc.status === 'available_for_sale' ? 'available' : 'in_petshop',
      lastTransferAt: new Date()
    });
    
    console.log(`✅ PetRegistry registered for PetInventoryItem: ${doc.petCode}`);
  } catch (error) {
    console.error(`❌ PetRegistry registration failed for PetInventoryItem ${doc.petCode}:`, error.message);
  }
});

// Static method to generate unique petCode
petInventoryItemSchema.statics.generatePetCode = async function() {
  return await PetCodeGenerator.generateUniquePetCode();
}

module.exports = mongoose.models.PetInventoryItem || mongoose.model('PetInventoryItem', petInventoryItemSchema)