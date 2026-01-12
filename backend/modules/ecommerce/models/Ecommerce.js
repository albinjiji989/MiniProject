const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Product/Item Schema for Ecommerce
const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: String,
    category: {
      type: String,
      enum: ['pet_food', 'toys', 'accessories', 'grooming', 'health', 'other'],
      required: true
    },
    subcategory: String,
    price: {
      type: Number,
      required: true
    },
    costPrice: Number,
    discount: {
      percentage: {
        type: Number,
        default: 0
      },
      validTill: Date
    },
    images: [String],
    stock: {
      current: {
        type: Number,
        default: 0
      },
      reserved: {
        type: Number,
        default: 0
      },
      reorderLevel: {
        type: Number,
        default: 5
      }
    },
    specifications: {
      brand: String,
      size: String,
      weight: String,
      color: String,
      expiryDate: Date,
      batchNumber: String
    },
    petTypes: [String], // e.g., ['dogs', 'cats', 'birds']
    supplier: String,
    sku: String,
    barcode: String,
    manufacturingDate: Date,
    rating: {
      average: {
        type: Number,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      }
    },
    reviews: [
      {
        userId: Schema.Types.ObjectId,
        rating: Number,
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    storageId: {
      type: Schema.Types.ObjectId,
      ref: 'PetShop'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Shopping Cart Schema
const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          default: 1
        },
        price: Number,
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    lastModified: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Order Schema
const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product'
        },
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number
      }
    ],
    subtotal: Number,
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    shippingCost: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      phone: String
    },
    billingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },
    shippingMethod: {
      type: String,
      enum: ['delivery', 'pickup', 'store_pickup'],
      default: 'delivery'
    },
    shippingStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'card', 'upi', 'wallet', 'cod'],
      default: 'razorpay'
    },
    notes: String,
    specialInstructions: String,
    timeline: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        notes: String
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = {
  Product: mongoose.model('Product', productSchema),
  Cart: mongoose.model('Cart', cartSchema),
  Order: mongoose.model('Order', orderSchema)
};
