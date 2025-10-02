const mongoose = require('mongoose');

const petPricingSchema = new mongoose.Schema({
  storeId: { type: String, index: true },
  storeName: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Classification for pricing
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'PetCategory', required: true },
  speciesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Species', required: true },
  breedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Breed', required: true },

  // Pricing structure
  basePrice: { type: Number, min: 0, required: true },
  
  // Age-based pricing multipliers
  agePricing: {
    puppy: { type: Number, default: 1.2 }, // 0-6 months
    young: { type: Number, default: 1.0 },  // 6-24 months
    adult: { type: Number, default: 0.8 },  // 2+ years
  },

  // Size-based pricing multipliers
  sizePricing: {
    tiny: { type: Number, default: 1.1 },
    small: { type: Number, default: 1.0 },
    medium: { type: Number, default: 1.2 },
    large: { type: Number, default: 1.4 },
    giant: { type: Number, default: 1.6 }
  },

  // Gender-based pricing
  genderPricing: {
    male: { type: Number, default: 1.0 },
    female: { type: Number, default: 1.1 }
  },

  // Special attributes pricing
  specialAttributes: [{
    name: { type: String }, // e.g., "champion bloodline", "rare color"
    multiplier: { type: Number, default: 1.0 }
  }],

  // Seasonal pricing
  seasonalPricing: {
    enabled: { type: Boolean, default: false },
    highSeason: {
      months: [{ type: Number }], // [11, 12, 1, 2] for winter holidays
      multiplier: { type: Number, default: 1.3 }
    },
    lowSeason: {
      months: [{ type: Number }], // [6, 7, 8] for summer
      multiplier: { type: Number, default: 0.9 }
    }
  },

  // Minimum and maximum price limits
  minPrice: { type: Number, min: 0 },
  maxPrice: { type: Number, min: 0 },

  isActive: { type: Boolean, default: true },
  notes: { type: String, trim: true }
}, { timestamps: true });

// Compound indexes for efficient queries
petPricingSchema.index({ categoryId: 1, speciesId: 1, breedId: 1, storeId: 1 });
petPricingSchema.index({ storeId: 1, isActive: 1 });

// Method to calculate price for a specific pet
petPricingSchema.methods.calculatePrice = function(petAttributes = {}) {
  let finalPrice = this.basePrice;
  
  // Apply age multiplier
  if (petAttributes.age !== undefined && petAttributes.ageUnit) {
    const ageInMonths = petAttributes.ageUnit === 'years' ? 
      petAttributes.age * 12 : 
      petAttributes.ageUnit === 'weeks' ? 
        petAttributes.age / 4 : 
        petAttributes.age;
    
    if (ageInMonths <= 6) {
      finalPrice *= this.agePricing.puppy;
    } else if (ageInMonths <= 24) {
      finalPrice *= this.agePricing.young;
    } else {
      finalPrice *= this.agePricing.adult;
    }
  }
  
  // Apply size multiplier
  if (petAttributes.size && this.sizePricing[petAttributes.size]) {
    finalPrice *= this.sizePricing[petAttributes.size];
  }
  
  // Apply gender multiplier
  if (petAttributes.gender && petAttributes.gender.toLowerCase() === 'female') {
    finalPrice *= this.genderPricing.female;
  } else {
    finalPrice *= this.genderPricing.male;
  }
  
  // Apply special attributes
  if (petAttributes.specialAttributes && Array.isArray(petAttributes.specialAttributes)) {
    petAttributes.specialAttributes.forEach(attr => {
      const specialAttr = this.specialAttributes.find(sa => sa.name === attr);
      if (specialAttr) {
        finalPrice *= specialAttr.multiplier;
      }
    });
  }
  
  // Apply seasonal pricing
  if (this.seasonalPricing.enabled) {
    const currentMonth = new Date().getMonth() + 1;
    if (this.seasonalPricing.highSeason.months.includes(currentMonth)) {
      finalPrice *= this.seasonalPricing.highSeason.multiplier;
    } else if (this.seasonalPricing.lowSeason.months.includes(currentMonth)) {
      finalPrice *= this.seasonalPricing.lowSeason.multiplier;
    }
  }
  
  // Apply min/max limits
  if (this.minPrice && finalPrice < this.minPrice) {
    finalPrice = this.minPrice;
  }
  if (this.maxPrice && finalPrice > this.maxPrice) {
    finalPrice = this.maxPrice;
  }
  
  return Math.round(finalPrice);
};

module.exports = mongoose.model('PetPricing', petPricingSchema);
