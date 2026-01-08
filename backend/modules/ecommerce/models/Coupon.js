const mongoose = require('mongoose');

/**
 * Coupon Model - Discount coupons and promotional codes
 */
const couponSchema = new mongoose.Schema({
  // Basic Info
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  // Discount Configuration
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping'],
    required: true
  },
  
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Maximum discount cap (for percentage discounts)
  maxDiscount: {
    type: Number,
    min: 0
  },
  
  // Minimum order value required
  minOrderValue: {
    type: Number,
    default: 0
  },
  
  // Validity Period
  validFrom: {
    type: Date,
    required: true
  },
  
  validTill: {
    type: Date,
    required: true
  },
  
  // Usage Limits
  usageLimit: {
    total: {
      type: Number,
      default: null // null = unlimited
    },
    perUser: {
      type: Number,
      default: 1
    }
  },
  
  usageCount: {
    total: {
      type: Number,
      default: 0
    },
    users: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      count: {
        type: Number,
        default: 0
      },
      lastUsed: Date
    }]
  },
  
  // Applicable Products/Categories
  applicableTo: {
    type: {
      type: String,
      enum: ['all', 'categories', 'products', 'brands'],
      default: 'all'
    },
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductCategory'
    }],
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    brands: [String]
  },
  
  // Excluded items
  excludedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory'
  }],
  
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // User Eligibility
  eligibility: {
    type: {
      type: String,
      enum: ['all', 'new_users', 'specific_users', 'user_tier'],
      default: 'all'
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    tiers: [String] // ['bronze', 'silver', 'gold', 'platinum']
  },
  
  // First Order Only
  firstOrderOnly: {
    type: Boolean,
    default: false
  },
  
  // Payment Method Restriction
  allowedPaymentMethods: [{
    type: String,
    enum: ['all', 'cod', 'online', 'wallet', 'upi']
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Auto-apply
  autoApply: {
    type: Boolean,
    default: false
  },
  
  // Priority (for auto-apply, higher = applied first)
  priority: {
    type: Number,
    default: 0
  },
  
  // Display
  displayOnBanner: {
    type: Boolean,
    default: false
  },
  
  bannerText: String,
  
  // Terms & Conditions
  termsAndConditions: String,
  
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Metadata
  metadata: {
    campaignName: String,
    source: String,
    notes: String
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ validFrom: 1, validTill: 1 });
couponSchema.index({ autoApply: 1, isActive: 1, priority: -1 });

// Virtual for checking if coupon is valid now
couponSchema.virtual('isValidNow').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.validFrom && 
         now <= this.validTill &&
         (this.usageLimit.total === null || this.usageCount.total < this.usageLimit.total);
});

// Methods
couponSchema.methods.canUserUseCoupon = function(userId) {
  // Check if user has reached per-user limit
  const userUsage = this.usageCount.users.find(u => u.user.toString() === userId.toString());
  
  if (userUsage && userUsage.count >= this.usageLimit.perUser) {
    return false;
  }
  
  // Check eligibility
  if (this.eligibility.type === 'specific_users') {
    return this.eligibility.users.some(u => u.toString() === userId.toString());
  }
  
  return true;
};

couponSchema.methods.calculateDiscount = function(orderValue, items = []) {
  if (orderValue < this.minOrderValue) {
    return 0;
  }
  
  let applicableValue = orderValue;
  
  // If coupon is for specific categories/products, calculate applicable value
  if (this.applicableTo.type !== 'all' && items.length > 0) {
    applicableValue = items
      .filter(item => this.isItemApplicable(item))
      .reduce((sum, item) => sum + item.total, 0);
  }
  
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (applicableValue * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.discountType === 'fixed') {
    discount = this.discountValue;
  }
  
  return Math.min(discount, applicableValue);
};

couponSchema.methods.isItemApplicable = function(item) {
  // Check exclusions first
  if (this.excludedProducts.some(p => p.toString() === item.product.toString())) {
    return false;
  }
  
  if (item.category && this.excludedCategories.some(c => c.toString() === item.category.toString())) {
    return false;
  }
  
  // Check inclusions
  if (this.applicableTo.type === 'all') {
    return true;
  }
  
  if (this.applicableTo.type === 'products') {
    return this.applicableTo.products.some(p => p.toString() === item.product.toString());
  }
  
  if (this.applicableTo.type === 'categories' && item.category) {
    return this.applicableTo.categories.some(c => c.toString() === item.category.toString());
  }
  
  if (this.applicableTo.type === 'brands' && item.brand) {
    return this.applicableTo.brands.includes(item.brand);
  }
  
  return false;
};

couponSchema.methods.incrementUsage = function(userId) {
  this.usageCount.total += 1;
  
  const userUsage = this.usageCount.users.find(u => u.user.toString() === userId.toString());
  
  if (userUsage) {
    userUsage.count += 1;
    userUsage.lastUsed = new Date();
  } else {
    this.usageCount.users.push({
      user: userId,
      count: 1,
      lastUsed: new Date()
    });
  }
};

module.exports = mongoose.model('Coupon', couponSchema);
