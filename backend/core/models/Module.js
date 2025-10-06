const mongoose = require('mongoose')

const ModuleSchema = new mongoose.Schema(
  {
    key: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Module key must contain only lowercase letters, numbers, and hyphens']
    },
    name: { 
      type: String, 
      required: true, 
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200
    },
    icon: {
      type: String,
      default: 'Business',
      enum: ['Pets', 'LocalHospital', 'ShoppingCart', 'LocalPharmacy', 'Home', 'Business', 'Build', 'Settings']
    },
    color: {
      type: String,
      default: '#64748b',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color']
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'maintenance', 'coming_soon'],
      default: 'coming_soon'
    },
    hidden: {
      type: Boolean,
      default: false // Soft-delete visibility: true means hide from public
    },
    hasManagerDashboard: { 
      type: Boolean, 
      default: false 
    },
    isCoreModule: {
      type: Boolean,
      default: false // Core modules cannot be deleted
    },
    maintenanceMessage: {
      type: String,
      trim: true,
      maxlength: 200
    },
    blockReason: {
      type: String,
      trim: true,
      maxlength: 200
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
)

// Index for efficient queries
// Note: unique index on key is already defined via the schema (unique: true)
ModuleSchema.index({ status: 1 })
ModuleSchema.index({ displayOrder: 1 })
ModuleSchema.index({ hidden: 1 })

module.exports = mongoose.model('Module', ModuleSchema)


