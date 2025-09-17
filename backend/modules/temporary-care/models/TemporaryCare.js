const mongoose = require('mongoose');

const temporaryCareSchema = new mongoose.Schema({
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  owner: {
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
  storeName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TemporaryCare', temporaryCareSchema);

