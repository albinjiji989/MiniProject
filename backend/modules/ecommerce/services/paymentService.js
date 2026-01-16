const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create Razorpay Order
 */
exports.createOrder = async (amount, currency = 'INR', notes = {}) => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `order_${Date.now()}`,
      notes
    });

    return {
      success: true,
      order
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Verify Razorpay Payment Signature
 */
exports.verifyPayment = (signature, orderId, paymentId) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
};

/**
 * Get Payment Details from Razorpay
 */
exports.getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
};

/**
 * Initiate Refund
 */
exports.initiateRefund = async (paymentId, amount) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Convert to paise
      speed: 'normal'
    });
    return refund;
  } catch (error) {
    console.error('Error initiating refund:', error);
    throw error;
  }
};

module.exports = exports;
