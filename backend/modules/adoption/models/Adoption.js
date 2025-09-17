const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema({
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  adopter: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  adoptionFee: { type: Number, default: 0 },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  storeId: { type: String, index: true },
  storeName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Adoption', adoptionSchema);

