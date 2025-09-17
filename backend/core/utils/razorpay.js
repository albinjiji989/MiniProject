// Placeholder Razorpay integration utility (wire real keys via env)
module.exports = {
  createOrder: async ({ amount, currency = 'INR', receipt }) => {
    // Integrate with Razorpay SDK here in production
    return {
      id: `order_${Date.now()}`,
      amount,
      currency,
      receipt,
      status: 'created'
    };
  },
  verifySignature: ({ payload, signature }) => {
    // Verify HMAC signature here
    return true;
  }
};


