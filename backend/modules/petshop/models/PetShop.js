const mongoose = require('mongoose');

const petShopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: Object, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  // Admin approval & compliance
  status: { type: String, enum: ['pending', 'approved', 'suspended', 'banned'], default: 'pending', index: true },
  license: {
    number: { type: String },
    expiresAt: { type: Date },
    documentUrl: { type: String }
  },
  contact: {
    email: { type: String },
    phone: { type: String }
  },
  complianceNotes: { type: String, trim: true },
  capacity: {
    total: { type: Number, required: true },
    current: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  staff: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: String }],
  pets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
  products: [{ 
    name: String, 
    category: String, 
    price: Number, 
    stock: Number,
    description: String 
  }],
  services: [{
    name: String,
    description: String,
    price: Number,
    duration: Number // in minutes
  }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  storeId: { type: String, index: true },
  storeName: { type: String }
}, { timestamps: true });

petShopSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('PetShop', petShopSchema);
