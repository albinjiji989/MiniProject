const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  totalAmount: { type: Number, required: true },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  storeId: { type: String, index: true },
  storeName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

