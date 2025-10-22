const mongoose = require('mongoose');
const crypto = require('crypto');

const petInventoryItemSchema = new mongoose.Schema({
  storeId: { type: String, index: true },
  storeName: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Unique pet identifier (same format as adoption system: 3 letters + 5 digits)
  petCode: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^[A-Z]{3}\d{5}$/.test(v)
      },
      message: 'petCode must be 3 uppercase letters followed by 5 digits'
    }
  },

  // Classification (from admin master data)
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'PetCategory', required: true },
  speciesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Species', required: true },
  breedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Breed', required: true },

  // Basic attributes
  name: { type: String, trim: true },
  gender: { type: String, enum: ['Male', 'Female', 'Unknown'], default: 'Unknown' },
  age: { type: Number, min: 0, default: 0 },
  ageUnit: { type: String, enum: ['weeks', 'months', 'years'], default: 'months' },
  color: { type: String, trim: true },
  size: { type: String, enum: ['tiny', 'small', 'medium', 'large', 'giant'], default: 'medium' },

  // Special attributes for pricing
  specialAttributes: [{ type: String }], // e.g., ["champion bloodline", "rare color"]

  // Costs and pricing
  unitCost: { type: Number, min: 0, default: 0 },
  price: { type: Number, min: 0, default: 0 },
  calculatedPrice: { type: Number, min: 0, default: 0 }, // Auto-calculated from pricing rules
  pricingRuleId: { type: mongoose.Schema.Types.ObjectId, ref: 'PetPricing' },
  quantity: { type: Number, min: 0, default: 1 },

  // Status within petshop
  status: { type: String, enum: ['in_petshop', 'available_for_sale', 'reserved', 'out_of_stock', 'sold'], default: 'in_petshop', index: true },

  // Media (references to separate Image collection)
  imageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],

  // Health & documentation
  healthCertificateUrl: { type: String },
  vaccinations: [{
    name: { type: String, trim: true },
    date: { type: Date },
    certificateUrl: { type: String }
  }],

  // Stock & sale info
  source: { type: String, enum: ['Breeder', 'Rescue', 'Previous Owner', 'Other'], default: 'Other' },
  arrivalDate: { type: Date },

  // Physical & health info
  coatType: { type: String, trim: true },
  weight: { type: Number, min: 0 },
  height: { type: Number, min: 0 },
  sterilizationStatus: { type: String, enum: ['Neutered', 'Spayed', 'Not yet'], default: 'Not yet' },
  healthHistory: { type: String, trim: true },

  // SEO fields for public listings
  slug: { type: String, index: true, sparse: true },
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: [{ type: String }],
  views: { type: Number, default: 0 },

  // Relations
  purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PetShopPurchaseOrder' },
  notes: { type: String, trim: true },

  isActive: { type: Boolean, default: true },
  soldAt: { type: Date },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

petInventoryItemSchema.index({ speciesId: 1, breedId: 1, status: 1 })
petInventoryItemSchema.index({ petCode: 1 }, { unique: true, sparse: true })

// Virtual for populating images
petInventoryItemSchema.virtual('images', {
  ref: 'Image',
  localField: 'imageIds',
  foreignField: '_id',
  justOne: false
});

// Include virtuals in JSON/Object outputs
petInventoryItemSchema.set('toJSON', { virtuals: true })
petInventoryItemSchema.set('toObject', { virtuals: true })

// Pre-save: assign petCode if missing using centralized generator
petInventoryItemSchema.pre('save', async function(next) {
  try {
    if (!this.petCode) {
      console.log('Generating petCode for single item');
      const PetCodeGenerator = require('../../../core/utils/petCodeGenerator')
      this.petCode = await PetCodeGenerator.generateUniquePetCode()
      console.log('Generated petCode:', this.petCode);
    }
    next()
  } catch (err) {
    console.error('Error in pre-save hook:', err);
    next(err)
  }
})

// Pre-insertMany: assign codes for bulk inserts
petInventoryItemSchema.pre('insertMany', async function(next, docs) {
  try {
    // Ensure docs is an array
    if (!Array.isArray(docs)) {
      console.log('Docs is not an array:', typeof docs, docs);
      // If docs is not an array, it might be the second parameter
      // In Mongoose, insertMany hook signature can vary
      const args = Array.from(arguments);
      console.log('Arguments:', args);
      
      // Find the array in the arguments
      const docsArray = args.find(arg => Array.isArray(arg));
      if (!docsArray) {
        console.log('No array found in arguments, skipping petCode generation');
        return next();
      }
      
      docs = docsArray;
    }
    
    console.log('Generating petCodes for bulk insert, docs count:', docs.length);
    const PetCodeGenerator = require('../../../core/utils/petCodeGenerator')
    
    // Generate all codes first to avoid potential conflicts
    const codePromises = [];
    const docsNeedingCodes = [];
    
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      // Only generate codes for documents that don't already have one
      if (!doc.petCode) {
        docsNeedingCodes.push(doc);
        codePromises.push(PetCodeGenerator.generateUniquePetCode());
      }
    }
    
    if (codePromises.length > 0) {
      try {
        const codes = await Promise.all(codePromises);
        for (let i = 0; i < docsNeedingCodes.length; i++) {
          docsNeedingCodes[i].petCode = codes[i];
          console.log('Generated petCode for doc:', codes[i]);
        }
      } catch (codeErr) {
        console.error('Error generating pet codes:', codeErr);
        // If code generation fails, we'll let the individual save hooks handle it
        // But we should still throw the error to prevent data inconsistency
        return next(codeErr);
      }
    }
    
    next();
  } catch (err) {
    console.error('Error in pre-insertMany hook:', err);
    // Pass the error to next to prevent bulk insert with missing petCodes
    next(err);
  }
})

// Method to calculate price using pricing rules
petInventoryItemSchema.methods.calculatePriceFromRules = async function() {
  const PetPricing = require('./PetPricing');
  
  // Find applicable pricing rule
  const pricingRule = await PetPricing.findOne({
    categoryId: this.categoryId,
    speciesId: this.speciesId,
    breedId: this.breedId,
    storeId: this.storeId,
    isActive: true
  });
  
  if (pricingRule) {
    const petAttributes = {
      age: this.age,
      ageUnit: this.ageUnit,
      size: this.size,
      gender: this.gender,
      specialAttributes: this.specialAttributes
    };
    
    this.calculatedPrice = pricingRule.calculatePrice(petAttributes);
    this.pricingRuleId = pricingRule._id;
    
    // Use calculated price if no manual price is set
    if (!this.price || this.price === 0) {
      this.price = this.calculatedPrice;
    }
  }
  
  return this.calculatedPrice;
};

module.exports = mongoose.model('PetInventoryItem', petInventoryItemSchema)
