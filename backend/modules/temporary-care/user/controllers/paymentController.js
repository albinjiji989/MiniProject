const TemporaryCare = require('../../models/TemporaryCare');
const TemporaryCarePayment = require('../../models/TemporaryCarePayment');
const paymentService = require('../../../../core/services/paymentService');
const { validationResult } = require('express-validator');
const { sendPaymentNotification } = require('../../services/notificationService');
const Pet = require('../../../../core/models/Pet');

// Create payment order for temporary care
const createPaymentOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { temporaryCareId, paymentType } = req.body;
    
    // Verify temporary care exists and belongs to user
    const care = await TemporaryCare.findOne({
      _id: temporaryCareId,
      'owner.userId': req.user._id
    });
    
    if (!care) {
      return res.status(404).json({ success: false, message: 'Temporary care record not found' });
    }
    
    // Check if payment type is valid
    if (!['advance', 'final'].includes(paymentType)) {
      return res.status(400).json({ success: false, message: 'Invalid payment type' });
    }
    
    // Check if payment already exists
    const existingPayment = await TemporaryCarePayment.findOne({
      temporaryCareId,
      paymentType,
      userId: req.user._id
    });
    
    if (existingPayment && existingPayment.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment already completed for this care service' 
      });
    }
    
    // Calculate amount based on payment type
    let amount;
    if (paymentType === 'advance') {
      amount = care.advanceAmount;
    } else {
      amount = care.finalAmount;
    }
    
    // Create Razorpay order
    const orderResult = await paymentService.createOrder(amount, 'INR', {
      temporaryCareId,
      paymentType,
      userId: req.user._id
    });
    
    if (!orderResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: orderResult.error || 'Failed to create payment order' 
      });
    }
    
    // Save or update payment record
    let payment;
    if (existingPayment) {
      existingPayment.amount = amount;
      existingPayment.razorpay.orderId = orderResult.order.id;
      existingPayment.status = 'pending';
      payment = await existingPayment.save();
    } else {
      payment = await TemporaryCarePayment.create({
        temporaryCareId,
        userId: req.user._id,
        amount,
        paymentType,
        razorpay: {
          orderId: orderResult.order.id
        }
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Payment order created successfully',
      data: { 
        payment,
        order: orderResult.order
      } 
    });
  } catch (e) {
    console.error('Create payment order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify payment for temporary care
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Verify payment signature
    const isValid = paymentService.verifyPayment(
      razorpay_signature, 
      razorpay_order_id, 
      razorpay_payment_id
    );
    
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
    
    // Find payment record
    const payment = await TemporaryCarePayment.findOne({
      'razorpay.orderId': razorpay_order_id
    }).populate('temporaryCareId');
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }
    
    // Store previous status for notification
    const previousStatus = payment.temporaryCareId.status;
    
    // Update payment status
    payment.status = 'completed';
    payment.razorpay.paymentId = razorpay_payment_id;
    payment.razorpay.signature = razorpay_signature;
    payment.paymentDate = new Date();
    await payment.save();
    
    // Update temporary care status if both payments are completed
    const advancePayment = await TemporaryCarePayment.findOne({
      temporaryCareId: payment.temporaryCareId._id,
      paymentType: 'advance',
      status: 'completed'
    });
    
    const finalPayment = await TemporaryCarePayment.findOne({
      temporaryCareId: payment.temporaryCareId._id,
      paymentType: 'final',
      status: 'completed'
    });
    
    // If advance payment is completed, activate the care
    if (payment.paymentType === 'advance' && advancePayment) {
      payment.temporaryCareId.status = 'active';
      await payment.temporaryCareId.save();
    }
    
    // If both payments are completed, care is fully paid
    if (advancePayment && finalPayment) {
      payment.temporaryCareId.status = 'active'; // Could be changed to a different status if needed
      await payment.temporaryCareId.save();
    }
    
    // Send payment notification
    const pet = await Pet.findById(payment.temporaryCareId.pet).select('name');
    if (pet) {
      payment.temporaryCareId.pet = pet;
    }
    
    await sendPaymentNotification(payment.userId, payment, payment.temporaryCareId);
    
    res.json({ 
      success: true, 
      message: 'Payment verified successfully',
      data: { payment } 
    });
  } catch (e) {
    console.error('Verify payment error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment
};