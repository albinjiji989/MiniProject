const crypto = require('crypto');
const PetReservation = require('../models/PetReservation');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');
const OwnershipHistory = require('../../../../core/models/OwnershipHistory');
const PetHistory = require('../../../../core/models/PetHistory');
const PetRegistryService = require('../../../../core/services/petRegistryService');
const { sendMail } = require('../../../../core/utils/email');

// ===== Payment Gateway =====
const createRazorpayOrder = async (req, res) => {
  try {
    const { reservationId, amount, deliveryMethod, deliveryAddress } = req.body;
    
    console.log('Creating payment order for:', {
      reservationId,
      userId: req.user._id,
      deliveryMethod,
      hasRazorpayKeys: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    });
    
    // Verify reservation exists and belongs to user
    const reservation = await PetReservation.findOne({ 
      _id: reservationId, 
      userId: req.user._id 
    }).populate('itemId');
    
    if (!reservation) {
      console.log('Reservation not found for ID:', reservationId);
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    console.log('Found reservation:', {
      id: reservation._id,
      status: reservation.status,
      itemId: reservation.itemId?._id,
      itemPrice: reservation.itemId?.price
    });
    
    if (reservation.status === 'paid' || reservation.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Reservation already paid' });
    }
    // Only allow payment when user has confirmed intent or already pending
    if (!['going_to_buy', 'payment_pending', 'approved'].includes(reservation.status)) {
      return res.status(400).json({ success: false, message: `Reservation not ready for payment (status=${reservation.status})` })
    }
    
    // Calculate total amount
    const petPrice = Number(reservation.itemId?.price || 0);
    if (!petPrice || Number.isNaN(petPrice) || petPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Item price not set for this reservation' })
    }
    const deliveryCharges = deliveryMethod === 'delivery' ? 500 : 0;
    const taxes = Math.round(petPrice * 0.18);
    const totalAmount = petPrice + deliveryCharges + taxes;
    
    // Use real Razorpay test mode with your test keys
    const useSandbox = false;
    
    // Create real Razorpay order using test keys
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    
    // Build compact receipt id (Razorpay requires <= 40 chars)
    const shortResId = String(reservationId).slice(-8)
    let receipt = `rcpt_${shortResId}_${Date.now().toString().slice(-6)}`
    if (receipt.length > 40) receipt = receipt.slice(0, 40)

    const options = {
      amount: totalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt,
      payment_capture: 1
    };
    
    console.log('Creating Razorpay order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order.id);
    
    // Update reservation with order details
    reservation.paymentDetails = {
      orderId: order.id,
      amount: totalAmount,
      currency: 'INR',
      deliveryMethod,
      deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
      status: 'pending'
    };
    reservation.status = 'payment_pending';
    await reservation.save();
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: totalAmount * 100,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  
  } catch (err) {
    console.error('Create Razorpay order error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      error: err.error
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
};

const verifyRazorpaySignature = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      reservationId,
      deliveryMethod,
      deliveryAddress
    } = req.body;
    
    console.log('Verifying payment:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      reservationId
    });
    
    // Use real Razorpay test mode - verify signature
    const useSandbox = false;
    
    if (!useSandbox) {
      // Verify signature (live)
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
      
      console.log('Signature verification:', {
        received: razorpay_signature,
        expected: expectedSignature,
        body
      });
      
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
    }
    
    // Update reservation
    const reservation = await PetReservation.findOne({ 
      _id: reservationId, 
      userId: req.user._id 
    }).populate('itemId').populate('userId', 'name email');
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    // Update payment details
    reservation.paymentDetails = {
      ...reservation.paymentDetails,
      paymentId: razorpay_payment_id || `mock_payment_${Date.now()}`,
      signature: razorpay_signature || 'mock_signature',
      status: 'completed',
      paidAt: new Date()
    };
    reservation.status = 'paid';
    
    // Update inventory item status
    const inventoryItem = await PetInventoryItem.findById(reservation.itemId._id);
    if (inventoryItem) {
      inventoryItem.status = 'sold';
      inventoryItem.soldAt = new Date();
      inventoryItem.buyerId = req.user._id;
      await inventoryItem.save();
    }
    
    await reservation.save();
    
    // Create ownership history
    await OwnershipHistory.create({
      pet: reservation.itemId._id,
      previousOwner: null, // No previous owner for pet shop purchase
      newOwner: req.user._id,
      transferDate: new Date(),
      transferType: 'Sale',
      reason: 'Pet shop purchase',
      transferFee: {
        amount: reservation.paymentDetails.amount,
        currency: 'INR',
        paid: true,
        paymentMethod: 'Card'
      },
      notes: `Purchased through Pet Shop - ${deliveryMethod === 'delivery' ? 'Home Delivery' : 'Store Pickup'}`,
      createdBy: req.user._id,
      status: 'Completed'
    });
    
    // Update centralized pet registry with initial ownership
    try {
      const PetRegistryService = require('../../../../core/services/petRegistryService');
      
      // Create/update registry entry with source tracking
      await PetRegistryService.upsertAndSetState({
        petCode: inventoryItem.petCode,
        name: inventoryItem.name,
        species: inventoryItem.speciesId,
        breed: inventoryItem.breedId,
        images: inventoryItem.images || [],
        source: 'petshop',
        petShopItemId: inventoryItem._id,
        actorUserId: req.user._id,
        firstAddedSource: 'pet_shop',
        firstAddedBy: req.user._id // The store/manager who added it
      }, {
        currentOwnerId: req.user._id,
        currentLocation: deliveryMethod === 'delivery' ? 'in_transit' : 'at_petshop',
        currentStatus: 'sold',
        lastTransferAt: new Date()
      });
      
      // Record ownership transfer in registry
      await PetRegistryService.recordOwnershipTransfer({
        petCode: inventoryItem.petCode,
        previousOwnerId: null,
        newOwnerId: req.user._id,
        transferType: 'purchase',
        transferPrice: reservation.paymentDetails.amount,
        transferReason: 'Pet Shop Purchase',
        source: 'petshop',
        notes: `Payment completed - ${deliveryMethod} selected`,
        performedBy: req.user._id
      });
    } catch (regErr) {
      console.warn('PetRegistry ownership tracking failed:', regErr?.message || regErr);
    }

    // Log pet history events
    // Payment completed event
    await PetHistory.logEvent({
      petId: reservation.itemId._id,
      inventoryItemId: reservation.itemId._id,
      eventType: 'payment_completed',
      eventDescription: `Payment of ₹${reservation.paymentDetails.amount} completed via Razorpay`,
      performedBy: req.user._id,
      performedByRole: 'user',
      relatedDocuments: [{
        documentType: 'payment',
        documentId: reservation._id
      }],
      metadata: {
        paymentAmount: reservation.paymentDetails.amount,
        paymentMethod: 'razorpay',
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
        notes: `Transaction ID: ${razorpay_payment_id}`,
        systemGenerated: false
      },
      storeId: reservation.itemId.storeId,
      storeName: reservation.itemId.storeName
    });

    // Ownership transferred event
    await PetHistory.logEvent({
      petId: reservation.itemId._id,
      inventoryItemId: reservation.itemId._id,
      eventType: 'ownership_transferred',
      eventDescription: `Pet ownership transferred to ${reservation.userId.name}`,
      performedBy: req.user._id,
      performedByRole: 'user',
      relatedDocuments: [{
        documentType: 'ownership_transfer',
        documentId: reservation._id
      }],
      previousValue: { owner: null },
      newValue: { owner: req.user._id },
      metadata: {
        paymentAmount: reservation.paymentDetails.amount,
        deliveryMethod,
        notes: `Purchased from Pet Shop`,
        systemGenerated: true
      },
      storeId: reservation.itemId.storeId,
      storeName: reservation.itemId.storeName
    });
    
    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        transactionId: reservation._id,
        paymentId: razorpay_payment_id,
        amount: reservation.paymentDetails.amount,
        status: 'completed',
        deliveryMethod,
        deliveryAddress
      }
    });
    
  } catch (err) {
    console.error('Verify Razorpay signature error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      reservationId,
      orderId: razorpay_order_id
    });
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
};

// User confirms they want to buy after manager approval
const confirmPurchaseDecision = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { wantsToBuy, notes } = req.body;
    
    const reservation = await PetReservation.findOne({
      _id: reservationId,
      userId: req.user._id,
      status: 'approved'
    }).populate('itemId');
    
    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Approved reservation not found' 
      });
    }
    
    // Update user decision
    reservation.userDecision = {
      wantsToBuy: wantsToBuy,
      decisionDate: new Date(),
      decisionNotes: notes || '',
      remindersSent: 0
    };
    
    // Update status based on decision
    if (wantsToBuy) {
      reservation.status = 'going_to_buy';
      reservation._statusChangeNote = 'User confirmed purchase intention';
    } else {
      reservation.status = 'cancelled';
      reservation._statusChangeNote = 'User declined to purchase';
      
      // Make pet available again
      if (reservation.itemId) {
        reservation.itemId.status = 'available_for_sale';
        await reservation.itemId.save();
      }
    }
    
    reservation._updatedBy = req.user._id;
    await reservation.save();
    
    // Log pet history
    await PetHistory.logEvent({
      petId: reservation.itemId._id,
      inventoryItemId: reservation.itemId._id,
      eventType: wantsToBuy ? 'reservation_confirmed' : 'reservation_declined',
      eventDescription: wantsToBuy ? 
        'User confirmed intention to purchase pet' : 
        'User declined to purchase pet',
      performedBy: req.user._id,
      performedByRole: 'user',
      relatedDocuments: [{
        documentType: 'reservation',
        documentId: reservation._id
      }],
      metadata: {
        userDecision: wantsToBuy,
        notes: notes || '',
        systemGenerated: false
      },
      storeId: reservation.itemId.storeId,
      storeName: reservation.itemId.storeName
    });
    
    res.json({
      success: true,
      message: wantsToBuy ? 
        'Purchase confirmed! You can now proceed to payment.' : 
        'Reservation cancelled successfully.',
      data: { 
        reservation,
        nextStep: wantsToBuy ? 'payment' : 'completed'
      }
    });
    
  } catch (err) {
    console.error('Confirm purchase decision error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update delivery status (for managers)
const updateDeliveryStatus = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { status, deliveryNotes, actualDate } = req.body;
    
    const reservation = await PetReservation.findById(reservationId)
      .populate('itemId')
      .populate('userId', 'name email');
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    // Update delivery info
    if (!reservation.deliveryInfo) {
      reservation.deliveryInfo = {};
    }
    
    if (actualDate) {
      reservation.deliveryInfo.actualDate = new Date(actualDate);
    }
    
    if (deliveryNotes) {
      reservation.deliveryInfo.deliveryNotes = deliveryNotes;
    }
    
    // Update reservation status
    const previousStatus = reservation.status;
    reservation.status = status;
    reservation._statusChangeNote = `Delivery status updated: ${status}`;
    reservation._updatedBy = req.user._id;
    
    await reservation.save();
    
    // If status is completed (or legacy at_owner), transfer ownership and create pet record
    if ((status === 'completed' || status === 'at_owner') && previousStatus !== status) {
      await handlePetOwnershipTransfer(reservation, req.user._id);
    }
    // Log pet history for delivery status change
    try {
      await PetHistory.logEvent({
        petId: reservation.itemId?._id || reservation.itemId,
        inventoryItemId: reservation.itemId?._id || reservation.itemId,
        eventType: 'status_changed',
        eventDescription: `Delivery status updated to ${status}`,
        performedBy: req.user._id,
        performedByRole: 'manager',
        relatedDocuments: [{
          documentType: 'reservation',
          documentId: reservation._id
        }],
        metadata: {
          deliveryMethod: reservation.deliveryInfo?.method || 'pickup',
          deliveryNotes: deliveryNotes || '',
          actualDeliveryDate: actualDate || new Date(),
          systemGenerated: false
        },
        storeId: reservation.itemId?.storeId,
        storeName: reservation.itemId?.storeName
      });
    } catch (logErr) {
      console.warn('PetHistory log failed (updateDeliveryStatus):', logErr?.message || logErr);
    }
    // Central registry sync (identity + state)
    try {
      const item = reservation.itemId
      if (item?.petCode) {
        // Identity upsert from inventory
        await PetRegistryService.upsertIdentity({
          petCode: item.petCode,
          name: item.name || 'Pet',
          species: item.speciesId,
          breed: item.breedId,
          images: Array.isArray(item.images) ? item.images.map(img => ({ url: img.url, caption: img.caption, isPrimary: !!img.isPrimary })) : [],
          source: 'petshop',
          petShopItemId: item._id,
          actorUserId: req.user._id,
          metadata: { storeId: item.storeId, storeName: item.storeName }
        })

        // State mapping based on reservation status
        let currentLocation = 'at_petshop'
        let currentStatus = item.status || 'in_petshop'
        let currentOwnerId = undefined
        if (status === 'ready_pickup') {
          currentLocation = 'in_transit'
          currentStatus = 'reserved'
        }
        if (status === 'completed' || status === 'at_owner') {
          currentLocation = 'at_owner'
          currentStatus = 'sold'
          currentOwnerId = reservation.userId?._id || reservation.userId
        }
        await PetRegistryService.updateState({
          petCode: item.petCode,
          currentOwnerId,
          currentLocation,
          currentStatus,
          actorUserId: req.user._id,
          lastTransferAt: (status === 'completed' || status === 'at_owner') ? new Date() : undefined
        })
      }
    } catch (regErr) {
      console.warn('PetRegistry sync failed (updateDeliveryStatus):', regErr?.message || regErr)
    }
    
    res.json({
      success: true,
      message: `Delivery status updated to ${status}`,
      data: { reservation }
    });
    
  } catch (err) {
    console.error('Update delivery status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Handle pet ownership transfer when order is completed
const handlePetOwnershipTransfer = async (reservation, managerId) => {
  try {
    const Pet = require('../../../core/models/Pet');
    
    // Create or update pet record in main Pet collection
    let pet = await Pet.findOne({ petCode: reservation.itemId.petCode });
    
    if (!pet) {
      // Create new pet record
      pet = new Pet({
        name: reservation.itemId.name,
        petCode: reservation.itemId.petCode,
        speciesId: reservation.itemId.speciesId,
        breedId: reservation.itemId.breedId,
        age: reservation.itemId.age,
        gender: reservation.itemId.gender,
        color: reservation.itemId.color,
        weight: reservation.itemId.weight,
        description: reservation.itemId.description,
        images: reservation.itemId.images,
        healthStatus: reservation.itemId.healthStatus,
        vaccinations: reservation.itemId.vaccinations,
        medicalHistory: reservation.itemId.medicalHistory,
        currentOwnerId: reservation.userId._id,
        status: 'owned',
        source: 'petshop_purchase',
        acquiredDate: new Date(),
        createdBy: managerId
      });
      await pet.save();
    } else {
      // Update existing pet record
      pet.currentOwnerId = reservation.userId._id;
      pet.status = 'owned';
      pet.acquiredDate = new Date();
      await pet.save();
    }
    
    // Create ownership history record
    await OwnershipHistory.create({
      pet: pet._id,
      previousOwner: null, // No previous owner for pet shop purchase
      newOwner: reservation.userId._id,
      transferDate: new Date(),
      transferType: 'Sale',
      reason: 'Pet shop purchase - delivery completed',
      transferFee: {
        amount: reservation.paymentDetails.amount,
        currency: 'INR',
        paid: true,
        paymentMethod: 'Card'
      },
      notes: `Pet purchased from pet shop and delivered. Reservation: ${reservation.reservationCode || reservation._id}`,
      createdBy: managerId,
      status: 'Completed'
    });
    
    // Log comprehensive pet history
    await PetHistory.logEvent({
      petId: pet._id,
      inventoryItemId: reservation.itemId._id,
      eventType: 'ownership_transferred',
      eventDescription: `Pet ownership transferred to ${reservation.userId.name} after successful purchase and delivery`,
      performedBy: managerId,
      performedByRole: 'manager',
      relatedDocuments: [{
        documentType: 'reservation',
        documentId: reservation._id
      }, {
        documentType: 'ownership_history',
        documentId: pet._id
      }],
      metadata: {
        purchaseAmount: reservation.paymentDetails.amount,
        deliveryMethod: reservation.paymentDetails.deliveryMethod,
        customerName: reservation.userId.name,
        customerEmail: reservation.userId.email,
        completionDate: new Date(),
        systemGenerated: false
      },
      storeId: reservation.itemId.storeId,
      storeName: reservation.itemId.storeName
    });
    
    console.log(`Pet ownership transferred: ${pet.petCode} -> ${reservation.userId.name}`);
    
  } catch (error) {
    console.error('Error in pet ownership transfer:', error);
    throw error;
  }
};

// Schedule handover with OTP generation (similar to adoption module)
const scheduleHandover = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { scheduledAt, location, notes } = req.body || {};
    
    // Validate input
    if (!scheduledAt) {
      return res.status(400).json({ success: false, error: 'Scheduled date is required' });
    }
    
    const scheduleDate = new Date(scheduledAt);
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }
    
    // Check if date is in the future
    if (scheduleDate <= new Date()) {
      return res.status(400).json({ success: false, error: 'Scheduled date must be in the future' });
    }
    
    // Find reservation
    const reservation = await PetReservation.findById(reservationId)
      .populate('itemId')
      .populate('userId', 'name email phone');
    
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }
    
    // Check if reservation is in the right status
    if (reservation.status !== 'paid') {
      return res.status(400).json({ success: false, error: 'Payment must be completed before scheduling handover' });
    }
    
    // For pet shop pickup - use store location or default
    const petShopLocation = {
      address: location?.address || reservation.itemId?.storeName || 'Pet Shop - Main Branch, 123 Pet Welfare Road, Animal City',
      name: reservation.itemId?.storeName || 'Pet Shop',
      phone: location?.phone || '+91-9876543210'
    };
    
    // Initialize handover object
    reservation.handover = reservation.handover || {};
    reservation.handover.method = 'pickup'; // Only pickup at pet shop
    reservation.handover.scheduledAt = scheduleDate;
    reservation.handover.location = petShopLocation;
    reservation.handover.notes = notes || '';
    
    // Generate 6-digit OTP
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in history
    if (!reservation.handover.otpHistory) reservation.handover.otpHistory = [];
    reservation.handover.otpHistory.push({
      otp: newOTP,
      generatedAt: new Date(),
      used: false
    });
    
    reservation.handover.status = 'scheduled';
    await reservation.save();
    
    // Notify user with handover details and OTP
    let emailSent = false;
    let emailError = null;
    try {
      let toEmail = '';
      if (reservation?.userId && typeof reservation.userId === 'object' && reservation.userId.email) {
        toEmail = typeof reservation.userId.email === 'string' && reservation.userId.email.includes('@') ? reservation.userId.email : '';
      }
      
      let petName = '';
      if (reservation?.itemId && typeof reservation.itemId === 'object' && reservation.itemId.name) {
        petName = reservation.itemId.name;
      }
      
      const subject = 'Pet Shop Handover Scheduled - OTP Required';
      const scheduled = reservation.handover?.scheduledAt ? new Date(reservation.handover.scheduledAt).toLocaleString() : 'soon';
      
      // Use the OTP from the history array
      const currentOTP = reservation.handover.otpHistory && reservation.handover.otpHistory.length > 0 
        ? reservation.handover.otpHistory[reservation.handover.otpHistory.length - 1].otp 
        : 'ERROR: No OTP generated';
      
      const message = `Hello${reservation.userId?.name ? ' ' + reservation.userId.name : ''}, 
      
Your handover for ${petName || 'your purchased pet'} is scheduled on ${scheduled} at our pet shop.
Location: ${petShopLocation.address}

IMPORTANT: You must present this OTP code when picking up your pet: ${currentOTP}

Please arrive 15 minutes before your scheduled time. No pets will be released without the correct OTP.

Thank you,
Pet Shop Team`;
      
      if (toEmail && subject) { 
        try { 
          await sendMail({to: toEmail, subject, html: message}); 
          emailSent = true;
        } catch (err) {
          emailError = err.message;
          console.error('[EMAIL] Failed to send handover email:', err);
        }
      }
    } catch (err) {
      emailError = err.message;
      console.error('[EMAIL] Error preparing handover email:', err);
    }
    
    const response = { 
      success: true, 
      data: { ...reservation.handover },
      message: emailSent 
        ? 'Handover scheduled and OTP sent to customer\'s email' 
        : `Handover scheduled${emailError ? ` but email failed to send: ${emailError}` : ' but email could not be sent (no email address found)'}` 
    };
    
    // Add email error info if there was one
    if (emailError) {
      response.emailError = emailError;
    }
    
    return res.json(response);
  } catch (e) {
    console.error('[HANDOVER] Error scheduling handover:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
};

// Complete handover with OTP verification (similar to adoption module)
const completeHandover = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { otp, proofDocs } = req.body || {};
    const reservation = await PetReservation.findById(reservationId)
      .populate('itemId')
      .populate('userId', 'name email');
    
    if (!reservation) return res.status(404).json({ success: false, error: 'Reservation not found' });
    if (!reservation.handover || reservation.handover.status !== 'scheduled') {
      return res.status(400).json({ success: false, error: 'Handover is not scheduled' });
    }
    
    // Verify OTP with better error handling
    if (!otp) {
      return res.status(400).json({ success: false, error: 'OTP is required' });
    }
    
    if (typeof otp !== 'string' || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, error: 'Invalid OTP format. Must be a 6-digit number.' });
    }
    
    // Get the current OTP from the history array (most recent entry)
    let currentOTP = reservation.handover.otp;
    let isOTPUsed = false;
    
    // Log the entire handover object for debugging
    console.log(`[OTP DEBUG] Handover object for reservation ${reservationId}:`, JSON.stringify(reservation.handover, null, 2));
    
    if (!currentOTP && reservation.handover.otpHistory && reservation.handover.otpHistory.length > 0) {
      // Get the most recent OTP from history if the direct field is not set
      const recentOTPEntry = reservation.handover.otpHistory[reservation.handover.otpHistory.length - 1];
      currentOTP = recentOTPEntry?.otp;
      isOTPUsed = recentOTPEntry?.used || false;
      console.log(`[OTP DEBUG] Got OTP from history. Current OTP: ${currentOTP}, Used: ${isOTPUsed}`);
    } else if (reservation.handover.otp) {
      // Check if the direct OTP field has been marked as used
      const recentOTPEntry = reservation.handover.otpHistory && reservation.handover.otpHistory.length > 0 
        ? reservation.handover.otpHistory[reservation.handover.otpHistory.length - 1] 
        : null;
      isOTPUsed = recentOTPEntry?.used || false;
      currentOTP = reservation.handover.otp;
      console.log(`[OTP DEBUG] Got OTP from direct field. Current OTP: ${currentOTP}, Used: ${isOTPUsed}`);
    }
    
    // If we still don't have a current OTP, there's an issue
    if (!currentOTP) {
      console.log(`[OTP DEBUG] No valid OTP found for reservation ${reservationId}. Handover data:`, reservation.handover);
      return res.status(400).json({ success: false, error: 'No valid OTP found for this handover. Please regenerate the OTP.' });
    }
    
    // Check if OTP has already been used
    if (isOTPUsed) {
      console.log(`[OTP DEBUG] Attempt to use already used OTP for reservation ${reservationId}.`);
      return res.status(400).json({ success: false, error: 'This OTP has already been used. If you need a new OTP, please regenerate it.' });
    }
    
    if (otp !== currentOTP) {
      // Log the attempted OTP and the correct OTP for debugging (without exposing in response)
      console.log(`[OTP DEBUG] Invalid OTP attempt for reservation ${reservationId}. Provided: ${otp}, Expected: ${currentOTP}`);
      return res.status(400).json({ success: false, error: 'Invalid OTP. Please check the email sent to the customer and enter the correct 6-digit code. If you cannot find the email, ask the manager to regenerate the OTP.' });
    }
    
    // Check if OTP has expired (valid for 7 days)
    const scheduledTime = new Date(reservation.handover.scheduledAt);
    const now = new Date();
    const timeDiff = now - scheduledTime;
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      return res.status(400).json({ success: false, error: 'OTP has expired. Please contact the pet shop manager to schedule a new handover.' });
    }
    
    if (Array.isArray(proofDocs)) {
      reservation.handover.proofDocs = proofDocs.filter(Boolean);
    }
    
    reservation.handoverCompletedAt = new Date();
    // Mark OTP as used in history instead of clearing the field
    if (reservation.handover.otpHistory && reservation.handover.otpHistory.length > 0) {
      const latestOTPEntry = reservation.handover.otpHistory[reservation.handover.otpHistory.length - 1];
      if (latestOTPEntry) {
        latestOTPEntry.used = true;
        latestOTPEntry.usedAt = new Date();
      }
    }
    
    reservation.handover.status = 'completed';
    await reservation.save();
    
    // Update reservation status to 'at_owner' (final status)
    reservation.status = 'at_owner';
    await reservation.save();
    
    // Transfer ownership and create pet record (if not already done)
    await handlePetOwnershipTransfer(reservation, req.user._id);
    
    // Notify user
    try {
      let toEmail = '';
      if (reservation?.userId && typeof reservation.userId === 'object' && reservation.userId.email) {
        toEmail = typeof reservation.userId.email === 'string' && reservation.userId.email.includes('@') ? reservation.userId.email : '';
      }
      
      const subject = 'Pet Handover Completed - Congratulations!';
      const petName = reservation.itemId?.name || 'your pet';
      const message = `Hello${reservation.userId?.name ? ' ' + reservation.userId.name : ''},

Congratulations! The handover of ${petName} has been successfully completed.

Your pet is now officially yours and will appear in your dashboard under "My Pets".

Thank you for choosing our pet shop!

Best regards,
Pet Shop Team`;
      
      if (toEmail && subject) {
        await sendMail({to: toEmail, subject, html: message});
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }
    
    return res.json({ 
      success: true, 
      message: 'Handover completed successfully! The pet is now officially owned by the customer.',
      data: { 
        handover: reservation.handover,
        handoverCompletedAt: reservation.handoverCompletedAt
      }
    });
  } catch (e) {
    console.error('[HANDOVER] Error completing handover:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
};

// Regenerate OTP for handover (similar to adoption module)
const regenerateHandoverOTP = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reservation = await PetReservation.findById(reservationId)
      .populate('itemId')
      .populate('userId', 'name email phone');
    
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }
    
    if (!reservation.handover || reservation.handover.status !== 'scheduled') {
      return res.status(400).json({ success: false, error: 'Handover is not scheduled' });
    }
    
    // Generate new 6-digit OTP
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in history
    if (!reservation.handover.otpHistory) reservation.handover.otpHistory = [];
    reservation.handover.otpHistory.push({
      otp: newOTP,
      generatedAt: new Date(),
      used: false
    });
    
    await reservation.save();
    
    // Notify user with new OTP
    let emailSent = false;
    let emailError = null;
    try {
      let toEmail = '';
      if (reservation?.userId && typeof reservation.userId === 'object' && reservation.userId.email) {
        toEmail = typeof reservation.userId.email === 'string' && reservation.userId.email.includes('@') ? reservation.userId.email : '';
      }
      
      let petName = '';
      if (reservation?.itemId && typeof reservation.itemId === 'object' && reservation.itemId.name) {
        petName = reservation.itemId.name;
      }
      
      const subject = 'Pet Shop Handover - New OTP';
      const scheduled = reservation.handover?.scheduledAt ? new Date(reservation.handover.scheduledAt).toLocaleString() : 'soon';
      const petShopLocation = {
        address: reservation.handover?.location?.address || 'Pet Shop - Main Branch, 123 Pet Welfare Road, Animal City',
        name: reservation.itemId?.storeName || 'Pet Shop',
        phone: '+91-9876543210'
      };
      
      // Use the OTP from the history array
      const currentOTP = reservation.handover.otpHistory && reservation.handover.otpHistory.length > 0 
        ? reservation.handover.otpHistory[reservation.handover.otpHistory.length - 1].otp 
        : 'ERROR: No OTP generated';
      
      const message = `Hello${reservation.userId?.name ? ' ' + reservation.userId.name : ''}, 
      
A new OTP has been generated for your handover of ${petName || 'your purchased pet'} scheduled on ${scheduled} at our pet shop.
Location: ${petShopLocation.address}

IMPORTANT: You must present this OTP code when picking up your pet: ${currentOTP}

Please arrive 15 minutes before your scheduled time. No pets will be released without the correct OTP.

Thank you,
Pet Shop Team`;
      
      if (toEmail && subject) { 
        try { 
          await sendMail({to: toEmail, subject, html: message});
          emailSent = true;
        } catch (err) {
          emailError = err.message;
          console.error('[EMAIL] Failed to send OTP email:', err);
        } 
      }
    } catch (err) {
      emailError = err.message;
      console.error('[EMAIL] Error preparing OTP email:', err);
    }
    
    const message = emailSent 
      ? 'New OTP generated and sent to the customer\'s email. Please ask the customer to check their inbox (including spam folder) for the new 6-digit code.' 
      : `New OTP generated${emailError ? ` but email failed to send: ${emailError}` : ' but email could not be sent (no email address found)'}`;
      
    const response = { 
      success: true, 
      message,
      emailSent
    };
    
    // Add email error info if there was one
    if (emailError) {
      response.emailError = emailError;
    }
    
    return res.json(response);
  } catch (e) {
    console.error('[OTP] Error regenerating OTP:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
  confirmPurchaseDecision,
  updateDeliveryStatus,
  scheduleHandover,
  completeHandover,
  regenerateHandoverOTP
};