const mongoose = require('mongoose');

const veterinaryInventoryTransactionSchema = new mongoose.Schema({
  // Item reference
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VeterinaryInventory',
    required: [true, 'Inventory item is required'],
    index: true
  },
  itemName: {
    type: String,
    required: true
  },

  // Transaction details
  transactionType: {
    type: String,
    enum: ['purchase', 'sale', 'adjustment', 'return', 'expired', 'damaged', 'transfer'],
    required: [true, 'Transaction type is required'],
    index: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },

  // Before/After stock
  stockBefore: {
    type: Number,
    required: true
  },
  stockAfter: {
    type: Number,
    required: true
  },

  // Reference information
  referenceType: {
    type: String,
    enum: ['appointment', 'medical_record', 'purchase_order', 'manual', 'other']
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },

  // Additional details
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  reason: {
    type: String,
    trim: true
  },

  // Store information
  storeId: {
    type: String,
    required: [true, 'Store ID is required'],
    index: true
  },

  // Audit fields
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Performer is required']
  },
  transactionDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
veterinaryInventoryTransactionSchema.index({ storeId: 1, transactionDate: -1 });
veterinaryInventoryTransactionSchema.index({ inventoryItem: 1, transactionDate: -1 });
veterinaryInventoryTransactionSchema.index({ transactionType: 1, transactionDate: -1 });

module.exports = mongoose.model('VeterinaryInventoryTransaction', veterinaryInventoryTransactionSchema);
