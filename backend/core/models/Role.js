const mongoose = require('mongoose')

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  permissions: [{
    module: {
      type: String,
      enum: ['adoption', 'petshop', 'rescue', 'veterinary', 'ecommerce', 'pharmacy', 'donation', 'boarding', 'rbac', 'core'],
      required: true
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'manage', 'approve', 'assign']
    }]
  }],
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  isSystemRole: {
    type: Boolean,
    default: false
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
  assignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
})

// Index for efficient queries
// Note: 'name' already has a unique index via the schema path; avoid duplicate
roleSchema.index({ level: 1 })
roleSchema.index({ isActive: 1 })

// Method to check if role has permission
roleSchema.methods.hasPermission = function(module, action) {
  const permission = this.permissions.find(p => p.module === module)
  if (!permission) return false
  return permission.actions.includes(action) || permission.actions.includes('manage')
}

// Method to add permission
roleSchema.methods.addPermission = function(module, actions) {
  const existingPermission = this.permissions.find(p => p.module === module)
  if (existingPermission) {
    existingPermission.actions = [...new Set([...existingPermission.actions, ...actions])]
  } else {
    this.permissions.push({ module, actions })
  }
  return this.save()
}

// Method to remove permission
roleSchema.methods.removePermission = function(module, actions) {
  const existingPermission = this.permissions.find(p => p.module === module)
  if (existingPermission) {
    existingPermission.actions = existingPermission.actions.filter(action => !actions.includes(action))
    if (existingPermission.actions.length === 0) {
      this.permissions = this.permissions.filter(p => p.module !== module)
    }
  }
  return this.save()
}

module.exports = mongoose.model('Role', roleSchema)
