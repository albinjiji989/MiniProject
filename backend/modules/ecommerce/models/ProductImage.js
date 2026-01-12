const mongoose = require('mongoose');

/**
 * Product Image Model - Stores images for ecommerce products
 * Similar to the Image model used in other modules but specific to ecommerce products
 */
const productImageSchema = new mongoose.Schema({
  // Link to product
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },

  // Image URL from Cloudinary
  url: {
    type: String,
    required: true
  },

  // Cloudinary public_id for deletion
  publicId: {
    type: String,
    required: true
  },

  // Image metadata
  caption: {
    type: String,
    default: ''
  },

  altText: {
    type: String,
    default: ''
  },

  // Is this the primary/main image?
  isPrimary: {
    type: Boolean,
    default: false
  },

  // Display order for gallery
  displayOrder: {
    type: Number,
    default: 0
  },

  // Image type (product, variant, lifestyle, etc.)
  imageType: {
    type: String,
    enum: ['product', 'variant', 'lifestyle', 'detail', 'banner'],
    default: 'product'
  },

  // Upload info
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  uploadedAt: {
    type: Date,
    default: Date.now
  },

  // File metadata
  fileSize: {
    type: Number // in bytes
  },

  dimensions: {
    width: Number,
    height: Number
  },

  format: {
    type: String // jpg, png, webp, etc.
  },

  // Active status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
productImageSchema.index({ productId: 1, isPrimary: 1 });
productImageSchema.index({ productId: 1, displayOrder: 1 });
productImageSchema.index({ uploadedBy: 1 });

// Virtual for thumbnail (can be extended if needed)
productImageSchema.virtual('thumbnail').get(function() {
  // Cloudinary transformation for thumbnails
  if (this.url && this.url.includes('cloudinary.com')) {
    return this.url.replace('/upload/', '/upload/w_200,h_200,c_fill/');
  }
  return this.url;
});

// Ensure virtuals are included in JSON
productImageSchema.set('toJSON', { virtuals: true });
productImageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ProductImage', productImageSchema);
