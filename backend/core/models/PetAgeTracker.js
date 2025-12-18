const mongoose = require('mongoose');

/**
 * Pet Age Tracker Model
 * Centralized system for tracking and calculating pet ages across all modules
 */
const petAgeTrackerSchema = new mongoose.Schema({
  // Reference to the pet in the central registry
  petCode: {
    type: String,
    required: true,
    unique: true,
    ref: 'PetRegistry'
  },
  
  // Initial age when pet was registered
  initialAge: {
    value: { 
      type: Number, 
      required: true,
      min: 0
    },
    unit: { 
      type: String, 
      enum: ['days', 'weeks', 'months', 'years'], 
      required: true 
    }
  },
  
  // Birth date if known (more accurate than initial age)
  birthDate: {
    type: Date
  },
  
  // Current calculated age
  currentAge: {
    value: { 
      type: Number, 
      required: true,
      min: 0
    },
    unit: { 
      type: String, 
      enum: ['days', 'weeks', 'months', 'years'], 
      required: true 
    }
  },
  
  // When the age was last calculated/updated
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  
  // Method used for age calculation
  calculationMethod: {
    type: String,
    enum: ['manual', 'birthdate'],
    default: 'manual'
  },
  
  // System fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
petAgeTrackerSchema.index({ petCode: 1 });
petAgeTrackerSchema.index({ birthDate: 1 });
petAgeTrackerSchema.index({ lastCalculated: 1 });

// Pre-save hook to update timestamps
petAgeTrackerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to calculate current age
petAgeTrackerSchema.methods.calculateCurrentAge = function() {
  const now = new Date();
  
  if (this.calculationMethod === 'birthdate' && this.birthDate) {
    // Calculate based on birth date
    const diff = now - this.birthDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Convert to appropriate units
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30.44); // Average days in a month
    const years = Math.floor(days / 365.25); // Account for leap years
    
    // Return the most appropriate unit based on age
    if (days < 30) {
      return { value: days, unit: 'days' };
    } else if (months < 24) {
      return { value: months, unit: 'months' };
    } else {
      return { value: years, unit: 'years' };
    }
  } else {
    // Calculate based on initial age and time passed
    const daysSinceRegistration = Math.floor((now - this.lastCalculated) / (1000 * 60 * 60 * 24));
    
    // Convert initial age to days for calculation
    let initialDays = 0;
    switch (this.initialAge.unit) {
      case 'days':
        initialDays = this.initialAge.value;
        break;
      case 'weeks':
        initialDays = this.initialAge.value * 7;
        break;
      case 'months':
        initialDays = this.initialAge.value * 30.44;
        break;
      case 'years':
        initialDays = this.initialAge.value * 365.25;
        break;
    }
    
    const totalDays = initialDays + daysSinceRegistration;
    
    // Convert back to appropriate units
    if (totalDays < 30) {
      return { value: Math.floor(totalDays), unit: 'days' };
    } else if (totalDays < 730) { // Less than 2 years
      return { value: Math.floor(totalDays / 30.44), unit: 'months' };
    } else {
      return { value: Math.floor(totalDays / 365.25), unit: 'years' };
    }
  }
};

// Static method to update all pet ages
petAgeTrackerSchema.statics.updateAllAges = async function() {
  const trackers = await this.find({});
  const updatedTrackers = [];
  
  for (const tracker of trackers) {
    const currentAge = tracker.calculateCurrentAge();
    tracker.currentAge = currentAge;
    tracker.lastCalculated = new Date();
    await tracker.save();
    updatedTrackers.push(tracker);
  }
  
  return updatedTrackers;
};

module.exports = mongoose.model('PetAgeTracker', petAgeTrackerSchema);