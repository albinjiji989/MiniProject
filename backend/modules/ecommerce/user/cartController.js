const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

/**
 * Get user's cart
 */
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id, isActive: true })
      .populate({
        path: 'items.product',
        select: 'name slug images basePrice salePrice discount stock hasVariants variants'
      });
    
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    
    // Validate cart items (check stock, prices)
    let updated = false;
    for (let item of cart.items) {
      if (!item.product) {
        // Product deleted
        cart.items = cart.items.filter(i => i._id.toString() !== item._id.toString());
        updated = true;
        continue;
      }
      
      const product = item.product;
      
      // Check if product is in stock
      if (!product.isInStock()) {
        cart.items = cart.items.filter(i => i._id.toString() !== item._id.toString());
        updated = true;
        continue;
      }
      
      // Update price if changed
      const currentPrice = product.salePrice || product.basePrice;
      if (item.price !== currentPrice) {
        item.price = currentPrice;
        item.total = item.price * item.quantity;
        updated = true;
      }
      
      // Check if quantity exceeds stock
      if (item.quantity > product.stock) {
        item.quantity = product.stock;
        item.total = item.price * item.quantity;
        updated = true;
      }
    }
    
    if (updated) {
      await cart.save();
    }
    
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Add item to cart
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    
    // Validate product
    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Check stock
    if (!product.canPurchase(quantity)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient stock',
        availableStock: product.stock
      });
    }
    
    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id, isActive: true });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    
    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(item =>
      item.product.toString() === productId &&
      (variantId ? item.variant?.toString() === variantId : !item.variant)
    );
    
    const price = product.salePrice || product.basePrice;
    
    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].total = cart.items[existingItemIndex].price * cart.items[existingItemIndex].quantity;
      
      // Check if new quantity exceeds stock
      if (cart.items[existingItemIndex].quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add more items. Stock limit reached.',
          availableStock: product.stock
        });
      }
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        variant: variantId,
        quantity,
        price,
        discount: product.discount?.value || 0,
        total: price * quantity
      });
    }
    
    await cart.save();
    
    // Populate and return
    await cart.populate({
      path: 'items.product',
      select: 'name slug images basePrice salePrice discount stock'
    });
    
    res.json({ success: true, message: 'Item added to cart', data: cart });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update cart item quantity
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }
    
    const cart = await Cart.findOne({ user: req.user._id, isActive: true });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
    
    // Check stock
    const product = await Product.findById(item.product);
    if (!product.canPurchase(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock',
        availableStock: product.stock
      });
    }
    
    item.quantity = quantity;
    item.total = item.price * quantity;
    
    await cart.save();
    
    await cart.populate({
      path: 'items.product',
      select: 'name slug images basePrice salePrice discount stock'
    });
    
    res.json({ success: true, message: 'Cart updated', data: cart });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Remove item from cart
 */
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ user: req.user._id, isActive: true });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    
    await cart.save();
    
    await cart.populate({
      path: 'items.product',
      select: 'name slug images basePrice salePrice discount stock'
    });
    
    res.json({ success: true, message: 'Item removed from cart', data: cart });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Clear cart
 */
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id, isActive: true });
    if (!cart) {
      return res.json({ success: true, message: 'Cart already empty' });
    }
    
    cart.items = [];
    cart.appliedCoupon = undefined;
    cart.summary = {
      subtotal: 0,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: 0
    };
    
    await cart.save();
    
    res.json({ success: true, message: 'Cart cleared', data: cart });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Apply coupon to cart
 */
exports.applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    
    // Find coupon
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(), 
      isActive: true 
    });
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }
    
    // Validate coupon
    if (!coupon.isValidNow) {
      return res.status(400).json({ success: false, message: 'Coupon has expired or is not yet valid' });
    }
    
    if (!coupon.canUserUseCoupon(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You have exceeded the usage limit for this coupon' });
    }
    
    // Get cart
    const cart = await Cart.findOne({ user: req.user._id, isActive: true })
      .populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    // Check minimum order value
    if (cart.summary.subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required`
      });
    }
    
    // Calculate discount
    const discount = coupon.calculateDiscount(cart.summary.subtotal, cart.items);
    
    if (discount === 0) {
      return res.status(400).json({ success: false, message: 'Coupon not applicable to cart items' });
    }
    
    // Apply coupon
    cart.appliedCoupon = {
      code: coupon.code,
      discountAmount: discount,
      couponId: coupon._id
    };
    
    cart.summary.discount = discount;
    
    await cart.save();
    
    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: cart,
      savings: discount
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Remove coupon from cart
 */
exports.removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id, isActive: true });
    
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    cart.appliedCoupon = undefined;
    cart.summary.discount = 0;
    
    await cart.save();
    
    await cart.populate({
      path: 'items.product',
      select: 'name slug images basePrice salePrice discount stock'
    });
    
    res.json({ success: true, message: 'Coupon removed', data: cart });
  } catch (error) {
    console.error('Remove coupon error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get cart summary
 */
exports.getCartSummary = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id, isActive: true });
    
    if (!cart) {
      return res.json({
        success: true,
        data: {
          itemCount: 0,
          subtotal: 0,
          discount: 0,
          tax: 0,
          shipping: 0,
          total: 0
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        itemCount: cart.items.length,
        ...cart.summary
      }
    });
  } catch (error) {
    console.error('Get cart summary error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
