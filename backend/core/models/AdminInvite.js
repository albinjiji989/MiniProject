const mongoose = require('mongoose');

const adminInviteSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    lowercase: true,
    trim: true,
    index: true 
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  phone: { 
    type: String, 
    trim: true 
  },
  module: { 
    type: String, 
    required: true,
    enum: ['adoption', 'petshop', 'veterinary', 'temporary-care', 'ecommerce', 'pharmacy'],
    index: true
  },
  otp: { 
    type: String, 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true, 
    index: true 
  },
  verified: { 
    type: Boolean, 
    default: false,
    index: true
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
adminInviteSchema.index({ email: 1, module: 1, verified: 1 });
adminInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired invites

module.exports = mongoose.model('AdminInvite', adminInviteSchema);
