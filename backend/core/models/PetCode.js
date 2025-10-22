const mongoose = require('mongoose');

const petCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'used', 'expired', 'revoked'],
    default: 'available'
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: true
});

// Indexes
petCodeSchema.index({ code: 1 });
petCodeSchema.index({ status: 1 });
petCodeSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('PetCode', petCodeSchema);