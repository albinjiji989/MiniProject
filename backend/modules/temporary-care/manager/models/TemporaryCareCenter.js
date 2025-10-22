const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  addressLine1: { type: String, default: '' },
  addressLine2: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zipCode: { type: String, default: '' },
  country: { type: String, default: 'India' }
}, { _id: false });

const temporaryCareCenterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: addressSchema, default: () => ({}) },
  services: [{ type: String }],
  capacity: {
    total: { type: Number, default: 0 },
    current: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storeId: { type: String, index: true },
  storeName: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TemporaryCareCenter', temporaryCareCenterSchema);


