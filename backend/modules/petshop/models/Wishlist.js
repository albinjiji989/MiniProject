const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'PetInventoryItem', required: true, index: true },
}, { timestamps: true });

wishlistSchema.index({ userId: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('PetShopWishlist', wishlistSchema);
