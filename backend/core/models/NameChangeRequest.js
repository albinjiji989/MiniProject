const mongoose = require('mongoose');

const nameChangeRequestSchema = new mongoose.Schema({
  // Pet information
  petCode: {
    type: String,
    required: true,
    validate: {
      validator: v => /^[A-Z]{3}\d{5}$/.test(v),
      message: 'petCode must be 3 uppercase letters followed by 5 digits'
    }
  },
  petRegistryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetRegistry'
  },
  
  // Names
  currentName: {
    type: String,
    required: true,
    trim: true
  },
  requestedName: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  // Request details
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  
  // Requester (pet owner)
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Admin action
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  
  // Pet details snapshot (for admin reference)
  petSnapshot: {
    species: String,
    breed: String,
    gender: String,
    source: String,
    currentLocation: String,
    images: [String]
  }
}, {
  timestamps: true
});

// Indexes
nameChangeRequestSchema.index({ petCode: 1 });
nameChangeRequestSchema.index({ requestedBy: 1 });
nameChangeRequestSchema.index({ status: 1 });
nameChangeRequestSchema.index({ createdAt: -1 });

// Prevent duplicate pending requests for the same pet by the same user
nameChangeRequestSchema.index(
  { petCode: 1, requestedBy: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

module.exports = mongoose.model('NameChangeRequest', nameChangeRequestSchema);
