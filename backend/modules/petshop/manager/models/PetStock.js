const mongoose = require('mongoose');

const petStockSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Stock name is required'],
    trim: true,
    maxlength: [100, 'Stock name cannot exceed 100 characters']
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
  
  // Physical Characteristics (shared across stock)
  dateOfBirth: {
    type: Date
  },
  dobAccuracy: {
    type: String,
    enum: ['exact', 'estimated'],
    default: 'estimated'
  },
  color: {
    type: String,
    trim: true,
    maxlength: [50, 'Color cannot exceed 50 characters']
  },
  size: {
    type: String,
    enum: ['tiny', 'small', 'medium', 'large', 'giant', ''],
    default: ''
  },
  
  // Gender-specific stock quantities
  maleCount: {
    type: Number,
    default: 0,
    min: [0, 'Count cannot be negative']
  },
  femaleCount: {
    type: Number,
    default: 0,
    min: [0, 'Count cannot be negative']
  },
  
  // Gender-specific images (only one image per gender needed for the entire stock)
  maleImageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  femaleImageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  
  // Status for stock release management
  isReleased: {
    type: Boolean,
    default: false
  },
  releasedAt: {
    type: Date
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
  
  // Track generated pets
  generatedPetIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetInventoryItem'
  }],
  totalGenerated: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Sanitize size field before saving
petStockSchema.pre('save', function(next) {
  // Convert empty string to null for size field
  if (this.size === '' || !this.size) {
    this.size = 'medium'; // Default to medium if not specified
  }
  next();
});

// Virtuals for populating images
petStockSchema.virtual('maleImages', {
  ref: 'Image',
  localField: 'maleImageIds',
  foreignField: '_id',
  justOne: false
});

petStockSchema.virtual('femaleImages', {
  ref: 'Image',
  localField: 'femaleImageIds',
  foreignField: '_id',
  justOne: false
});

// Virtual for age (backward compatibility)
petStockSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return 0;
  const ageCalc = require('../../../../core/utils/ageCalculator');
  return ageCalc.calculateAgeFromDOB(this.dateOfBirth, 'months');
});

petStockSchema.virtual('ageUnit').get(function () {
  return 'months'; // Default unit for backward compatibility
});

petStockSchema.virtual('ageDisplay').get(function () {
  if (!this.dateOfBirth) return 'Unknown';
  const ageCalc = require('../../../../core/utils/ageCalculator');
  return ageCalc.formatAge(this.dateOfBirth);
});

// Include virtuals in JSON/Object outputs
petStockSchema.set('toJSON', { virtuals: true });
petStockSchema.set('toObject', { virtuals: true });

// Instance method to add a generated pet to tracking
petStockSchema.methods.addGeneratedPet = function(petId) {
  if (!this.generatedPetIds) {
    this.generatedPetIds = [];
  }
  
  // Add pet ID to tracking array if not already present
  if (!this.generatedPetIds.includes(petId)) {
    this.generatedPetIds.push(petId);
    this.totalGenerated = this.generatedPetIds.length;
  }
  
  return this.save();
};

// Instance method to get all generated pets
petStockSchema.methods.getGeneratedPets = function() {
  return this.model('PetInventoryItem').find({
    _id: { $in: this.generatedPetIds }
  });
};

// Instance method to check if stock has been fully utilized
petStockSchema.methods.isFullyUtilized = function() {
  return this.maleCount === 0 && this.femaleCount === 0;
};

// Indexes
petStockSchema.index({ name: 1 });
petStockSchema.index({ speciesId: 1 });
petStockSchema.index({ breedId: 1 });
petStockSchema.index({ storeId: 1 });
petStockSchema.index({ isActive: 1 });

module.exports = mongoose.model('PetStock', petStockSchema);