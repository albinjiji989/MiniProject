const UserAddress = require('../../../../core/models/UserAddress');
const UserPaymentMethod = require('../../../../core/models/UserPaymentMethod');
const ShopOrder = require('../models/ShopOrder');

// User Address Functions
const listUserAddresses = async (req, res) => {
  try {
    const addresses = await UserAddress.find({ userId: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 });
    
    res.json({
      success: true,
      data: { addresses }
    });
  } catch (err) {
    console.error('List user addresses error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addPaymentMethod = async (req, res) => {
  try {
    const { type, cardNumber, expiry, cvv, isDefault } = req.body;
    
    // Validate input
    if (!type || !cardNumber || !expiry || !cvv) {
      return res.status(400).json({
        success: false,
        message: 'All payment method fields are required'
      });
    }
    
    // Create payment method
    const paymentMethod = new UserPaymentMethod({
      userId: req.user._id,
      type,
      cardNumber, // In a real app, this would be encrypted
      expiry,
      cvv, // In a real app, this would be encrypted
      isDefault: isDefault || false
    });
    
    await paymentMethod.save();
    
    // If this is set as default, unset other defaults
    if (isDefault) {
      await UserPaymentMethod.updateMany(
        { userId: req.user._id, _id: { $ne: paymentMethod._id } },
        { $set: { isDefault: false } }
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
      data: { paymentMethod }
    });
  } catch (err) {
    console.error('Add payment method error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find order
    const order = await ShopOrder.findOne({ 
      _id: id, 
      userId: req.user._id 
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled in its current status'
      });
    }
    
    // Cancel order
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();
    
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order }
    });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  listUserAddresses,
  addPaymentMethod,
  cancelOrder
};