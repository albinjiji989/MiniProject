const PetReservation = require('../../user/models/PetReservation');
const PetInventoryItem = require('../models/PetInventoryItem');
const OwnershipHistory = require('../../../../core/models/OwnershipHistory');
const { getStoreFilter } = require('../../../../core/utils/storeFilter');
const { sendMail } = require('../../../../core/utils/email');
const mongoose = require('mongoose');
const petshopBlockchainService = require('../../core/services/petshopBlockchainService');

// Schedule handover with OTP generation (Manager version)
const scheduleHandover = async (req, res) => {
  try {
    // Fix: Use 'id' instead of 'reservationId' to match the route parameter
    const { id } = req.params;
    const { scheduledAt, location, notes } = req.body;
    
    console.log('Schedule handover request:', { reservationId: id, userId: req.user?._id, role: req.user?.role });
    
    // Validate ObjectId format - more permissive approach
    if (id && typeof id === 'string' && id.length === 24) {
      // Check if it's a valid hex string
      const hexRegex = /^[0-9a-fA-F]{24}$/;
      if (!hexRegex.test(id)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid reservation ID format. The ID should be a 24-character hexadecimal string.' 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reservation ID format. Please check the URL and try again.' 
      });
    }
    
    // Try to find reservation
    const reservation = await PetReservation.findById(id)
      .populate('itemId')
      .populate('userId', 'name email');
    
    console.log('Reservation lookup result:', reservation ? { 
      id: reservation._id, 
      status: reservation.status, 
      itemId: reservation.itemId?._id,
      storeId: reservation.itemId?.storeId
    } : null);
    
    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: `Reservation with ID ${id} not found. Please verify the reservation ID is correct and the reservation exists.` 
      });
    }
    
    // Check if reservation is in a valid status for handover
    const validStatuses = ['paid', 'ready_pickup'];
    if (!validStatuses.includes(reservation.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Reservation is not ready for handover. Current status: ${reservation.status}. ` +
                 `Handover can only be scheduled for reservations with status: ${validStatuses.join(' or ')}. ` +
                 `Please update the reservation status first.`
      });
    }
    
    // Verify the reservation belongs to manager's store (only in production)
    if (process.env.NODE_ENV === 'production') {
      const storeFilter = getStoreFilter(req.user);
      console.log('Store filter:', storeFilter);
      
      if (Object.keys(storeFilter).length > 0 && reservation.itemId.storeId.toString() !== storeFilter.storeId.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied. This reservation does not belong to your store.' });
      }
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update reservation with handover details
    reservation.handover = {
      ...reservation.handover,
      status: 'scheduled',
      method: 'pickup',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      notes: notes || '',
      location: {
        ...(location || {}),
        phone: location?.phone || reservation.contactInfo?.phone || ''
      }
    };
    
    // Add OTP to history
    if (!reservation.handover.otpHistory) {
      reservation.handover.otpHistory = [];
    }
    reservation.handover.otpHistory.push({
      otp: otp,
      generatedAt: new Date()
    });
    
    reservation.status = 'ready_pickup';
    
    await reservation.save();
    
    // Blockchain: Log OTP generation for handover
    try {
      const pet = reservation.itemId;
      if (pet && pet._id) {
        await petshopBlockchainService.addBlock('HANDOVER_OTP_GENERATED', {
          petId: pet._id,
          petCode: pet.petCode,
          reservationId: reservation._id,
          userId: reservation.userId._id,
          generatedBy: req.user._id,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
          location,
          previousStatus: 'paid',
          newStatus: 'ready_pickup'
        });
        console.log(`🔗 Blockchain: Handover OTP generated for ${pet.petCode}`);
      }
    } catch (blockchainErr) {
      console.warn('⚠️  Blockchain logging failed:', blockchainErr.message);
    }
    
    // Send email notification with OTP
    try {
      await sendMail({
        to: reservation.userId.email,
        subject: 'Pet Handover Scheduled - OTP Included',
        html: `
          <h2>Pet Handover Scheduled</h2>
          <p>Hello ${reservation.userId.name},</p>
          <p>Your pet handover has been scheduled for ${new Date(scheduledAt).toLocaleDateString()}.</p>
          <p><strong>Your OTP for pickup: ${otp}</strong></p>
          <p>Please provide this OTP to the manager when picking up your pet.</p>
          <p>Reservation Code: ${reservation.reservationCode}</p>
          <p>Pet: ${reservation.itemId.name}</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send handover email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Handover scheduled successfully',
      data: { reservation }
    });
    
  } catch (err) {
    console.error('Schedule handover error:', err);
    res.status(500).json({ success: false, message: 'Failed to schedule handover. Please try again later.' });
  }
};

// Complete handover with OTP verification (Manager version)
const completeHandover = async (req, res) => {
  try {
    // Fix: Use 'id' instead of 'reservationId' to match the route parameter
    const { id } = req.params;
    const { otp } = req.body;
    
    console.log('Complete handover request:', { reservationId: id, userId: req.user?._id, role: req.user?.role, otp });
    
    // Validate ObjectId format - more permissive approach
    if (id && typeof id === 'string' && id.length === 24) {
      // Check if it's a valid hex string
      const hexRegex = /^[0-9a-fA-F]{24}$/;
      if (!hexRegex.test(id)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid reservation ID format. The ID should be a 24-character hexadecimal string.' 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reservation ID format. Please check the URL and try again.' 
      });
    }
    
    // Validate OTP
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP format. Please provide a 6-digit numeric OTP.' 
      });
    }
    
    // Try to find reservation with proper population
    const reservation = await PetReservation.findById(id)
      .populate({
        path: 'itemId',
        populate: [
          { path: 'speciesId', select: 'name displayName' },
          { path: 'breedId', select: 'name' },
          { path: 'imageIds' } // Populate imageIds to ensure images virtual field can be populated
        ]
      })
      .populate('userId', 'name email');
    
    // Manually populate the virtual 'images' field for the item
    if (reservation && reservation.itemId) {
      await reservation.itemId.populate('images');
    }
    
    console.log('Reservation lookup result:', reservation ? { 
      id: reservation._id, 
      status: reservation.status, 
      itemId: reservation.itemId?._id,
      storeId: reservation.itemId?.storeId
    } : null);
    
    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: `Reservation with ID ${id} not found. Please verify the reservation ID is correct and the reservation exists.` 
      });
    }
    
    // Check if reservation is in a valid status for handover completion
    if (reservation.status !== 'ready_pickup') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot complete handover. Current status: ${reservation.status}. ` +
                 `Handover can only be completed for reservations with status: ready_pickup.`
      });
    }
    
    // Verify the reservation belongs to manager's store (only in production)
    if (process.env.NODE_ENV === 'production') {
      const storeFilter = getStoreFilter(req.user);
      console.log('Store filter:', storeFilter);
      
      if (Object.keys(storeFilter).length > 0 && reservation.itemId.storeId.toString() !== storeFilter.storeId.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied. This reservation does not belong to your store.' });
      }
    }
    
    // Verify OTP from the handover field
    console.log('OTP verification - handover data:', reservation.handover);
    if (!reservation.handover || !Array.isArray(reservation.handover.otpHistory)) {
      return res.status(400).json({ success: false, message: 'No OTP history found for this reservation.' });
    }
    
    const latestOtpRecord = reservation.handover.otpHistory
      .filter(record => !record.used)
      .sort((a, b) => b.generatedAt - a.generatedAt)[0];
    
    console.log('Latest OTP record:', latestOtpRecord);
    console.log('Provided OTP:', otp);
    
    if (!latestOtpRecord || latestOtpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check the OTP provided by the customer.' });
    }
    
    // Mark OTP as used
    const otpRecord = reservation.handover.otpHistory.find(record => record.otp === otp);
    if (otpRecord) {
      otpRecord.used = true;
      otpRecord.usedAt = new Date();
    }
    
    // Update reservation status
    reservation.handover.status = 'completed';
    reservation.handoverCompletedAt = new Date();
    reservation.status = 'at_owner';
    
    await reservation.save();
    
    // Blockchain: Log handover completion
    try {
      const pet = reservation.itemId;
      if (pet && pet._id) {
        await petshopBlockchainService.addBlock('HANDOVER_COMPLETED', {
          petId: pet._id,
          petCode: pet.petCode,
          reservationId: reservation._id,
          userId: reservation.userId._id,
          completedBy: req.user._id,
          completedAt: new Date(),
          previousStatus: 'ready_pickup',
          newStatus: 'at_owner'
        });
        console.log(`🔗 Blockchain: Handover completed for ${pet.petCode}`);
      }
    } catch (blockchainErr) {
      console.warn('⚠️  Blockchain logging failed:', blockchainErr.message);
    }
    
    // Update inventory item status
    const inventoryItem = await PetInventoryItem.findById(reservation.itemId._id);
    if (inventoryItem) {
      inventoryItem.status = 'sold';
      inventoryItem.soldAt = new Date();
      inventoryItem.buyerId = reservation.userId._id;
      await inventoryItem.save();
    }
    
    // Transfer pet ownership using the existing function
    const { handlePetOwnershipTransfer } = require('../../user/controllers/reservationController');
    try {
      await handlePetOwnershipTransfer(reservation, req.user._id);
    } catch (petTransferError) {
      console.error('Failed to transfer pet ownership:', petTransferError);
      // Don't fail the entire operation if pet transfer fails
    }
    
    // Create ownership history
    try {
      await OwnershipHistory.create({
        pet: reservation.itemId._id,
        previousOwner: null, // No previous owner for pet shop purchase
        newOwner: reservation.userId._id,
        transferDate: new Date(),
        transferType: 'Sale',
        reason: 'Pet shop purchase',
        transferFee: {
          amount: reservation.paymentInfo?.amount || 0,
          currency: 'INR'
        },
        createdBy: req.user._id // Add the required createdBy field
      });
    } catch (ownershipError) {
      console.error('Failed to create ownership history:', ownershipError);
      // Don't fail the entire operation if ownership history creation fails
    }
    
    // Send completion email
    try {
      await sendMail({
        to: reservation.userId.email,
        subject: 'Pet Handover Completed Successfully',
        html: `
          <h2>Pet Handover Completed</h2>
          <p>Hello ${reservation.userId.name},</p>
          <p>Congratulations! Your pet handover has been completed successfully.</p>
          <p>The pet has been transferred to your dashboard.</p>
          <p>Reservation Code: ${reservation.reservationCode}</p>
          <p>Pet: ${reservation.itemId.name}</p>
          <p>Thank you for choosing our pet shop!</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send completion email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Handover completed successfully. The pet has been transferred to the user\'s dashboard.',
      data: { reservation }
    });
    
  } catch (err) {
    console.error('Complete handover error:', err);
    res.status(500).json({ success: false, message: 'Failed to complete handover. Please try again later.' });
  }
};

// Regenerate handover OTP (Manager version)
const regenerateHandoverOTP = async (req, res) => {
  try {
    // Fix: Use 'id' instead of 'reservationId' to match the route parameter
    const { id } = req.params;
    
    console.log('Regenerate OTP request:', { reservationId: id, userId: req.user?._id, role: req.user?.role });
    
    // Validate ObjectId format - more permissive approach
    if (id && typeof id === 'string' && id.length === 24) {
      // Check if it's a valid hex string
      const hexRegex = /^[0-9a-fA-F]{24}$/;
      if (!hexRegex.test(id)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid reservation ID format. The ID should be a 24-character hexadecimal string.' 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reservation ID format. Please check the URL and try again.' 
      });
    }
    
    // Try to find reservation
    const reservation = await PetReservation.findById(id)
      .populate('itemId')
      .populate('userId', 'name email');
    
    console.log('Reservation lookup result:', reservation ? { 
      id: reservation._id, 
      status: reservation.status, 
      itemId: reservation.itemId?._id,
      storeId: reservation.itemId?.storeId
    } : null);
    
    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: `Reservation with ID ${id} not found. Please verify the reservation ID is correct and the reservation exists.` 
      });
    }
    
    // Check if reservation is in a valid status for OTP regeneration
    if (reservation.status !== 'ready_pickup') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot regenerate OTP. Current status: ${reservation.status}. ` +
                 `OTP can only be regenerated for reservations with status: ready_pickup.`
      });
    }
    
    // Verify the reservation belongs to manager's store (only in production)
    if (process.env.NODE_ENV === 'production') {
      const storeFilter = getStoreFilter(req.user);
      console.log('Store filter:', storeFilter);
      
      if (Object.keys(storeFilter).length > 0 && reservation.itemId.storeId.toString() !== storeFilter.storeId.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied. This reservation does not belong to your store.' });
      }
    }
    
    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Add OTP to history
    if (!reservation.handover.otpHistory) {
      reservation.handover.otpHistory = [];
    }
    reservation.handover.otpHistory.push({
      otp: otp,
      generatedAt: new Date()
    });
    
    await reservation.save();
    
    // Send email notification with new OTP
    try {
      await sendMail({
        to: reservation.userId.email,
        subject: 'New OTP for Pet Handover',
        html: `
          <h2>New OTP for Pet Handover</h2>
          <p>Hello ${reservation.userId.name},</p>
          <p>A new OTP has been generated for your pet handover.</p>
          <p><strong>Your new OTP for pickup: ${otp}</strong></p>
          <p>Please provide this OTP to the manager when picking up your pet.</p>
          <p>Reservation Code: ${reservation.reservationCode}</p>
          <p>Pet: ${reservation.itemId.name}</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send OTP regeneration email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'New OTP generated successfully',
      data: { reservation }
    });
    
  } catch (err) {
    console.error('Regenerate handover OTP error:', err);
    res.status(500).json({ success: false, message: 'Failed to regenerate OTP. Please try again later.' });
  }
};

module.exports = {
  scheduleHandover,
  completeHandover,
  regenerateHandoverOTP
};