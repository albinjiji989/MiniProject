const mongoose = require('mongoose');

const veterinaryInventorySchema = new mongoose.Schema({
  // Basic item information
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters'],
    index: true
  },
  itemCode: {
    type: String,
    trim: true,
    sparse: true,
    index: true
  },
  category: {
    type: String,
    enum: ['medicine', 'vaccine', 'equipment', 'supplies', 'food', 'other'],
    required: [true, 'Category is required'],
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  // Stock information
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    enum: ['pieces', 'bottles', 'boxes', 'ml', 'mg', 'kg', 'liters', 'units'],
    default: 'pieces'
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: [0, 'Minimum stock level cannot be negative']
  },
  maxStockLevel: {
    type: Number,
    default: 100,
    min: [0, 'Maximum stock level cannot be negative']
  },
  reorderPoint: {
    type: Number,
    default: 20,
    min: [0, 'Reorder point cannot be negative']
  },

  // Pricing
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    min: [0, 'Selling price cannot be negative']
  },
  totalValue: {
    type: Number,
    default: 0,
    min: [0, 'Total value cannot be negative']
  },

  // Supplier information
  supplier: {
    name: { type: String, trim: true },
    contact: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true }
  },

  // Batch tracking
  batchNumber: {
    type: String,
    trim: true
  },
  manufacturingDate: {
    type: Date
  },
  expiryDate: {
    type: Date,
    index: true
  },
  
  // Storage location
  location: {
    shelf: { type: String, trim: true },
    rack: { type: String, trim: true },
    room: { type: String, trim: true }
  },

  // Status
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'expired', 'discontinued'],
    default: 'in_stock',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Alerts
  lowStockAlert: {
    type: Boolean,
    default: false
  },
  expiryAlert: {
    type: Boolean,
    default: false
  },

  // Store information
  storeId: {
    type: String,
    required: [true, 'Store ID is required'],
    index: true
  },
  storeName: {
    type: String,
    trim: true
  },

  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastRestockedAt: {
    type: Date
  },
  lastRestockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
veterinaryInventorySchema.index({ storeId: 1, category: 1, status: 1 });
veterinaryInventorySchema.index({ storeId: 1, isActive: 1 });
veterinaryInventorySchema.index({ itemName: 'text', description: 'text' });
veterinaryInventorySchema.index({ expiryDate: 1, status: 1 });

// Pre-save middleware to calculate total value and update status
veterinaryInventorySchema.pre('save', function(next) {
  // Calculate total value
  this.totalValue = this.quantity * this.unitPrice;

  // Update stock status
  if (this.quantity === 0) {
    this.status = 'out_of_stock';
    this.lowStockAlert = true;
  } else if (this.quantity <= this.reorderPoint) {
    this.status = 'low_stock';
    this.lowStockAlert = true;
  } else {
    this.status = 'in_stock';
    this.lowStockAlert = false;
  }

  // Check expiry
  if (this.expiryDate) {
    const today = new Date();
    const daysUntilExpiry = Math.ceil((this.expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      this.status = 'expired';
      this.expiryAlert = true;
    } else if (daysUntilExpiry <= 30) {
      this.expiryAlert = true;
    } else {
      this.expiryAlert = false;
    }
  }

  next();
});

// Virtual for days until expiry
veterinaryInventorySchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  return Math.ceil((this.expiryDate - today) / (1000 * 60 * 60 * 24));
});

veterinaryInventorySchema.set('toJSON', { virtuals: true });
veterinaryInventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VeterinaryInventory', veterinaryInventorySchema);
