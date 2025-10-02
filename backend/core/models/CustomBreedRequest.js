const mongoose = require('mongoose');

const customBreedRequestSchema = new mongoose.Schema({
  // Request information
  requestType: {
    type: String,
    enum: ['species', 'breed'],
    required: true
  },
  
  // Species request (if requestType is 'species')
  speciesName: {
    type: String,
    trim: true
  },
  speciesDisplayName: {
    type: String,
    trim: true
  },
  speciesDescription: {
    type: String,
    trim: true
  },
  speciesIcon: {
    type: String,
    default: 'pets'
  },
  
  // Breed request (if requestType is 'breed')
  breedName: {
    type: String,
    trim: true
  },
  breedDescription: {
    type: String,
    trim: true
  },
  breedSize: {
    type: String,
    enum: ['tiny', 'small', 'medium', 'large', 'giant']
  },
  breedTemperament: [{
    type: String,
    trim: true
  }],
  breedGroomingNeeds: {
    type: String,
    enum: ['low', 'moderate', 'high']
  },
  breedExerciseNeeds: {
    type: String,
    enum: ['low', 'moderate', 'high']
  },
  
  // Reference to existing species (for breed requests)
  speciesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Species'
  },
  
  // Request details
  reason: {
    type: String,
    required: true,
    trim: true
  },
  additionalInfo: {
    type: String,
    trim: true
  },
  supportingDocuments: [{
    type: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status and approval
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  
  // References to created records (if approved)
  createdSpeciesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Species'
  },
  createdBreedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Breed'
  },
  
  // User and admin information
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  
  // Priority and categorization
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['new_species', 'new_breed', 'breed_variation', 'regional_breed', 'other'],
    default: 'other'
  },
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
customBreedRequestSchema.index({ requestType: 1 });
customBreedRequestSchema.index({ status: 1 });
customBreedRequestSchema.index({ requestedBy: 1 });
customBreedRequestSchema.index({ reviewedBy: 1 });
customBreedRequestSchema.index({ priority: 1 });
customBreedRequestSchema.index({ submittedAt: -1 });

// Virtual for requester info
customBreedRequestSchema.virtual('requester', {
  ref: 'User',
  localField: 'requestedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual for reviewer info
customBreedRequestSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual for created species
customBreedRequestSchema.virtual('createdSpecies', {
  ref: 'Species',
  localField: 'createdSpeciesId',
  foreignField: '_id',
  justOne: true
});

// Virtual for created breed
customBreedRequestSchema.virtual('createdBreed', {
  ref: 'Breed',
  localField: 'createdBreedId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
customBreedRequestSchema.pre('save', function(next) {
  if (this.isModified('speciesName')) {
    this.speciesName = this.speciesName?.toLowerCase().trim();
  }
  if (this.isModified('breedName')) {
    this.breedName = this.breedName?.trim();
  }
  next();
});

// Static methods
customBreedRequestSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('requester', 'name email').sort({ submittedAt: -1 });
};

customBreedRequestSchema.statics.findByRequester = function(userId) {
  return this.find({ requestedBy: userId }).populate('requester', 'name email').sort({ submittedAt: -1 });
};

customBreedRequestSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).populate('requester', 'name email').sort({ priority: -1, submittedAt: -1 });
};

customBreedRequestSchema.statics.findByType = function(requestType) {
  return this.find({ requestType }).populate('requester', 'name email').sort({ submittedAt: -1 });
};

// Instance methods
customBreedRequestSchema.methods.approve = function(adminId, notes = '') {
  this.status = 'approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.adminNotes = notes;
  return this.save();
};

customBreedRequestSchema.methods.reject = function(adminId, reason, notes = '') {
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  this.adminNotes = notes;
  return this.save();
};

customBreedRequestSchema.methods.markUnderReview = function(adminId) {
  this.status = 'under_review';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  return this.save();
};

customBreedRequestSchema.methods.setPriority = function(priority) {
  this.priority = priority;
  return this.save();
};

module.exports = mongoose.model('CustomBreedRequest', customBreedRequestSchema);
