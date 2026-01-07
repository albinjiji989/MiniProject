const PetshopPurchaseApplication = require('../../manager/models/PetshopPurchaseApplication');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');
const PetRegistry = require('../../../../core/models/PetRegistry');
const User = require('../../../../core/models/User');
const { sendMail } = require('../../../../core/utils/email');
const mongoose = require('mongoose');

// Get all purchase applications for manager's store
const getPurchaseApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {
      isDeleted: false
    };
    
    // Only filter by storeId if it exists and is a valid ObjectId
    if (req.user.storeId && mongoose.Types.ObjectId.isValid(req.user.storeId)) {
      query.storeId = req.user.storeId;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const applications = await PetshopPurchaseApplication.find(query)
      .populate('userId', 'name email phone')
      .populate({
        path: 'petInventoryItemId',
        populate: [
          { path: 'speciesId', select: 'name displayName' },
          { path: 'breedId', select: 'name' },
          { path: 'images' }
        ]
      })
      .populate('userPhoto')
      .populate('documents')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await PetshopPurchaseApplication.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      }
    });
  } catch (error) {
    console.error('Get purchase applications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve purchase application
const approveApplication = async (req, res) => {
  try {
    const { approvalNotes } = req.body;
    
    // Build query - only filter by storeId if it's a valid ObjectId
    const query = { _id: req.params.id };
    if (req.user.storeId && mongoose.Types.ObjectId.isValid(req.user.storeId)) {
      query.storeId = req.user.storeId;
    }
    
    const application = await PetshopPurchaseApplication.findOne(query)
      .populate('userId', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'pending' && application.status !== 'under_review') {
      return res.status(400).json({ 
        success: false, 
        message: 'Application cannot be approved at this stage' 
      });
    }

    application.status = 'approved';
    application.reviewedBy = req.user._id;
    application.reviewDate = new Date();
    application.approvalNotes = approvalNotes;
    application.addStatusHistory('approved', req.user._id, approvalNotes);
    await application.save();

    // TODO: Send approval email with payment link

    res.json({ 
      success: true, 
      message: 'Application approved successfully',
      data: application
    });
  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject purchase application
const rejectApplication = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    
    // Build query - only filter by storeId if it's a valid ObjectId
    const query = { _id: req.params.id };
    if (req.user.storeId && mongoose.Types.ObjectId.isValid(req.user.storeId)) {
      query.storeId = req.user.storeId;
    }
    
    const application = await PetshopPurchaseApplication.findOne(query)
      .populate('userId', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'pending' && application.status !== 'under_review') {
      return res.status(400).json({ 
        success: false, 
        message: 'Application cannot be rejected at this stage' 
      });
    }

    application.status = 'rejected';
    application.reviewedBy = req.user._id;
    application.reviewDate = new Date();
    application.rejectionReason = rejectionReason;
    application.addStatusHistory('rejected', req.user._id, rejectionReason);
    await application.save();

    // TODO: Send rejection email

    res.json({ 
      success: true, 
      message: 'Application rejected successfully',
      data: application
    });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Schedule handover (after payment)
const scheduleHandover = async (req, res) => {
  try {
    const { scheduledDate, scheduledTime, handoverLocation } = req.body;
    
    // Build query - only filter by storeId if it's a valid ObjectId
    const query = { _id: req.params.id };
    if (req.user.storeId && mongoose.Types.ObjectId.isValid(req.user.storeId)) {
      query.storeId = req.user.storeId;
    }
    
    const application = await PetshopPurchaseApplication.findOne(query)
      .populate('userId', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'Handover can only be scheduled after payment is completed' 
      });
    }

    // Generate OTP
    const otp = application.generateOTP();
    
    application.status = 'scheduled';
    application.scheduledHandoverDate = new Date(scheduledDate);
    application.scheduledHandoverTime = scheduledTime;
    application.handoverLocation = handoverLocation || 'Pet Shop';
    application.addStatusHistory('scheduled', req.user._id, `Handover scheduled for ${scheduledDate} ${scheduledTime}`);
    await application.save();

    // Send OTP email to user
    let emailSent = false;
    let emailError = '';
    
    try {
      let toEmail = '';
      if (application.userId && typeof application.userId === 'object' && application.userId.email) {
        toEmail = typeof application.userId.email === 'string' && application.userId.email.includes('@') ? application.userId.email : '';
      } else if (application.userId) {
        const user = await User.findById(application.userId).select('email name');
        toEmail = (user && typeof user.email === 'string' && user.email.includes('@')) ? user.email : '';
      }
      
      const petName = application.petInventoryItemId?.name || 'your pet';
      const scheduled = new Date(scheduledDate).toLocaleDateString() + ' ' + scheduledTime;
      const petShopLocation = {
        address: handoverLocation || 'Pet Shop - Main Branch, 123 Pet Street, City',
        name: 'Pet Shop',
        phone: '+91-9876543210'
      };
      
      const subject = 'Pet Purchase Handover Scheduled - OTP Required';
      const message = `Hello${application.personalDetails?.fullName ? ' ' + application.personalDetails.fullName : ''}, 

Your handover for ${petName} is scheduled on ${scheduled} at our pet shop.
Location: ${petShopLocation.address}

IMPORTANT: You must present this OTP code when picking up your pet: ${otp}

Please arrive 15 minutes before your scheduled time. No pets will be released without the correct OTP.

Thank you,
Pet Shop Team`;

      if (toEmail && subject) {
        try {
          await sendMail({ to: toEmail, subject, html: message });
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

    res.json({ 
      success: true, 
      message: emailSent 
        ? 'Handover scheduled and OTP sent to customer\'s email' 
        : `Handover scheduled${emailError ? ` but email failed to send: ${emailError}` : ' but email could not be sent (no email address found)'}`,
      data: application,
      emailSent
    });
  } catch (error) {
    console.error('Schedule handover error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP and complete handover
const verifyOTPAndCompleteHandover = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }
    
    // Build query - only filter by storeId if it's a valid ObjectId
    const query = { _id: req.params.id };
    if (req.user.storeId && mongoose.Types.ObjectId.isValid(req.user.storeId)) {
      query.storeId = req.user.storeId;
    }
    
    const application = await PetshopPurchaseApplication.findOne(query)
      .populate('petInventoryItemId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'scheduled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid application status for handover' 
      });
    }

    // Verify OTP
    const verificationResult = application.verifyOTP(otp);
    if (!verificationResult.success) {
      return res.status(400).json({ success: false, message: verificationResult.message });
    }

    // Check if pet already exists in registry, update or create
    let petRegistry = await PetRegistry.findOne({ petCode: application.petInventoryItemId.petCode });
    
    if (petRegistry) {
      // Update existing registry entry
      petRegistry.source = 'user';
      petRegistry.userPetId = null; // Will be set when Pet document is created
      petRegistry.currentOwnerId = application.userId;
      petRegistry.currentLocation = 'at_owner';
      petRegistry.currentStatus = 'owned';
      petRegistry.lastTransferAt = new Date();
      petRegistry.updatedBy = req.user._id;
      
      // Add to ownership history
      petRegistry.ownershipHistory.push({
        previousOwnerId: null,
        newOwnerId: application.userId,
        transferType: 'purchase',
        transferDate: new Date(),
        transferPrice: application.paymentAmount,
        transferReason: 'Pet shop purchase',
        source: 'petshop',
        performedBy: req.user._id
      });
      
      await petRegistry.save();
    } else {
      // Create new registry entry
      petRegistry = await PetRegistry.create({
        petCode: application.petInventoryItemId.petCode,
        name: application.petInventoryItemId.name,
        source: 'user',
        petShopItemId: application.petInventoryItemId._id,
        currentOwnerId: application.userId,
        currentLocation: 'at_owner',
        currentStatus: 'owned',
        lastTransferAt: new Date(),
        firstAddedSource: 'pet_shop',
        firstAddedBy: req.user._id,
        firstAddedAt: new Date(),
        createdBy: req.user._id,
        ownershipHistory: [{
          previousOwnerId: null,
          newOwnerId: application.userId,
          transferType: 'purchase',
          transferDate: new Date(),
          transferPrice: application.paymentAmount,
          transferReason: 'Pet shop purchase',
          source: 'petshop',
          performedBy: req.user._id
        }]
      });
    }

    // Update application
    application.status = 'completed';
    application.handoverCompletedBy = req.user._id;
    application.handoverCompletedAt = new Date();
    application.petRegistryId = petRegistry._id;
    application.addStatusHistory('completed', req.user._id, 'Handover completed, OTP verified');
    await application.save();

    // Update pet inventory status
    await PetInventoryItem.findByIdAndUpdate(
      application.petInventoryItemId._id,
      { 
        status: 'sold',
        soldDate: new Date()
      }
    );

    // TODO: Send handover completion email

    res.json({ 
      success: true, 
      message: 'Handover completed successfully. Pet is now in user dashboard.',
      data: application
    });
  } catch (error) {
    console.error('Verify OTP and complete handover error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Regenerate OTP
const regenerateOTP = async (req, res) => {
  try {
    // Build query - only filter by storeId if it's a valid ObjectId
    const query = { _id: req.params.id };
    if (req.user.storeId && mongoose.Types.ObjectId.isValid(req.user.storeId)) {
      query.storeId = req.user.storeId;
    }
    
    const application = await PetshopPurchaseApplication.findOne(query)
      .populate('userId', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'scheduled') {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP can only be regenerated for scheduled handovers' 
      });
    }

    const otp = application.generateOTP();
    await application.save();

    // Send new OTP email to user
    let emailSent = false;
    let emailError = '';
    
    try {
      let toEmail = '';
      if (application.userId && typeof application.userId === 'object' && application.userId.email) {
        toEmail = typeof application.userId.email === 'string' && application.userId.email.includes('@') ? application.userId.email : '';
      } else if (application.userId) {
        const user = await User.findById(application.userId).select('email name');
        toEmail = (user && typeof user.email === 'string' && user.email.includes('@')) ? user.email : '';
      }
      
      const petName = application.petInventoryItemId?.name || 'your pet';
      const scheduled = application.scheduledHandoverDate 
        ? new Date(application.scheduledHandoverDate).toLocaleDateString() + ' ' + application.scheduledHandoverTime 
        : 'soon';
      const petShopLocation = {
        address: application.handoverLocation || 'Pet Shop - Main Branch, 123 Pet Street, City',
        name: 'Pet Shop',
        phone: '+91-9876543210'
      };
      
      const subject = 'Pet Purchase Handover - New OTP';
      const message = `Hello${application.personalDetails?.fullName ? ' ' + application.personalDetails.fullName : ''}, 

A new OTP has been generated for your handover of ${petName} scheduled on ${scheduled} at our pet shop.
Location: ${petShopLocation.address}

IMPORTANT: You must present this OTP code when picking up your pet: ${otp}

Please arrive 15 minutes before your scheduled time. No pets will be released without the correct OTP.

Thank you,
Pet Shop Team`;

      if (toEmail && subject) {
        try {
          await sendMail({ to: toEmail, subject, html: message });
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
      ? 'New OTP generated and sent to customer\'s email' 
      : `New OTP generated${emailError ? ` but email failed to send: ${emailError}` : ' but email could not be sent (no email address found)'}`;
    
    res.json({ 
      success: true, 
      message,
      emailSent
    });
  } catch (error) {
    console.error('Regenerate OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPurchaseApplications,
  approveApplication,
  rejectApplication,
  scheduleHandover,
  verifyOTPAndCompleteHandover,
  regenerateOTP
};
