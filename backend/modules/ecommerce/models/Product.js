const mongoose = require('mongoose');

/**
 * Product Model - Complete eCommerce product
 */
const variantSchema = new mongoose.Schema({
  name: String, // e.g., "1kg Pack", "Blue Color"
  sku: String,
  price: Number,
  compareAtPrice: Number,
  stock: {
    quantity: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 }
  },
  attributes: {
    size: String,
    weight: String,
    color: String,
    flavor: String
  },
  images: [String],
  isActive: { type: Boolean, default: true }
}, { _id: true });

const productSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true,
    index: 'text'
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: String,
  
  // Categorization
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    required: true,
    index: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory'
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  
  // Pet Specific
  petType: [{
    type: String,
    enum: ['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'all'],
    default: ['all']
  }],
  species: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Species'
  }],
  breeds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Breed'
  }],
  ageGroup: [{
    type: String,
    enum: ['puppy', 'adult', 'senior', 'all'],
    default: ['all']
  }],
  
  // Pricing
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    salePrice: Number,
    costPrice: Number,
    compareAtPrice: Number, // Original price for discount display
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed']
      },
      value: Number,
      startDate: Date,
      endDate: Date
    },
    tax: {
      percentage: { type: Number, default: 18 },
      inclusive: { type: Boolean, default: false }
    }
  },
  
  // Inventory
  inventory: {
    sku: {
      type: String,
      unique: true,
      sparse: true
    },
    barcode: String,
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    reserved: {
      type: Number,
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    trackInventory: {
      type: Boolean,
      default: true
    },
    allowBackorder: {
      type: Boolean,
      default: false
    }
  },
  
  // Variants
  hasVariants: {
    type: Boolean,
    default: false
  },
  variants: [variantSchema],
  
  // Product Attributes
  attributes: {
    brand: String,
    manufacturer: String,
    weight: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'cm' }
    },
    color: String,
    material: String,
    expiryDate: Date,
    shelfLife: String,
    ingredients: [String],
    nutritionalInfo: Object
  },
  
  // Media
  images: [{
    url: String,
    alt: String,
    isPrimary: Boolean,
    order: Number
  }],
  videos: [{
    url: String,
    title: String,
    thumbnail: String
  }],
  
  // Shipping
  shipping: {
    weight: Number, // kg
    length: Number,
    width: Number,
    height: Number,
    isFreeShipping: { type: Boolean, default: false },
    shippingClass: String,
    deliveryTime: {
      min: Number,
      max: Number,
      unit: { type: String, default: 'days' }
    }
  },
  
  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    canonicalUrl: String
  },
  
  // Features & Benefits
  features: [String],
  benefits: [String],
  howToUse: String,
  warnings: [String],
  
  // Reviews & Ratings
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  
  // Sales & Analytics
  analytics: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 }
  },
  
  // Related Products
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Seller/Store Info
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  storeId: {
    type: String,
    index: true
  },
  storeName: String,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'draft',
    index: true
  },
  
  // Flags
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  isBestseller: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  publishedAt: Date,
  metadata: {
    type: Object,
    default: {}
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'pricing.salePrice': 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ storeId: 1, status: 1 });

// Virtual for available stock
productSchema.virtual('availableStock').get(function() {
  return this.inventory.stock - this.inventory.reserved;
});

// Virtual for final price
productSchema.virtual('finalPrice').get(function() {
  return this.pricing.salePrice || this.pricing.basePrice;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.pricing.salePrice && this.pricing.basePrice > this.pricing.salePrice) {
    return Math.round(((this.pricing.basePrice - this.pricing.salePrice) / this.pricing.basePrice) * 100);
  }
  return 0;
});

// Methods
productSchema.methods.isInStock = function() {
  if (!this.inventory.trackInventory) return true;
  return this.availableStock > 0 || this.inventory.allowBackorder;
};

productSchema.methods.canPurchase = function(quantity = 1) {
  if (!this.inventory.trackInventory) return true;
  if (this.inventory.allowBackorder) return true;
  return this.availableStock >= quantity;
};

productSchema.methods.updateRating = function(newRating) {
  this.ratings.distribution[newRating] += 1;
  this.ratings.count += 1;
  
  const totalRating = 
    (5 * this.ratings.distribution[5]) +
    (4 * this.ratings.distribution[4]) +
    (3 * this.ratings.distribution[3]) +
    (2 * this.ratings.distribution[2]) +
    (1 * this.ratings.distribution[1]);
  
  this.ratings.average = totalRating / this.ratings.count;
};

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Auto-generate slug from name if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  // Set published date
  if (this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Update stock status
  if (this.inventory.trackInventory && this.availableStock === 0 && !this.inventory.allowBackorder) {
    this.status = 'out_of_stock';
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema);
