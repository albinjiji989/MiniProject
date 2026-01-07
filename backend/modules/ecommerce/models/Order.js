const mongoose = require('mongoose');

/**
 * Order Model - Complete order management
 */
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productSnapshot: {
    name: String,
    image: String,
    sku: String
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId
  },
  variantDetails: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'],
    default: 'pending'
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Customer Info
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  customerDetails: {
    name: String,
    email: String,
    phone: String
  },
  
  // Items
  items: [orderItemSchema],
  
  // Pricing
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    couponDiscount: {
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
      required: true
    }
  },
  
  // Coupon
  coupon: {
    code: String,
    discount: Number,
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    }
  },
  
  // Shipping Address
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    landmark: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    addressType: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    }
  },
  
  // Billing Address
  billingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  
  sameAsShipping: {
    type: Boolean,
    default: true
  },
  
  // Payment
  payment: {
    method: {
      type: String,
      enum: ['cod', 'online', 'wallet', 'upi'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    transactionId: String,
    razorpay: {
      orderId: String,
      paymentId: String,
      signature: String
    },
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number
  },
  
  // Shipping/Delivery
  shipping: {
    method: {
      type: String,
      default: 'standard'
    },
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date,
    deliveryProof: String
  },
  
  // Order Status
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'returned',
      'refunded'
    ],
    default: 'pending',
    index: true
  },
  
  // Status Timeline
  statusHistory: [{
    status: String,
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Cancellation
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    refundStatus: String
  },
  
  // Return/Refund
  return: {
    requested: {
      type: Boolean,
      default: false
    },
    reason: String,
    requestedAt: Date,
    approvedAt: Date,
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'completed']
    },
    refundAmount: Number
  },
  
  // Notes
  customerNote: String,
  internalNotes: String,
  
  // Seller/Store
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  storeId: String,
  
  // Invoice
  invoice: {
    number: String,
    url: String,
    generatedAt: Date
  },
  
  // Metadata
  source: {
    type: String,
    enum: ['web', 'mobile', 'admin'],
    default: 'web'
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ seller: 1, status: 1 });

// Generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    this.orderNumber = `ORD${dateStr}${String(count + 1).padStart(5, '0')}`;
  }
  
  // Copy shipping to billing if same
  if (this.sameAsShipping) {
    this.billingAddress = { ...this.shippingAddress };
  }
  
  next();
});

// Add status to history
orderSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    note,
    updatedBy,
    timestamp: new Date()
  });
};

module.exports = mongoose.model('Order', orderSchema);
