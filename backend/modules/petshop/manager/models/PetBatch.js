const mongoose = require('mongoose');

const petBatchSchema = new mongoose.Schema({
  // Shop Reference
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetShop',
    required: [true, 'Shop ID is required'],
    index: true
  },

  // Stock Reference (optional, for linking to original stock)
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetStock',
    sparse: true
  },

  // Category (e.g., "puppies", "kittens", "exotic")
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },

  // Species and Breed (required)
  speciesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Species',
    required: [true, 'Species is required'],
    index: true
  },
  breedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Breed',
    required: [true, 'Breed is required'],
    index: true
  },

  // Age Range
  ageRange: {
    min: {
      type: Number,
      required: [true, 'Min age is required'],
      min: [0, 'Min age cannot be negative']
    },
    max: {
      type: Number,
      required: [true, 'Max age is required'],
      min: [0, 'Max age cannot be negative']
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years'],
      default: 'months'
    }
  },

  // Counts by Gender
  counts: {
    total: {
      type: Number,
      required: [true, 'Total count is required'],
      min: [1, 'Total count must be at least 1']
    },
    male: {
      type: Number,
      default: 0,
      min: [0, 'Male count cannot be negative']
    },
    female: {
      type: Number,
      default: 0,
      min: [0, 'Female count cannot be negative']
    },
    unknown: {
      type: Number,
      default: 0,
      min: [0, 'Unknown gender count cannot be negative']
    }
  },

  // Availability tracking (updated dynamically)
  availability: {
    available: {
      type: Number,
      default: function() {
        return this.counts?.total || 0;
      }
    },
    reserved: {
      type: Number,
      default: 0,
      min: [0, 'Reserved count cannot be negative']
    },
    sold: {
      type: Number,
      default: 0,
      min: [0, 'Sold count cannot be negative']
    }
  },

  // Sample Pets (small subset to display in listings)
  samplePets: [
    {
      petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PetInventoryItem'
      },
      name: String,
      petCode: String,
      gender: {
        type: String,
        enum: ['Male', 'Female', 'Unknown']
      },
      age: Number,
      ageUnit: String,
      imageIds: [mongoose.Schema.Types.ObjectId]
    }
  ],

  // Pricing
  price: {
    min: {
      type: Number,
      required: [true, 'Min price is required'],
      min: [0, 'Price cannot be negative']
    },
    max: {
      type: Number,
      required: [true, 'Max price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    basePrice: {
      type: Number,
      default: function() {
        return this.price?.min || 0;
      }
    }
  },

  // Images/Gallery
  images: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image'
    }
  ],

  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'sold_out', 'archived'],
    default: 'draft',
    index: true
  },

  // Additional Attributes
  attributes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Visibility & Metadata
  visibility: {
    type: String,
    enum: ['public', 'private', 'regional'],
    default: 'public'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Description
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },

  // Tags
  tags: [
    {
      type: String,
      trim: true,
      maxlength: [50, 'Tag cannot exceed 50 characters']
    }
  ],

  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Publishing info
  publishedAt: {
    type: Date
  },
  archivedAt: {
    type: Date
  },

  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  deletedAt: {
    type: Date,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
petBatchSchema.index({ shopId: 1, status: 1 });
petBatchSchema.index({ speciesId: 1, breedId: 1 });
petBatchSchema.index({ status: 1, createdAt: -1 });
petBatchSchema.index({ shopId: 1, createdAt: -1 });

// Virtual: Available counts by gender
petBatchSchema.virtual('availableByGender').get(function() {
  if (!this.counts) return { male: 0, female: 0, unknown: 0 };
  
  const sold = (this.availability?.sold || 0) + (this.availability?.reserved || 0);
  const totalAvailable = Math.max(0, this.counts.total - sold);
  
  // Proportionally distribute available count by original gender ratio
  const maleRatio = this.counts.total > 0 ? this.counts.male / this.counts.total : 0;
  const femaleRatio = this.counts.total > 0 ? this.counts.female / this.counts.total : 0;
  const unknownRatio = this.counts.total > 0 ? this.counts.unknown / this.counts.total : 0;
  
  return {
    male: Math.floor(totalAvailable * maleRatio),
    female: Math.floor(totalAvailable * femaleRatio),
    unknown: Math.ceil(totalAvailable * unknownRatio)
  };
});

// Virtual: Batch is fully sold out
petBatchSchema.virtual('isSoldOut').get(function() {
  return (this.availability?.sold || 0) >= (this.counts?.total || 0);
});

// Virtual: Percentage sold
petBatchSchema.virtual('soldPercentage').get(function() {
  const total = this.counts?.total || 0;
  const sold = this.availability?.sold || 0;
  return total > 0 ? Math.round((sold / total) * 100) : 0;
});

// Pre-save: validate counts match total
petBatchSchema.pre('save', function(next) {
  if (this.counts) {
    const sum = (this.counts.male || 0) + (this.counts.female || 0) + (this.counts.unknown || 0);
    if (sum > 0 && sum !== this.counts.total) {
      // Normalize total to sum of genders if not matching
      const diff = this.counts.total - sum;
      if (diff > 0) {
        this.counts.unknown += diff;
      } else if (diff < 0) {
        // Adjust male count to make up the difference
        this.counts.male += diff;
      }
    }
  }
  
  // Set availability.available based on counts
  if (this.counts && !this.availability) {
    this.availability = { available: this.counts.total, reserved: 0, sold: 0 };
  }
  
  next();
});

// Method: Reserve a pet from this batch
petBatchSchema.methods.reserve = function(count = 1) {
  this.availability.reserved = (this.availability.reserved || 0) + count;
  this.availability.available = Math.max(0, (this.counts.total) - (this.availability.reserved + this.availability.sold));
  return this.save();
};

// Method: Mark pet as sold
petBatchSchema.methods.markSold = function(count = 1) {
  this.availability.sold = (this.availability.sold || 0) + count;
  this.availability.available = Math.max(0, (this.counts.total) - (this.availability.reserved + this.availability.sold));
  
  if (this.isSoldOut) {
    this.status = 'sold_out';
  }
  
  return this.save();
};

// Method: Cancel reservation
petBatchSchema.methods.cancelReservation = function(count = 1) {
  this.availability.reserved = Math.max(0, (this.availability.reserved || 0) - count);
  this.availability.available = Math.max(0, (this.counts.total) - (this.availability.reserved + this.availability.sold));
  
  if (this.status === 'sold_out' && !this.isSoldOut) {
    this.status = 'published';
  }
  
  return this.save();
};

// Method: Publish batch (make visible to users)
petBatchSchema.methods.publish = function() {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

// Method: Archive batch
petBatchSchema.methods.archive = function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('PetBatch', petBatchSchema);
