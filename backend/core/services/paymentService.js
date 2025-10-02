const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in paise (e.g., 1000 for ₹10)
 * @param {string} currency - Currency code (default: 'INR')
 * @param {object} notes - Additional notes for the order
 * @returns {Promise<object>} Razorpay order object
 */
const createOrder = async (amount, currency = 'INR', notes = {}) => {
  try {
    if (!razorpay) {
      return {
        success: false,
        error: 'Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.',
      };
    }

    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes,
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} signature - Razorpay signature
 * @param {string} order_id - Order ID
 * @param {string} payment_id - Payment ID
 * @returns {boolean} Payment verification result
 */
const verifyPayment = (signature, order_id, payment_id) => {
  try {
    const body = order_id + '|' + payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
};

/**
 * Capture payment for an order
 * @param {string} payment_id - Payment ID to capture
 * @param {number} amount - Amount to capture in paise
 * @returns {Promise<object>} Capture result
 */
const capturePayment = async (payment_id, amount) => {
  try {
    const capture = await razorpay.payments.capture(payment_id, amount * 100);
    return {
      success: true,
      capture,
    };
  } catch (error) {
    console.error('Error capturing payment:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get payment details
 * @param {string} payment_id - Payment ID
 * @returns {Promise<object>} Payment details
 */
const getPaymentDetails = async (payment_id) => {
  try {
    const payment = await razorpay.payments.fetch(payment_id);
    return {
      success: true,
      payment,
    };
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  capturePayment,
  getPaymentDetails,
};
