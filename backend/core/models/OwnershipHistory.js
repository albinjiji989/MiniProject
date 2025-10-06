const mongoose = require('mongoose');

const OwnershipHistorySchema = new mongoose.Schema({
  // Pet Reference
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: [true, 'Pet reference is required']
  },
  
  // Previous Owner Information (optional for first-time ownership)
  previousOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  // New Owner Information
  newOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'New owner is required']
  },
  
  // Transfer Information
  transferDate: {
    type: Date,
    required: [true, 'Transfer date is required'],
    default: Date.now
  },
  
  transferType: {
    type: String,
    required: [true, 'Transfer type is required'],
    enum: ['Adoption', 'Sale', 'Gift', 'Return', 'Foster', 'Rescue', 'Reclaim', 'Other']
  },
  
  reason: {
    type: String,
    required: [true, 'Transfer reason is required'],
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  
  // Financial Information
  transferFee: {
    amount: {
      type: Number,
      min: [0, 'Transfer fee cannot be negative'],
      default: 0
    },
    currency: {
      type: String,
      default: 'USD',
      maxlength: [3, 'Currency code cannot exceed 3 characters']
    },
    paid: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'Bank Transfer', 'Check', 'Other'],
      default: 'Cash'
    }
  },
  
  // Legal Information
  contractNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Contract number cannot exceed 100 characters']
  },
  
  contractDate: {
    type: Date
  },
  
  contractExpiry: {
    type: Date
  },
  
  // Documents
  documents: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['Contract', 'Certificate', 'Receipt', 'Health Certificate', 'Other']
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Conditions and Terms
  conditions: [{
    type: String,
    trim: true,
    maxlength: [200, 'Condition cannot exceed 200 characters']
  }],
  
  // Special Instructions
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [1000, 'Special instructions cannot exceed 1000 characters']
  },
  
  // Follow-up Information
  followUpRequired: {
    type: Boolean,
    default: false
  },
  
  followUpDate: {
    type: Date
  },
  
  followUpNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Follow-up notes cannot exceed 500 characters']
  },
  
  // Status
  status: {
    type: String,
    enum: ['Completed', 'Pending', 'Cancelled', 'Disputed'],
    default: 'Completed'
  },
  
  // Additional Notes
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
OwnershipHistorySchema.index({ pet: 1 });
OwnershipHistorySchema.index({ previousOwner: 1 });
OwnershipHistorySchema.index({ newOwner: 1 });
OwnershipHistorySchema.index({ transferDate: -1 });
OwnershipHistorySchema.index({ transferType: 1 });
OwnershipHistorySchema.index({ status: 1 });
OwnershipHistorySchema.index({ isActive: 1 });

// Virtual for transfer duration
OwnershipHistorySchema.virtual('transferDuration').get(function() {
  if (this.contractDate && this.contractExpiry) {
    const start = new Date(this.contractDate);
    const end = new Date(this.contractExpiry);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} months`;
    } else {
      return `${Math.floor(diffDays / 365)} years`;
    }
  }
  return 'Unknown';
});

// Static methods
OwnershipHistorySchema.statics.findByPet = function(petId) {
  return this.find({ pet: petId, isActive: true })
    .populate('previousOwner', 'name email phone')
    .populate('newOwner', 'name email phone')
    .sort({ transferDate: -1 });
};

OwnershipHistorySchema.statics.findByOwner = function(ownerId) {
  return this.find({
    $or: [
      { previousOwner: ownerId },
      { newOwner: ownerId }
    ],
    isActive: true
  }).populate('pet', 'name petId species breed')
    .populate('previousOwner', 'name email')
    .populate('newOwner', 'name email')
    .sort({ transferDate: -1 });
};

OwnershipHistorySchema.statics.findByType = function(transferType) {
  return this.find({ transferType, isActive: true })
    .populate('pet', 'name petId')
    .populate('previousOwner', 'name email')
    .populate('newOwner', 'name email')
    .sort({ transferDate: -1 });
};

OwnershipHistorySchema.statics.findPending = function() {
  return this.find({ status: 'Pending', isActive: true })
    .populate('pet', 'name petId')
    .populate('previousOwner', 'name email')
    .populate('newOwner', 'name email')
    .sort({ transferDate: -1 });
};

// Instance methods
OwnershipHistorySchema.methods.softDelete = function() {
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

OwnershipHistorySchema.methods.restore = function() {
  this.isActive = true;
  this.deletedAt = undefined;
  return this.save();
};

module.exports = mongoose.model('OwnershipHistory', OwnershipHistorySchema);
