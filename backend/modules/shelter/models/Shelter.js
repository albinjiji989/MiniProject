const mongoose = require('mongoose');

const shelterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: Object, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  capacity: {
    total: { type: Number, required: true },
    current: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  staff: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: String }],
  pets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  storeId: { type: String, index: true },
  storeName: { type: String }
}, { timestamps: true });

shelterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Shelter', shelterSchema);

