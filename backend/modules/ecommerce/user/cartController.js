const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * User Cart Controller
 */

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name slug images pricing inventory');

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
      await cart.save();
    }

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variantId } = req.body;

    console.log('Add to cart request:', { productId, quantity, variantId, userId: req.user.id });

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('Product found:', product.name);

    // Check stock availability
    const availableStock = product.inventory.stock - (product.inventory.reserved || 0);
    if (product.inventory.trackInventory && !product.inventory.allowBackorder && availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      console.log('Creating new cart for user');
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId &&
        (!variantId || item.variantId?.toString() === variantId)
    );

    if (existingItemIndex > -1) {
      console.log('Updating existing cart item');
      cart.items[existingItemIndex].quantity += quantity;
      // Recalculate total
      cart.items[existingItemIndex].total = cart.items[existingItemIndex].price * cart.items[existingItemIndex].quantity;
    } else {
      console.log('Adding new item to cart');
      const price = product.pricing.salePrice || product.pricing.basePrice;
      const total = price * quantity;
      cart.items.push({
        product: productId,
        variant: variantId,
        quantity,
        price,
        total,
        discount: 0
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name slug images pricing inventory');

    res.json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error adding to cart',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update cart item
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product', 'name slug images pricing inventory');

    res.json({
      success: true,
      message: 'Cart updated',
      data: cart
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart',
      error: error.message
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items.pull(itemId);
    await cart.save();
    await cart.populate('items.product', 'name slug images pricing inventory');

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from cart',
      error: error.message
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
};

module.exports = exports;
