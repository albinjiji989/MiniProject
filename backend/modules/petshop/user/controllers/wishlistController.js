const Wishlist = require('./Wishlist');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');

// Wishlist management
const addToWishlist = async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user._id;

    // Check if item exists
    const item = await PetInventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Add to wishlist if not already added
    const existingWishlistItem = await Wishlist.findOne({ userId, itemId });
    if (!existingWishlistItem) {
      await Wishlist.create({ userId, itemId });
    }

    res.json({
      success: true,
      message: 'Item added to wishlist',
    });
  } catch (e) {
    console.error('Add to wishlist error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    await Wishlist.findOneAndDelete({ userId, itemId });

    res.json({
      success: true,
      message: 'Item removed from wishlist',
    });
  } catch (e) {
    console.error('Remove from wishlist error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listMyWishlist = async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ userId: req.user._id })
      .populate({
        path: 'itemId',
        select: 'name price images storeName'
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { wishlist: wishlistItems },
    });
  } catch (e) {
    console.error('List wishlist error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  listMyWishlist
};