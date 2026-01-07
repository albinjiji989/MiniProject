const mongoose = require('mongoose');

/**
 * Shopping Cart Model
 */
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  items: [cartItemSchema],
  
  // Summary
  summary: {
    subtotal: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    shipping: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  
  // Applied Coupons
  appliedCoupon: {
    code: String,
    discountAmount: Number,
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Update summary before save
cartSchema.pre('save', function(next) {
  this.summary.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  this.summary.total = this.summary.subtotal - this.summary.discount + this.summary.tax + this.summary.shipping;
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
