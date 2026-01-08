const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

/**
 * Get user's wishlist
 */
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name slug images basePrice salePrice discount stock status ratings'
      });
    
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, items: [] });
    }
    
    // Filter out unavailable products
    wishlist.items = wishlist.items.filter(item => item.product && item.product.status === 'active');
    
    res.json({ success: true, data: wishlist });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Add item to wishlist
 */
exports.addToWishlist = async (req, res) => {
  try {
    const { productId, variantId, priority } = req.body;
    
    // Validate product
    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Get or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, items: [] });
    }
    
    // Add item
    wishlist.addItem(productId, variantId, priority);
    
    await wishlist.save();
    
    // Update product wishlist count
    await Product.findByIdAndUpdate(productId, {
      $inc: { 'analytics.wishlistCount': 1 }
    });
    
    await wishlist.populate({
      path: 'items.product',
      select: 'name slug images basePrice salePrice discount stock status ratings'
    });
    
    res.json({ success: true, message: 'Added to wishlist', data: wishlist });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Remove item from wishlist
 */
exports.removeFromWishlist = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }
    
    const item = wishlist.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
    }
    
    const productId = item.product;
    
    wishlist.items = wishlist.items.filter(i => i._id.toString() !== itemId);
    
    await wishlist.save();
    
    // Update product wishlist count
    await Product.findByIdAndUpdate(productId, {
      $inc: { 'analytics.wishlistCount': -1 }
    });
    
    await wishlist.populate({
      path: 'items.product',
      select: 'name slug images basePrice salePrice discount stock status ratings'
    });
    
    res.json({ success: true, message: 'Removed from wishlist', data: wishlist });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Check if product is in wishlist
 */
exports.checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      return res.json({ success: true, inWishlist: false });
    }
    
    const inWishlist = wishlist.hasItem(productId);
    
    res.json({ success: true, inWishlist });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Move item from wishlist to cart
 */
exports.moveToCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const Cart = require('../models/Cart');
    
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('items.product');
    
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }
    
    const item = wishlist.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
    }
    
    const product = item.product;
    
    // Check stock
    if (!product.canPurchase(1)) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }
    
    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id, isActive: true });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    
    // Add to cart
    const price = product.salePrice || product.basePrice;
    cart.items.push({
      product: product._id,
      variant: item.variant,
      quantity: 1,
      price,
      discount: product.discount?.value || 0,
      total: price
    });
    
    await cart.save();
    
    // Remove from wishlist
    wishlist.items = wishlist.items.filter(i => i._id.toString() !== itemId);
    await wishlist.save();
    
    // Update product analytics
    await Product.findByIdAndUpdate(product._id, {
      $inc: { 'analytics.wishlistCount': -1 }
    });
    
    res.json({
      success: true,
      message: 'Item moved to cart successfully'
    });
  } catch (error) {
    console.error('Move to cart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Clear wishlist
 */
exports.clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      return res.json({ success: true, message: 'Wishlist already empty' });
    }
    
    // Update product wishlist counts
    for (let item of wishlist.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 'analytics.wishlistCount': -1 }
      });
    }
    
    wishlist.items = [];
    await wishlist.save();
    
    res.json({ success: true, message: 'Wishlist cleared', data: wishlist });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
