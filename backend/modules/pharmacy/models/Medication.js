const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  form: { type: String, required: true },
  price: { type: Number, required: true },
  inventory: {
    quantity: { type: Number, default: 0 }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  storeId: { type: String, index: true },
  storeName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Medication', medicationSchema);

