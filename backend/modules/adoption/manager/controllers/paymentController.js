const AdoptionPet = require('../models/AdoptionPet');
const AdoptionRequest = require('../models/AdoptionRequest');
const User = require('../../../../core/models/User');
const paymentService = require('../../../../core/services/paymentService');
const { sendMail } = require('../../../../core/utils/email');
const { sendSMS } = require('../../../../core/utils/sms');
const path = require('path');
const fs = require('fs');

const createPaymentOrder = async (req, res) => {
  try {
    const { applicationId, amount } = req.body;
    
    const application = await AdoptionRequest.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.status !== 'approved' && application.status !== 'completed' && application.status !== 'payment_completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Application must be approved before payment' 
      });
    }

    const orderResult = await paymentService.createOrder(amount, 'INR', {
      applicationId: applicationId,
      userId: application.userId,
      petId: application.petId
    });

    if (!orderResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: orderResult.error 
      });
    }

    // Update application with order details
    application.paymentDetails.razorpayOrderId = orderResult.order.id;
    application.paymentStatus = 'processing';
    await application.save();

    res.json({
      success: true,
      data: {
        orderId: orderResult.order.id,
        amount: orderResult.order.amount,
        currency: orderResult.order.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, applicationId } = req.body;

    const isVerified = paymentService.verifyPayment(signature, orderId, paymentId);
    
    if (!isVerified) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment verification failed' 
      });
    }

    const application = await AdoptionRequest.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Get payment details from Razorpay
    const paymentDetails = await paymentService.getPaymentDetails(paymentId);
    if (!paymentDetails.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to fetch payment details' 
      });
    }

    // Update application with payment details
    application.paymentDetails = {
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      amount: paymentDetails.payment.amount / 100, // Convert from paise
      currency: paymentDetails.payment.currency,
      transactionId: paymentDetails.payment.id
    };

    await application.completePayment(application.paymentDetails);

    // Complete adoption
    const pet = await AdoptionPet.findById(application.petId);
    if (pet) {
      pet.completeAdoption();
      await pet.save();
    }

    // Update centralized registry to reflect new owner (adopter)
    try {
      const PetRegistryService = require('../../../../../core/services/petRegistryService');
      await PetRegistryService.updateState({
        petCode: pet?.petCode,
        currentOwnerId: application.userId,
        currentLocation: 'at_owner',
        currentStatus: 'owned',
        actorUserId: application.userId,
        lastTransferAt: new Date()
      });
    } catch (regErr) {
      console.warn('PetRegistry state sync failed (adoption complete):', regErr?.message || regErr);
    }

    res.json({
      success: true,
      message: 'Payment verified and adoption completed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateContract = async (req, res) => {
  try {
    const application = await AdoptionRequest.findById(req.params.applicationId).populate('petId', 'name breed species').populate('userId', 'name email');
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Allow contract generation for applications with completed payment or already completed adoption
    if (application.paymentStatus !== 'completed' && application.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment must be completed before generating contract' 
      });
    }

    // Try to load pdfkit dynamically
    let PDFDocument
    try { PDFDocument = require('pdfkit') } catch (e) {
      return res.status(500).json({ success: false, error: 'PDF generator not available. Please install dependency: npm install pdfkit' })
    }
    const fs = require('fs')
    const path = require('path')

    // Prepare output directory - Save in the certificate directory for consistency
    const dir = path.join(__dirname, '..', '..', 'uploads', 'adoption', 'manager', 'certificate')
    try { fs.mkdirSync(dir, { recursive: true }) } catch (_) {}
    const filename = `${String(application._id)}_contract.pdf`
    const filePath = path.join(dir, filename)
    const fileUrl = `/uploads/adoption/manager/certificate/${filename}`

    // Generate a simple PDF
    await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 })
        const stream = fs.createWriteStream(filePath)
        doc.pipe(stream)

        // Title
        doc.fontSize(20).text('Adoption Agreement / Contract', { align: 'center' })
        doc.moveDown(1)
        doc.fontSize(12)
        // Body
        doc.text(`Contract ID: ${application._id}`)
        doc.text(`Date: ${new Date().toLocaleDateString()}`)
        doc.moveDown(1)
        doc.text(`Adopter: ${application.userId?.name || 'Adopter'} (${application.userId?.email || ''})`)
        doc.text(`Pet: ${application.petId?.name || 'Pet'} — ${application.petId?.breed || ''} (${application.petId?.species || ''})`)
        doc.moveDown(1)
        doc.text('This agreement certifies that the above-named adopter has completed the adoption of the pet described herein. All responsibilities and care for the pet are transferred to the adopter as of the date stated.', { align: 'left' })
        doc.moveDown(2)
        doc.text('Manager Signature: ___________________________', { continued: false })
        doc.moveDown(1)
        doc.text('Adopter Signature: ___________________________', { continued: false })
        doc.end()

        stream.on('finish', resolve)
        stream.on('error', reject)
      } catch (err) { reject(err) }
    })

    await application.completeAdoption(fileUrl);

    res.json({
      success: true,
      data: { contractURL: fileUrl },
      message: 'Contract generated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getContract = async (req, res) => {
  try {
    const application = await AdoptionRequest.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (!application.contractURL) {
      return res.status(404).json({ 
        success: false, 
        error: 'Contract not generated yet' 
      });
    }

    res.json({
      success: true,
      data: { contractURL: application.contractURL }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  generateContract,
  getContract
};