const mongoose = require('mongoose')

const petSystemRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['category', 'species', 'breed'],
    required: true
  },
  requestedData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  explanation: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  declinedAt: {
    type: Date
  },
  declinedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  declineReason: {
    type: String
  },
  createdItemId: {
    type: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
})

// Index for efficient queries
petSystemRequestSchema.index({ userId: 1, status: 1 })
petSystemRequestSchema.index({ type: 1, status: 1 })
petSystemRequestSchema.index({ submittedAt: -1 })

module.exports = mongoose.model('PetSystemRequest', petSystemRequestSchema)
