const mongoose = require('mongoose')

const systemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'email', 'payment', 'storage', 'security', 'notification', 'api'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  isSystemConfig: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  previousValues: [{
    value: mongoose.Schema.Types.Mixed,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
})

// Index for efficient queries (avoid duplicate of 'key' which is already unique)
systemConfigSchema.index({ category: 1 })
systemConfigSchema.index({ isActive: 1 })

// Method to update config with history
systemConfigSchema.methods.updateValue = function(newValue, updatedBy) {
  // Store previous value
  this.previousValues.push({
    value: this.value,
    updatedBy: this.updatedBy,
    updatedAt: this.updatedAt
  })
  
  // Update current value
  this.value = newValue
  this.updatedBy = updatedBy
  this.version += 1
  
  return this.save()
}

// Method to get decrypted value
systemConfigSchema.methods.getDecryptedValue = function() {
  if (this.isEncrypted) {
    // In a real implementation, you would decrypt the value here
    // For now, we'll return the value as is
    return this.value
  }
  return this.value
}

module.exports = mongoose.model('SystemConfig', systemConfigSchema)
