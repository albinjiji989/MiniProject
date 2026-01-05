const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Medicine Schema (specific for pharmacy)
const medicineSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: String,
    category: {
      type: String,
      enum: ['antibiotics', 'pain_relief', 'digestion', 'allergies', 'skin_care', 'parasite_control', 'vitamins', 'other'],
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    costPrice: Number,
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
    // Medicine-specific fields
    activeIngredient: String,
    dosage: String,
    manufacturer: String,
    expiryDate: Date,
    batchNumber: String,
    manufacturingDate: Date,
    requiresPrescription: {
      type: Boolean,
      default: false
    },
    usedFor: [String], // Conditions it treats
    sideEffects: [String],
    contraindications: String,
    storageInstructions: String,
    petTypes: [String], // e.g., ['dogs', 'cats', 'rabbits']
    
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
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Prescription Schema
const prescriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    petId: {
      type: Schema.Types.ObjectId,
      ref: 'Pet'
    },
    doctorName: String,
    vetClinic: String,
    prescriptionDate: Date,
    expiryDate: Date,
    prescriptionImageUrl: String, // Uploaded prescription image
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'used'],
      default: 'pending'
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User' // Pharmacy manager who approved
    },
    approvalDate: Date,
    rejectionReason: String,
    quantity: Number,
    notes: String
  },
  { timestamps: true }
);

// Pharmacy Cart Schema
const pharmacyCartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [
      {
        medicineId: {
          type: Schema.Types.ObjectId,
          ref: 'Medicine',
          required: true
        },
        quantity: {
          type: Number,
          default: 1
        },
        price: Number,
        requiresPrescription: Boolean,
        prescriptionId: {
          type: Schema.Types.ObjectId,
          ref: 'Prescription'
        },
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

// Pharmacy Order Schema
const pharmacyOrderSchema = new Schema(
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
        medicineId: {
          type: Schema.Types.ObjectId,
          ref: 'Medicine'
        },
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
        prescriptionId: {
          type: Schema.Types.ObjectId,
          ref: 'Prescription'
        }
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
  Medicine: mongoose.model('Medicine', medicineSchema),
  Prescription: mongoose.model('Prescription', prescriptionSchema),
  PharmacyCart: mongoose.model('PharmacyCart', pharmacyCartSchema),
  PharmacyOrder: mongoose.model('PharmacyOrder', pharmacyOrderSchema)
};
