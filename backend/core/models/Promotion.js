const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrder: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  maxUses: {
    type: Number,
    default: null
  },
  currentUses: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  shop: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PetShop' 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  applicableItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetCategory'
  }]
}, { timestamps: true });

// Index for code and active status
promotionSchema.index({ code: 1, isActive: 1 });

// Virtual for checking if promotion is valid
promotionSchema.virtual('isValid').get(function() {
  const now = new Date();
  return (
    this.isActive &&
    this.startDate <= now &&
    this.endDate >= now &&
    (this.maxUses === null || this.currentUses < this.maxUses)
  );
});

// Method to check if promotion can be applied to an order
promotionSchema.methods.canApply = function(orderTotal) {
  if (!this.isValid) return false;
  if (this.minOrder && orderTotal < this.minOrder) return false;
  return true;
};

// Method to calculate discount amount
promotionSchema.methods.calculateDiscount = function(subtotal) {
  if (!this.canApply(subtotal)) return 0;
  
  if (this.discountType === 'percentage') {
    return (subtotal * this.discountValue) / 100;
  } else {
    return Math.min(this.discountValue, subtotal);
  }
};

module.exports = mongoose.model('Promotion', promotionSchema);
