const mongoose = require('mongoose');

/**
 * Center Pricing Model
 * Defines pricing structure for each Temporary Care Center
 * Allows per-pet-type and per-size pricing
 */

const centerPricingSchema = new mongoose.Schema({
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TemporaryCareCenter',
    required: true,
    index: true
  },
  
  // Per pet type pricing (e.g., Dog, Cat, Bird)
  petTypeRates: [{
    petType: { type: String, required: true }, // e.g., 'Dog', 'Cat', 'Bird', 'Rabbit'
    baseRatePerDay: { type: Number, required: true, min: 0 },
    sizeBasedRates: {
      small: { type: Number, min: 0 },      // e.g., < 10 kg
      medium: { type: Number, min: 0 },     // e.g., 10-25 kg
      large: { type: Number, min: 0 },      // e.g., 25-50 kg
      extra_large: { type: Number, min: 0 } // e.g., > 50 kg
    }
  }],
  
  // Special care add-ons
  specialCareAddons: [{
    name: { type: String, required: true }, // e.g., 'Medical Care', 'Special Diet', 'Grooming'
    description: { type: String },
    ratePerDay: { type: Number, min: 0 },
    isPercentage: { type: Boolean, default: false }, // If true, ratePerDay is percentage of base rate
    applicableTo: [{ type: String }] // Pet types this applies to (empty = all)
  }],
  
  // Additional charges
  additionalCharges: [{
    name: { type: String, required: true }, // e.g., 'Pickup Service', 'Late Checkout'
    description: { type: String },
    amount: { type: Number, required: true, min: 0 },
    isPercentage: { type: Boolean, default: false },
    applicableTo: [{ type: String }]
  }],
  
  // Tax configuration
  tax: {
    percentage: { type: Number, default: 18, min: 0, max: 100 }, // GST
    applicableTo: { type: String, enum: ['all', 'base', 'base_and_addons'], default: 'all' }
  },
  
  // Discount configuration
  discountConfig: {
    earlyBookingDiscount: {
      enabled: { type: Boolean, default: false },
      daysInAdvance: { type: Number, default: 7 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    longStayDiscount: {
      enabled: { type: Boolean, default: false },
      minDays: { type: Number, default: 7 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    multiplePetsDiscount: {
      enabled: { type: Boolean, default: false },
      minPets: { type: Number, default: 2 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    }
  },
  
  // Advance payment percentage
  advancePercentage: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  
  // Pricing last updated
  lastUpdatedAt: { type: Date, default: Date.now },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Active status
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
centerPricingSchema.index({ centerId: 1, isActive: 1 });

// Method to get rate for a pet
centerPricingSchema.methods.getRateForPet = function(petType, petSize = null) {
  const petTypeRate = this.petTypeRates.find(rate => 
    rate.petType.toLowerCase() === petType.toLowerCase()
  );
  
  if (!petTypeRate) {
    // Fallback: use first available rate or 0
    return this.petTypeRates.length > 0 ? this.petTypeRates[0].baseRatePerDay : 0;
  }
  
  // If size is specified and size-based rate exists, use it
  if (petSize && petTypeRate.sizeBasedRates && petTypeRate.sizeBasedRates[petSize]) {
    return petTypeRate.sizeBasedRates[petSize];
  }
  
  return petTypeRate.baseRatePerDay;
};

module.exports = mongoose.model('CenterPricing', centerPricingSchema);
