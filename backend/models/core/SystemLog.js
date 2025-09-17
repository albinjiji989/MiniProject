const mongoose = require('mongoose')

const systemLogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['error', 'warn', 'info', 'debug'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  module: {
    type: String,
    enum: ['adoption', 'shelter', 'rescue', 'veterinary', 'ecommerce', 'pharmacy', 'donation', 'boarding', 'rbac', 'core', 'auth'],
    required: true
  },
  action: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: String,
  userAgent: String,
  requestId: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  stackTrace: String,
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolution: String
}, {
  timestamps: true
})

// Index for efficient queries
systemLogSchema.index({ level: 1, createdAt: -1 })
systemLogSchema.index({ module: 1, createdAt: -1 })
systemLogSchema.index({ userId: 1, createdAt: -1 })
systemLogSchema.index({ resolved: 1, createdAt: -1 })

// Method to mark as resolved
systemLogSchema.methods.markResolved = function(resolvedBy, resolution) {
  this.resolved = true
  this.resolvedBy = resolvedBy
  this.resolvedAt = new Date()
  this.resolution = resolution
  return this.save()
}

module.exports = mongoose.model('SystemLog', systemLogSchema)
