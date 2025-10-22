const mongoose = require('mongoose');

const StoreNameChangeRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  storeId: { type: String, default: null },
  currentStoreName: { type: String, default: '' },
  requestedStoreName: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending', index: true },
  reason: { type: String, default: '' },
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  decidedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('StoreNameChangeRequest', StoreNameChangeRequestSchema);
