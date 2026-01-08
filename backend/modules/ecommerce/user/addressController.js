const Address = require('../models/Address');

/**
 * Get all addresses for user
 */
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ 
      user: req.user._id, 
      isActive: true 
    }).sort('-isDefault -lastUsed');
    
    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get single address
 */
exports.getAddressById = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const address = await Address.findOne({
      _id: addressId,
      user: req.user._id
    });
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    res.json({ success: true, data: address });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Add new address
 */
exports.addAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      alternatePhone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country,
      addressType,
      label,
      isDefault,
      deliveryInstructions
    } = req.body;
    
    const address = new Address({
      user: req.user._id,
      fullName,
      phone,
      alternatePhone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country,
      addressType,
      label,
      isDefault,
      deliveryInstructions
    });
    
    await address.save();
    
    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: address
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update address
 */
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const address = await Address.findOne({
      _id: addressId,
      user: req.user._id
    });
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    // Update fields
    const allowedUpdates = [
      'fullName', 'phone', 'alternatePhone', 'addressLine1', 'addressLine2',
      'landmark', 'city', 'state', 'pincode', 'country', 'addressType',
      'label', 'isDefault', 'deliveryInstructions'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        address[field] = req.body[field];
      }
    });
    
    await address.save();
    
    res.json({
      success: true,
      message: 'Address updated successfully',
      data: address
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Delete address
 */
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const address = await Address.findOne({
      _id: addressId,
      user: req.user._id
    });
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    // Soft delete
    address.isActive = false;
    await address.save();
    
    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Set default address
 */
exports.setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { type = 'both' } = req.body; // 'both', 'shipping', 'billing'
    
    const address = await Address.findOne({
      _id: addressId,
      user: req.user._id
    });
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    if (type === 'both' || type === 'shipping') {
      address.isDefaultShipping = true;
    }
    
    if (type === 'both' || type === 'billing') {
      address.isDefaultBilling = true;
    }
    
    if (type === 'both') {
      address.isDefault = true;
    }
    
    await address.save();
    
    res.json({
      success: true,
      message: 'Default address updated',
      data: address
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get default address
 */
exports.getDefaultAddress = async (req, res) => {
  try {
    const { type = 'shipping' } = req.query;
    
    const query = { user: req.user._id, isActive: true };
    
    if (type === 'shipping') {
      query.isDefaultShipping = true;
    } else if (type === 'billing') {
      query.isDefaultBilling = true;
    } else {
      query.isDefault = true;
    }
    
    const address = await Address.findOne(query);
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'No default address set' });
    }
    
    res.json({ success: true, data: address });
  } catch (error) {
    console.error('Get default address error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
