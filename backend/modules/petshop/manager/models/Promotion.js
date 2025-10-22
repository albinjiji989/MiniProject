const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a promotion code'],
    unique: true,
    trim: true,
    maxlength: [20, 'Promotion code cannot be more than 20 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  discountType: {
    type: String,
    required: [true, 'Please add a discount type'],
    enum: ['percentage', 'fixed']
  },
  discountValue: {
    type: Number,
    required: [true, 'Please add a discount value']
  },
  minOrder: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date']
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
    ref: 'PetShop',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicableItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PetInventoryItem'
    }
  ],
  applicableCategories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }
  ]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
PromotionSchema.index({ code: 1, shop: 1 });
PromotionSchema.index({ startDate: 1, endDate: 1 });
PromotionSchema.index({ isActive: 1 });

module.exports = mongoose.model('Promotion', PromotionSchema);