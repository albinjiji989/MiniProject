const Razorpay = require('razorpay');
const crypto = require('crypto');
const PetshopPurchaseApplication = require('../../manager/models/PetshopPurchaseApplication');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order for approved purchase application
const createPurchasePaymentOrder = async (req, res) => {
  try {
    const { applicationId } = req.body;

    const application = await PetshopPurchaseApplication.findOne({
      _id: applicationId,
      userId: req.user._id
    }).populate('petInventoryItemId', 'name petCode price');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment can only be made for approved applications' 
      });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(application.paymentAmount * 100), // Amount in paise
      currency: 'INR',
      receipt: `app_${application._id}`,
      notes: {
        applicationId: application._id.toString(),
        petCode: application.petInventoryItemId.petCode,
        userId: req.user._id.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    // Update application with order ID
    application.razorpayOrderId = order.id;
    application.paymentStatus = 'processing';
    application.status = 'payment_pending';
    application.addStatusHistory('payment_pending', req.user._id, 'Payment order created');
    await application.save();

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: application.paymentAmount,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID,
        applicationId: application._id
      }
    });
  } catch (error) {
    console.error('Create purchase payment order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify Razorpay payment signature
const verifyPurchasePayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      applicationId
    } = req.body;

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Update application with payment details
    const application = await PetshopPurchaseApplication.findOne({
      _id: applicationId,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.paymentId = razorpay_payment_id;
    application.paymentStatus = 'success';
    application.paymentDate = new Date();
    application.status = 'paid';
    application.addStatusHistory('paid', req.user._id, 'Payment completed successfully');
    await application.save();

    // TODO: Send payment success email

    res.json({
      success: true,
      message: 'Payment verified successfully. Waiting for handover scheduling.',
      data: application
    });
  } catch (error) {
    console.error('Verify purchase payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Handle payment failure
const handlePaymentFailure = async (req, res) => {
  try {
    const { applicationId, error } = req.body;

    const application = await PetshopPurchaseApplication.findOne({
      _id: applicationId,
      userId: req.user._id
    });

    if (application) {
      application.paymentStatus = 'failed';
      application.addStatusHistory('payment_failed', req.user._id, `Payment failed: ${error}`);
      await application.save();
    }

    res.json({
      success: true,
      message: 'Payment failure recorded'
    });
  } catch (error) {
    console.error('Handle payment failure error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPurchasePaymentOrder,
  verifyPurchasePayment,
  handlePaymentFailure
};
