const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const orderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'PetInventoryItem', required: true },
  name: { type: String },
  price: { type: Number, required: true, min: 0 },
  imageUrl: { type: String }
}, { _id: false });

const shopOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storeId: { type: String, index: true },
  storeName: { type: String },
  items: [orderItemSchema],
  amount: { type: Number, required: true, min: 0 }, // in paise
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'paid', 'failed', 'refunded', 'cancelled'], default: 'created' },
  razorpay: {
    orderId: { type: String },
    paymentId: { type: String },
    signature: { type: String }
  },
  notes: { type: String, trim: true }
}, { timestamps: true });

shopOrderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('PetShopOrder', shopOrderSchema);
