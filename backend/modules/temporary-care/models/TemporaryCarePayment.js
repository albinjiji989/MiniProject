const mongoose = require('mongoose');

const temporaryCarePaymentSchema = new mongoose.Schema({
  temporaryCareId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TemporaryCare', 
    required: true,
    index: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentType: { 
    type: String, 
    enum: ['advance', 'final'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'], 
    default: 'pending',
    index: true
  },
  // Razorpay specific fields
  razorpay: {
    orderId: { type: String },
    paymentId: { type: String },
    signature: { type: String }
  },
  // Refund information
  refund: {
    refundId: { type: String },
    refundAmount: { type: Number },
    refundReason: { type: String },
    refundedAt: { type: Date }
  },
  // Metadata
  metadata: {
    type: Object,
    default: {}
  }
}, { 
  timestamps: true 
});

// Indexes
temporaryCarePaymentSchema.index({ temporaryCareId: 1, paymentType: 1 });
temporaryCarePaymentSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('TemporaryCarePayment', temporaryCarePaymentSchema);