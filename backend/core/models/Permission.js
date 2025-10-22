const mongoose = require('mongoose')

const permissionSchema = new mongoose.Schema({
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
  module: {
    type: String,
    enum: ['adoption', 'petshop', 'rescue', 'veterinary', 'ecommerce', 'pharmacy', 'donation', 'boarding', 'rbac', 'core'],
    required: true
  },
  action: {
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'manage', 'approve', 'assign'],
    required: true
  },
  resource: {
    type: String,
    required: true
  },
  conditions: [{
    field: String,
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in']
    },
    value: mongoose.Schema.Types.Mixed
  }],
  isSystemPermission: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for efficient queries
permissionSchema.index({ module: 1, action: 1 })
permissionSchema.index({ resource: 1 })
permissionSchema.index({ isActive: 1 })

// Method to check if permission applies to resource
permissionSchema.methods.appliesTo = function(resource) {
  return this.resource === resource || this.resource === '*'
}

// Method to evaluate conditions
permissionSchema.methods.evaluateConditions = function(context) {
  if (!this.conditions || this.conditions.length === 0) return true
  
  return this.conditions.every(condition => {
    const fieldValue = this.getNestedValue(context, condition.field)
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      case 'not_equals':
        return fieldValue !== condition.value
      case 'contains':
        return String(fieldValue).includes(String(condition.value))
      case 'not_contains':
        return !String(fieldValue).includes(String(condition.value))
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)
      case 'less_than':
        return Number(fieldValue) < Number(condition.value)
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue)
      default:
        return false
    }
  })
}

// Helper method to get nested object values
permissionSchema.methods.getNestedValue = function(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj)
}

module.exports = mongoose.model('Permission', permissionSchema)
