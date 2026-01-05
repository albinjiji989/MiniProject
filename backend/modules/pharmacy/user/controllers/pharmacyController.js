const { Medicine, Prescription, PharmacyCart, PharmacyOrder } = require('../../models/Pharmacy');
const User = require('../../../core/models/User');

// Get medicines with search/filter
const getMedicines = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12, petType } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { isActive: true };
    
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    if (petType) query.petTypes = petType;
    
    const medicines = await Medicine.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Medicine.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        medicines,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ success: false, message: 'Error fetching medicines', error: error.message });
  }
};

// Get medicine details
const getMedicineDetails = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }
    res.json({ success: true, data: medicine });
  } catch (error) {
    console.error('Error fetching medicine details:', error);
    res.status(500).json({ success: false, message: 'Error fetching medicine details', error: error.message });
  }
};

// Get pharmacy cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await PharmacyCart.findOne({ userId }).populate('items.medicineId');
    
    if (!cart) {
      cart = { userId, items: [] };
    }
    
    res.json({ success: true, data: { cart } });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Error fetching cart' });
  }
};

// Add medicine to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicineId, quantity = 1, prescriptionId } = req.body;
    
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }
    
    // Check prescription requirement
    if (medicine.requiresPrescription && !prescriptionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'This medicine requires a prescription. Please upload prescription first.' 
      });
    }
    
    let cart = await PharmacyCart.findOne({ userId });
    if (!cart) {
      cart = new PharmacyCart({ userId, items: [] });
    }
    
    const existingItem = cart.items.find(item => item.medicineId.toString() === medicineId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        medicineId,
        quantity,
        price: medicine.price,
        requiresPrescription: medicine.requiresPrescription,
        prescriptionId
      });
    }
    
    cart.lastModified = new Date();
    await cart.save();
    
    const populatedCart = await PharmacyCart.findById(cart._id).populate('items.medicineId');
    res.json({ success: true, message: 'Added to cart', data: { cart: populatedCart } });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Error adding to cart' });
  }
};

// Update cart item quantity
const updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quantity } = req.body;
    const medicineId = req.params.medicineId;
    
    const cart = await PharmacyCart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    const item = cart.items.find(i => i.medicineId.toString() === medicineId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }
    
    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i.medicineId.toString() !== medicineId);
    } else {
      item.quantity = quantity;
    }
    
    cart.lastModified = new Date();
    await cart.save();
    
    const populatedCart = await PharmacyCart.findById(cart._id).populate('items.medicineId');
    res.json({ success: true, data: { cart: populatedCart } });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ success: false, message: 'Error updating cart' });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const medicineId = req.params.medicineId;
    
    const cart = await PharmacyCart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(i => i.medicineId.toString() !== medicineId);
    cart.lastModified = new Date();
    await cart.save();
    
    const populatedCart = await PharmacyCart.findById(cart._id).populate('items.medicineId');
    res.json({ success: true, data: { cart: populatedCart } });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Error removing from cart' });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await PharmacyCart.findOneAndUpdate(
      { userId },
      { items: [], lastModified: new Date() },
      { new: true }
    );
    
    res.json({ success: true, data: { cart: result } });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Error clearing cart' });
  }
};

// Upload prescription
const uploadPrescription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicineId, doctorName, vetClinic, prescriptionDate, prescriptionImageUrl, petId } = req.body;
    
    const prescription = new Prescription({
      userId,
      medicineId,
      petId,
      doctorName,
      vetClinic,
      prescriptionDate,
      prescriptionImageUrl,
      status: 'pending'
    });
    
    await prescription.save();
    
    res.json({ success: true, message: 'Prescription uploaded', data: { prescription } });
  } catch (error) {
    console.error('Error uploading prescription:', error);
    res.status(500).json({ success: false, message: 'Error uploading prescription' });
  }
};

// Get user prescriptions
const getPrescriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const prescriptions = await Prescription.find({ userId })
      .populate('medicineId')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: { prescriptions } });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ success: false, message: 'Error fetching prescriptions' });
  }
};

// Create pharmacy order
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, billingAddress, paymentMethod, totalAmount, taxAmount, shippingAmount } = req.body;
    
    const cart = await PharmacyCart.findOne({ userId }).populate('items.medicineId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    // Verify prescriptions for prescription-required medicines
    for (const item of cart.items) {
      if (item.medicineId.requiresPrescription && !item.prescriptionId) {
        return res.status(400).json({ 
          success: false, 
          message: `Prescription required for ${item.medicineId.name}` 
        });
      }
    }
    
    const orderNumber = `PHARMA-${Date.now()}`;
    const order = new PharmacyOrder({
      orderNumber,
      userId,
      items: cart.items.map(item => ({
        medicineId: item.medicineId._id,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        prescriptionId: item.prescriptionId
      })),
      subtotal: totalAmount - taxAmount - shippingAmount,
      tax: taxAmount,
      shippingCost: shippingAmount,
      totalAmount,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      shippingStatus: 'pending',
      paymentStatus: 'pending',
      timeline: [{ status: 'Order Created', timestamp: new Date() }]
    });
    
    await order.save();
    
    // Clear cart
    await PharmacyCart.findOneAndUpdate({ userId }, { items: [], lastModified: new Date() });
    
    res.status(201).json({ success: true, message: 'Order created', data: { order } });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
};

// Get user orders
const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await PharmacyOrder.find({ userId })
      .populate('items.medicineId')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: { orders } });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
};

// Get order details
const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await PharmacyOrder.findById(orderId)
      .populate('items.medicineId')
      .populate('items.prescriptionId');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({ success: true, data: { order } });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ success: false, message: 'Error fetching order details' });
  }
};

module.exports = {
  getMedicines,
  getMedicineDetails,
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
  uploadPrescription,
  getPrescriptions,
  createOrder,
  getOrders,
  getOrderDetails
};
