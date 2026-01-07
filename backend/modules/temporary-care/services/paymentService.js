const CareBooking = require('../../models/CareBooking');
const TemporaryCarePayment = require('../../models/TemporaryCarePayment');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay (configure with your keys)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'your_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret'
});

/**
 * Payment Controller for New Booking System
 */

// Create payment order for advance payment
exports.createAdvancePaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await CareBooking.findOne({
      _id: bookingId,
      userId: req.user.id
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (booking.paymentStatus.advance.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Advance payment already completed' 
      });
    }
    
    // Check if payment order already exists
    const existingPayment = await TemporaryCarePayment.findOne({
      temporaryCareId: bookingId,
      paymentType: 'advance',
      status: { $in: ['pending', 'processing'] }
    });
    
    if (existingPayment) {
      return res.json({
        success: true,
        message: 'Payment order already exists',
        data: {
          orderId: existingPayment.razorpay.orderId,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          payment: existingPayment
        }
      });
    }
    
    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(booking.pricing.advanceAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: `adv_${booking.bookingNumber}_${Date.now()}`,
      notes: {
        bookingId: booking._id.toString(),
        bookingNumber: booking.bookingNumber,
        paymentType: 'advance'
      }
    });
    
    // Create payment record
    const payment = await TemporaryCarePayment.create({
      temporaryCareId: bookingId,
      userId: req.user.id,
      amount: booking.pricing.advanceAmount,
      currency: 'INR',
      paymentType: 'advance',
      status: 'pending',
      razorpay: {
        orderId: razorpayOrder.id
      }
    });
    
    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: razorpayOrder.id,
        amount: booking.pricing.advanceAmount,
        currency: 'INR',
        payment
      }
    });
  } catch (error) {
    console.error('Error creating advance payment order:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create payment order for final payment
exports.createFinalPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await CareBooking.findOne({
      _id: bookingId,
      userId: req.user.id
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (booking.paymentStatus.advance.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Advance payment must be completed first'
      });
    }
    
    if (booking.paymentStatus.final.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Final payment already completed'
      });
    }
    
    // Check if payment order already exists
    const existingPayment = await TemporaryCarePayment.findOne({
      temporaryCareId: bookingId,
      paymentType: 'final',
      status: { $in: ['pending', 'processing'] }
    });
    
    if (existingPayment) {
      return res.json({
        success: true,
        message: 'Payment order already exists',
        data: {
          orderId: existingPayment.razorpay.orderId,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          payment: existingPayment
        }
      });
    }
    
    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(booking.pricing.remainingAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: `final_${booking.bookingNumber}_${Date.now()}`,
      notes: {
        bookingId: booking._id.toString(),
        bookingNumber: booking.bookingNumber,
        paymentType: 'final'
      }
    });
    
    // Create payment record
    const payment = await TemporaryCarePayment.create({
      temporaryCareId: bookingId,
      userId: req.user.id,
      amount: booking.pricing.remainingAmount,
      currency: 'INR',
      paymentType: 'final',
      status: 'pending',
      razorpay: {
        orderId: razorpayOrder.id
      }
    });
    
    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: razorpayOrder.id,
        amount: booking.pricing.remainingAmount,
        currency: 'INR',
        payment
      }
    });
  } catch (error) {
    console.error('Error creating final payment order:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      paymentType
    } = req.body;
    
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_key_secret')
      .update(body.toString())
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }
    
    // Update payment record
    const payment = await TemporaryCarePayment.findOneAndUpdate(
      {
        temporaryCareId: bookingId,
        'razorpay.orderId': razorpay_order_id,
        paymentType
      },
      {
        status: 'completed',
        'razorpay.paymentId': razorpay_payment_id,
        'razorpay.signature': razorpay_signature
      },
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }
    
    // Update booking payment status
    const booking = await CareBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (paymentType === 'advance') {
      booking.paymentStatus.advance.status = 'completed';
      booking.paymentStatus.advance.paidAt = new Date();
      booking.paymentStatus.advance.paymentId = razorpay_payment_id;
      
      // Update booking status to confirmed after advance payment
      if (booking.status === 'pending_payment') {
        booking.status = 'confirmed';
      }
    } else if (paymentType === 'final') {
      booking.paymentStatus.final.status = 'completed';
      booking.paymentStatus.final.paidAt = new Date();
      booking.paymentStatus.final.paymentId = razorpay_payment_id;
    }
    
    await booking.save();
    
    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        payment,
        booking
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get payment history for a booking
exports.getPaymentHistory = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await CareBooking.findOne({
      _id: bookingId,
      userId: req.user.id
    }).select('bookingNumber pricing paymentStatus');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const payments = await TemporaryCarePayment.find({
      temporaryCareId: bookingId
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        booking,
        payments
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Process refund (admin/manager only)
exports.processRefund = async (req, res) => {
  try {
    const { bookingId, refundAmount, reason } = req.body;
    
    const booking = await CareBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (booking.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled bookings can be refunded'
      });
    }
    
    // Get the advance payment
    const advancePayment = await TemporaryCarePayment.findOne({
      temporaryCareId: bookingId,
      paymentType: 'advance',
      status: 'completed'
    });
    
    if (!advancePayment || !advancePayment.razorpay.paymentId) {
      return res.status(404).json({
        success: false,
        message: 'No completed payment found to refund'
      });
    }
    
    // Process refund through Razorpay
    const refund = await razorpay.payments.refund(advancePayment.razorpay.paymentId, {
      amount: Math.round(refundAmount * 100), // Convert to paise
      notes: {
        reason,
        bookingId: booking._id.toString(),
        bookingNumber: booking.bookingNumber
      }
    });
    
    // Update payment record
    advancePayment.status = 'refunded';
    advancePayment.refund = {
      refundId: refund.id,
      refundAmount,
      refundReason: reason,
      refundedAt: new Date()
    };
    await advancePayment.save();
    
    // Update booking
    if (booking.cancellation) {
      booking.cancellation.refundStatus = 'processed';
      booking.cancellation.refundAmount = refundAmount;
    }
    booking.status = 'refunded';
    await booking.save();
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refund,
        payment: advancePayment,
        booking
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = exports;
