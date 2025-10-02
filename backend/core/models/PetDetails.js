const mongoose = require('mongoose');

const petDetailsSchema = new mongoose.Schema({
  speciesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Species',
    required: true
  },
  breedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Breed',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  ageRange: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    }
  },
  weightRange: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg'
    }
  },
  typicalLifespan: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['years', 'months'],
      default: 'years'
    }
  },
  vaccinationRequirements: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      required: true,
      min: 0
    },
    ageUnit: {
      type: String,
      enum: ['weeks', 'months', 'years'],
      default: 'weeks'
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  careInstructions: {
    feeding: {
      frequency: {
        type: String,
        enum: ['once', 'twice', 'thrice', 'multiple'],
        default: 'twice'
      },
      amount: {
        type: String,
        trim: true
      },
      notes: {
        type: String,
        trim: true
      }
    },
    exercise: {
      dailyMinutes: {
        type: Number,
        min: 0
      },
      type: {
        type: String,
        trim: true
      },
      notes: {
        type: String,
        trim: true
      }
    },
    grooming: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'as_needed'],
        default: 'weekly'
      },
      type: {
        type: String,
        trim: true
      },
      notes: {
        type: String,
        trim: true
      }
    }
  },
  temperament: [{
    type: String,
    trim: true
  }],
  specialNeeds: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for species info
petDetailsSchema.virtual('species', {
  ref: 'Species',
  localField: 'speciesId',
  foreignField: '_id',
  justOne: true
});

// Virtual for breed info
petDetailsSchema.virtual('breed', {
  ref: 'Breed',
  localField: 'breedId',
  foreignField: '_id',
  justOne: true
});

// Virtual for pet count
petDetailsSchema.virtual('petCount', {
  ref: 'Pet',
  localField: '_id',
  foreignField: 'petDetailsId',
  count: true
});

// Indexes
petDetailsSchema.index({ speciesId: 1, breedId: 1 });
petDetailsSchema.index({ isActive: 1 });
petDetailsSchema.index({ createdBy: 1 });
petDetailsSchema.index({ name: 1 });

// Pre-save middleware
petDetailsSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  if (this.isModified('color')) {
    this.color = this.color.trim();
  }
  next();
});

// Static methods
petDetailsSchema.statics.findBySpeciesAndBreed = function(speciesId, breedId) {
  return this.find({ speciesId, breedId, isActive: true }).populate('species breed');
};

petDetailsSchema.statics.findActive = function() {
  return this.find({ isActive: true }).populate('species breed').sort({ name: 1 });
};

petDetailsSchema.statics.findBySpecies = function(speciesId) {
  return this.find({ speciesId, isActive: true }).populate('species breed').sort({ name: 1 });
};

// Instance methods
petDetailsSchema.methods.softDelete = function(userId) {
  this.isActive = false;
  this.lastUpdatedBy = userId;
  return this.save();
};

module.exports = mongoose.model('PetDetails', petDetailsSchema);
