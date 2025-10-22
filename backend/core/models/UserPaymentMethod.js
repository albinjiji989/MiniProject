const mongoose = require('mongoose');

const userPaymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  cardNumber: {
    type: String,
    trim: true
  },
  expiry: {
    type: String,
    trim: true
  },
  cvv: {
    type: String,
    trim: true
  },
  cardHolderName: {
    type: String,
    trim: true
  },
  paypalEmail: {
    type: String,
    trim: true
  },
  bankAccountNumber: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: true
});

// Indexes
userPaymentMethodSchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.model('UserPaymentMethod', userPaymentMethodSchema);