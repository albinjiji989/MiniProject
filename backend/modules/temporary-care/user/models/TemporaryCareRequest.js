const mongoose = require('mongoose');

const temporaryCareRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  careType: { type: String, enum: ['emergency', 'vacation', 'medical', 'temporary', 'foster'], required: true },
  notes: { type: String, default: '' },
  storeId: { type: String, required: true, index: true },
  storeName: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'assigned', 'in_care', 'completed', 'cancelled'], default: 'pending', index: true },
  assignedCareId: { type: mongoose.Schema.Types.ObjectId, ref: 'TemporaryCare' },
  
  // Price agreement
  totalAmount: { type: Number },
  advanceAmount: { type: Number },
  finalAmount: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('TemporaryCareRequest', temporaryCareRequestSchema);