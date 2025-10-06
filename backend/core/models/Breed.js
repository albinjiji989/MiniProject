const mongoose = require('mongoose');

const breedSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  speciesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Species',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  size: {
    type: String,
    enum: ['tiny', 'small', 'medium', 'large', 'giant']
  },
  temperament: [{
    type: String,
    trim: true
  }],
  groomingNeeds: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'moderate'
  },
  exerciseNeeds: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'moderate'
  },
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
breedSchema.virtual('species', {
  ref: 'Species',
  localField: 'speciesId',
  foreignField: '_id',
  justOne: true
});

// Virtual for pet count
breedSchema.virtual('petCount', {
  ref: 'Pet',
  localField: '_id',
  foreignField: 'breedId',
  count: true
});

// Compound index for unique breed per species
breedSchema.index({ name: 1, speciesId: 1 }, { unique: true });
breedSchema.index({ speciesId: 1 });
breedSchema.index({ isActive: 1 });
breedSchema.index({ createdBy: 1 });

// Pre-save middleware
breedSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  next();
});

// Static methods
breedSchema.statics.findBySpecies = function(speciesId) {
  return this.find({ speciesId, isActive: true }).sort({ name: 1 });
};

breedSchema.statics.findActive = function() {
  return this.find({ isActive: true }).populate('species', 'name displayName category').sort({ name: 1 });
};

breedSchema.statics.findByNameAndSpecies = function(name, speciesId) {
  return this.findOne({ name: name.trim(), speciesId });
};

// Instance methods
breedSchema.methods.softDelete = function(userId) {
  this.isActive = false;
  this.lastUpdatedBy = userId;
  return this.save();
};

module.exports = mongoose.model('Breed', breedSchema);
