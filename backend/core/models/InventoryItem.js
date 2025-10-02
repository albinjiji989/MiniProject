const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetCategory'
  },
  brand: String,
  images: [{
    url: String,
    isPrimary: { type: Boolean, default: false }
  }],
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
    default: 'in_stock'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetShop',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weight: {
    value: Number,
    unit: { type: String, enum: ['g', 'kg', 'lb', 'oz'] }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, enum: ['cm', 'in'] }
  },
  tags: [String],
  taxRate: {
    type: Number,
    default: 0
  },
  reorderPoint: Number,
  supplier: {
    name: String,
    code: String,
    contact: String
  },
  lastRestocked: Date,
  notes: String
}, { timestamps: true });

// Generate SKU before saving
inventoryItemSchema.pre('save', async function(next) {
  if (!this.sku) {
    const count = await this.constructor.countDocuments();
    this.sku = `ITM-${Date.now().toString(36).toUpperCase()}-${count + 1}`;
  }
  
  // Update status based on quantity
  if (this.quantity <= 0) {
    this.status = 'out_of_stock';
  } else if (this.quantity <= (this.reorderPoint || 5)) {
    this.status = 'low_stock';
  } else {
    this.status = 'in_stock';
  }
  
  next();
});

// Indexes for better query performance
inventoryItemSchema.index({ name: 'text', description: 'text' });
inventoryItemSchema.index({ shop: 1, status: 1 });
inventoryItemSchema.index({ shop: 1, category: 1 });

// Virtual for inventory value
inventoryItemSchema.virtual('inventoryValue').get(function() {
  return this.price * this.quantity;
});

// Method to update inventory quantity
inventoryItemSchema.methods.updateQuantity = async function(change, type = 'sale') {
  if (type === 'sale') {
    if (this.quantity < change) {
      throw new Error('Insufficient stock');
    }
    this.quantity -= change;
  } else if (type === 'purchase') {
    this.quantity += change;
    this.lastRestocked = new Date();
  } else if (type === 'adjustment') {
    this.quantity = change;
  }
  
  return this.save();
};

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
