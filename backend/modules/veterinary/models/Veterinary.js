const mongoose = require('mongoose');

const veterinarySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: Object, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  services: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  storeId: { type: String, index: true },
  storeName: { type: String }
}, { timestamps: true });

veterinarySchema.index({ location: '2dsphere' });

module.exports = mongoose.models.Veterinary || mongoose.model('Veterinary', veterinarySchema);