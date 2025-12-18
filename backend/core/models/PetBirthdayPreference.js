const mongoose = require('mongoose');

const petBirthdayPreferenceSchema = new mongoose.Schema({
  // Reference to the pet (can be any pet model)
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true
  },
  
  // Reference to the pet model type
  petModel: {
    type: String,
    enum: ['Pet', 'PetNew', 'AdoptionPet', 'PetInventoryItem'],
    required: true
  },
  
  // The pet's current age when the preference was set
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
  
  // User's preferred birthday (day of month)
  preferredBirthday: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },
  
  // Calculated actual birth date
  calculatedBirthDate: {
    type: Date,
    required: true
  },
  
  // Whether the pet's age should be automatically updated
  autoUpdateEnabled: {
    type: Boolean,
    default: true
  },
  
  // User who owns this pet
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
petBirthdayPreferenceSchema.index({ petId: 1 });
petBirthdayPreferenceSchema.index({ ownerId: 1 });
petBirthdayPreferenceSchema.index({ autoUpdateEnabled: 1 });
petBirthdayPreferenceSchema.index({ petModel: 1 });

// Update the updatedAt field before saving
petBirthdayPreferenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PetBirthdayPreference', petBirthdayPreferenceSchema);