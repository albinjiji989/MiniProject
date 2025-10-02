const mongoose = require('mongoose');

const speciesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  icon: {
    type: String,
    default: 'pets'
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

// Virtual for breed count
speciesSchema.virtual('breedCount', {
  ref: 'Breed',
  localField: '_id',
  foreignField: 'speciesId',
  count: true
});

// Indexes
speciesSchema.index({ name: 1 });
speciesSchema.index({ isActive: 1 });
speciesSchema.index({ createdBy: 1 });

// Pre-save middleware
speciesSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.toLowerCase().trim();
  }
  next();
});

// Static methods
speciesSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ displayName: 1 });
};

speciesSchema.statics.findByName = function(name) {
  return this.findOne({ name: name.toLowerCase().trim() });
};

// Instance methods
speciesSchema.methods.softDelete = function(userId) {
  this.isActive = false;
  this.lastUpdatedBy = userId;
  return this.save();
};

module.exports = mongoose.model('Species', speciesSchema);
