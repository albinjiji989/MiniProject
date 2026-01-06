const PetshopPurchaseApplication = require('../../manager/models/PetshopPurchaseApplication');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');
const PetRegistry = require('../../../../core/models/PetRegistry');
const { sendEmail } = require('../../../../core/utils/email');
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
          { path: 'breedId', select: 'name' }
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
    
    const application = await PetshopPurchaseApplication.findOne({
      _id: req.params.id,
      storeId: req.user.storeId
    }).populate('userId', 'name email');

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
    
    const application = await PetshopPurchaseApplication.findOne({
      _id: req.params.id,
      storeId: req.user.storeId
    }).populate('userId', 'name email');

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
    
    const application = await PetshopPurchaseApplication.findOne({
      _id: req.params.id,
      storeId: req.user.storeId
    }).populate('userId', 'name email');

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

    // TODO: Send OTP email to user

    res.json({ 
      success: true, 
      message: 'Handover scheduled successfully. OTP sent to user email.',
      data: application
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
    
    const application = await PetshopPurchaseApplication.findOne({
      _id: req.params.id,
      storeId: req.user.storeId
    }).populate('petInventoryItemId');

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

    // Create pet in registry
    const petRegistry = await PetRegistry.create({
      petCode: application.petInventoryItemId.petCode,
      name: application.petInventoryItemId.name,
      source: 'petshop',
      petShopItemId: application.petInventoryItemId._id,
      currentOwnerId: application.userId,
      currentLocation: 'at_owner',
      currentStatus: 'owned',
      lastTransferAt: new Date(),
      createdBy: req.user._id
    });

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
    const application = await PetshopPurchaseApplication.findOne({
      _id: req.params.id,
      storeId: req.user.storeId
    }).populate('userId', 'name email');

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

    // TODO: Send new OTP email

    res.json({ 
      success: true, 
      message: 'New OTP generated and sent to user email'
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
