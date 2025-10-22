const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  addressLine1: { type: String, default: '' },
  addressLine2: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zipCode: { type: String, default: '' },
  country: { type: String, default: 'India' }
}, { _id: false });

const veterinaryClinicSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: addressSchema, default: () => ({}) },
  services: [{ type: String }],
  storeId: { type: String, index: true },
  storeName: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('VeterinaryClinic', veterinaryClinicSchema);


