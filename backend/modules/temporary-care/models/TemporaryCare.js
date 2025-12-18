const mongoose = require('mongoose');

const careActivitySchema = new mongoose.Schema({
  activityType: { 
    type: String, 
    enum: ['feeding', 'bathing', 'walking', 'medication', 'playtime', 'health_check', 'other'], 
    required: true 
  },
  timestamp: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  caregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  media: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentType: { type: String, enum: ['advance', 'final'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  paymentId: { type: String },
  orderId: { type: String },
  paymentDate: { type: Date },
  refundDate: { type: Date }
}, { _id: false });

const temporaryCareSchema = new mongoose.Schema({
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  owner: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  caregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  careType: { type: String, enum: ['emergency', 'vacation', 'medical', 'temporary', 'foster'], required: true },
  notes: { type: String, default: '' },
  storeId: { type: String, index: true },
  storeName: { type: String },
  
  // Payment information
  payments: [paymentSchema],
  
  // Care activities log
  careActivities: [careActivitySchema],
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['pending', 'active', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  
  // Handover information
  handover: {
    pickupMethod: { type: String, enum: ['home_delivery', 'store_pickup'], default: 'store_pickup' },
    deliveryAddress: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' }
    },
    scheduledAt: Date,
    completedAt: Date,
    notes: String
  },
  
  // OTP system for handover
  otp: {
    drop: {
      code: { type: String },
      generatedAt: { type: Date },
      expiresAt: { type: Date },
      used: { type: Boolean, default: false },
      usedAt: { type: Date }
    },
    pickup: {
      code: { type: String },
      generatedAt: { type: Date },
      expiresAt: { type: Date },
      used: { type: Boolean, default: false },
      usedAt: { type: Date }
    }
  },
  
  // Payment tracking
  totalAmount: { type: Number, required: true },
  advanceAmount: { type: Number, required: true },
  finalAmount: { type: Number, required: true },
  advancePaymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  finalPaymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }
}, { timestamps: true });

// Indexes
temporaryCareSchema.index({ 'owner.userId': 1 });
temporaryCareSchema.index({ caregiver: 1 });
temporaryCareSchema.index({ status: 1 });
temporaryCareSchema.index({ startDate: 1, endDate: 1 });

temporaryCareSchema.virtual('days').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('TemporaryCare', temporaryCareSchema);