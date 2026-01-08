const TemporaryCareApplication = require('../../models/TemporaryCareApplication');
const TemporaryCarePayment = require('../../models/TemporaryCarePayment');
const paymentService = require('../../../../core/services/paymentService');
const { validationResult } = require('express-validator');

/**
 * Create payment order for application (advance or final)
 */
const createApplicationPaymentOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { applicationId, paymentType } = req.body;

    // Verify application exists and belongs to user
    const application = await TemporaryCareApplication.findOne({
      _id: applicationId,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Validate payment type
    if (!['advance', 'final'].includes(paymentType)) {
      return res.status(400).json({ success: false, message: 'Invalid payment type' });
    }

    // Check application status
    if (paymentType === 'advance') {
      if (application.status !== 'price_determined') {
        return res.status(400).json({
          success: false,
          message: 'Pricing must be determined before advance payment'
        });
      }
      if (application.paymentStatus.advance.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Advance payment already completed'
        });
      }
    } else if (paymentType === 'final') {
      if (application.status !== 'active_care') {
        return res.status(400).json({
          success: false,
          message: 'Final payment can only be made for active care'
        });
      }
      if (application.paymentStatus.final.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Final payment already completed'
        });
      }
      if (!application.finalBill || !application.finalBill.finalAmountDue) {
        return res.status(400).json({
          success: false,
          message: 'Final bill must be generated before final payment'
        });
      }
    }

    // Get amount
    let amount;
    if (paymentType === 'advance') {
      amount = application.pricing.advanceAmount;
    } else {
      amount = application.finalBill.finalAmountDue;
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Create Razorpay order
    const orderResult = await paymentService.createOrder(amount, 'INR', {
      applicationId: application._id.toString(),
      applicationNumber: application.applicationNumber,
      paymentType,
      userId: req.user._id.toString()
    });

    if (!orderResult.success) {
      return res.status(400).json({
        success: false,
        message: orderResult.error || 'Failed to create payment order'
      });
    }

    // Create or update payment record
    const paymentData = {
      temporaryCareId: application._id, // Using same model structure
      userId: req.user._id,
      amount,
      currency: 'INR',
      paymentType,
      status: 'pending',
      razorpay: {
        orderId: orderResult.order.id
      },
      metadata: {
        applicationId: application._id.toString(),
        applicationNumber: application.applicationNumber
      }
    };

    // Check if payment already exists
    const existingPayment = await TemporaryCarePayment.findOne({
      temporaryCareId: application._id,
      paymentType,
      status: { $in: ['pending', 'processing'] }
    });

    let payment;
    if (existingPayment) {
      existingPayment.amount = amount;
      existingPayment.razorpay.orderId = orderResult.order.id;
      existingPayment.status = 'pending';
      payment = await existingPayment.save();
    } else {
      payment = await TemporaryCarePayment.create(paymentData);
    }

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        payment,
        order: orderResult.order,
        amount,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Create application payment order error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Verify payment for application
 */
const verifyApplicationPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationId } = req.body;

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
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Verify application
    const application = await TemporaryCareApplication.findById(applicationId || payment.temporaryCareId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Verify application belongs to user
    if (application.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Update payment status
    payment.status = 'completed';
    payment.razorpay.paymentId = razorpay_payment_id;
    payment.razorpay.signature = razorpay_signature;
    payment.paymentDate = new Date();
    await payment.save();

    // Update application payment status
    if (payment.paymentType === 'advance') {
      application.paymentStatus.advance.status = 'completed';
      application.paymentStatus.advance.paidAt = new Date();
      application.paymentStatus.advance.paymentId = razorpay_payment_id;
      application.paymentStatus.advance.transactionId = razorpay_order_id;
      application.status = 'advance_paid';
    } else if (payment.paymentType === 'final') {
      application.paymentStatus.final.status = 'completed';
      application.paymentStatus.final.paidAt = new Date();
      application.paymentStatus.final.paymentId = razorpay_payment_id;
      application.paymentStatus.final.transactionId = razorpay_order_id;
    }

    await application.save();

    // Generate invoice
    const invoiceNumber = `INV-${application.applicationNumber}-${payment.paymentType.toUpperCase()}-${Date.now()}`;
    if (!application.invoices) {
      application.invoices = [];
    }
    application.invoices.push({
      invoiceNumber,
      invoiceType: payment.paymentType,
      amount: payment.amount,
      issuedAt: new Date()
    });
    await application.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        payment,
        application,
        invoiceNumber
      }
    });
  } catch (error) {
    console.error('Verify application payment error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get payment history for application
 */
const getApplicationPaymentHistory = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await TemporaryCareApplication.findOne({
      _id: applicationId,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const payments = await TemporaryCarePayment.find({
      temporaryCareId: application._id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        payments,
        application: {
          advanceStatus: application.paymentStatus.advance,
          finalStatus: application.paymentStatus.final,
          invoices: application.invoices || []
        }
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Generate OTP for pet handover (dropoff) after advance payment
 */
const generateHandoverOTP = async (req, res) => {
  try {
    const { applicationId } = req.body;

    const application = await TemporaryCareApplication.findOne({
      _id: applicationId,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Check if advance payment is completed
    if (application.paymentStatus.advance.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Advance payment must be completed before handover'
      });
    }

    // Check if already in active care
    if (application.status === 'active_care') {
      return res.status(400).json({
        success: false,
        message: 'Pet is already in care'
      });
    }

    // Generate 6-digit OTP
    const crypto = require('crypto');
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update application with handover OTP
    application.handover.dropoff.otp = otp;
    application.handover.dropoff.otpGeneratedAt = new Date();
    application.handover.dropoff.otpExpiresAt = otpExpiry;
    application.handover.dropoff.otpUsed = false;
    await application.save();

    res.json({
      success: true,
      message: 'Handover OTP generated successfully',
      data: {
        otp,
        expiresAt: otpExpiry,
        applicationId: application._id
      }
    });
  } catch (error) {
    console.error('Generate handover OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Verify handover OTP and complete pet dropoff (manager side)
 */
const verifyHandoverOTP = async (req, res) => {
  try {
    const { applicationId, otp } = req.body;
    const Pet = require('../../../../core/models/Pet');
    const AdoptionPet = require('../../../adoption/manager/models/AdoptionPet');

    const application = await TemporaryCareApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Check if OTP exists
    if (!application.handover.dropoff.otp) {
      return res.status(400).json({
        success: false,
        message: 'No handover OTP generated for this application'
      });
    }

    // Check if OTP already used
    if (application.handover.dropoff.otpUsed) {
      return res.status(400).json({
        success: false,
        message: 'OTP has already been used'
      });
    }

    // Check OTP expiry
    const now = new Date();
    if (now > application.handover.dropoff.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please generate a new one'
      });
    }

    // Verify OTP
    if (application.handover.dropoff.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark OTP as used
    application.handover.dropoff.otpUsed = true;
    application.handover.dropoff.handoverDate = new Date();
    application.handover.dropoff.handoverBy = req.user._id;
    application.status = 'active_care';
    application.careStartDate = new Date();
    await application.save();

    // Update pets' temporary care status
    for (const petEntry of application.pets) {
      let pet = await Pet.findOne({ petCode: petEntry.petCode });
      if (!pet) {
        pet = await AdoptionPet.findOne({ petCode: petEntry.petCode });
      }

      if (pet) {
        pet.temporaryCareStatus = {
          inCare: true,
          applicationId: application._id,
          centerId: application.centerId,
          startDate: new Date()
        };
        await pet.save();
      }
    }

    res.json({
      success: true,
      message: 'Pet handover completed successfully',
      data: {
        application,
        careStartDate: application.careStartDate
      }
    });
  } catch (error) {
    console.error('Verify handover OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  createApplicationPaymentOrder,
  verifyApplicationPayment,
  getApplicationPaymentHistory,
  generateHandoverOTP,
  verifyHandoverOTP
};
