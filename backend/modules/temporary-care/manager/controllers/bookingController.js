const CareBooking = require('../../models/CareBooking');
const CareStaff = require('../../models/CareStaff');
const ServiceType = require('../../models/ServiceType');
const Pet = require('../../../../core/models/Pet');
const TemporaryCareApplication = require('../../models/TemporaryCareApplication');

/**
 * Manager Booking Management Controllers
 */

// Get all bookings for manager's store/facility
exports.getAllBookings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      serviceCategory,
      startDate,
      endDate,
      search
    } = req.query;
    
    const query = {};
    
    // Filter by manager's store
    if (req.user.storeId) {
      query.storeId = req.user.storeId;
    }
    
    if (status) query.status = status;
    if (serviceCategory) query.serviceCategory = serviceCategory;
    
    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (search) {
      query.bookingNumber = { $regex: search, $options: 'i' };
    }
    
    const bookings = await CareBooking.find(query)
      .populate('userId', 'name email phone')
      .populate('petId', 'name species breed profileImage')
      .populate('serviceType', 'name category')
      .populate('assignedCaregivers.caregiver', 'name email')
      .sort({ startDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await CareBooking.countDocuments(query);
    
    res.json({
      success: true,
      data: bookings,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get today's schedule
exports.getTodaySchedule = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Query CareBooking system (newer)
    const bookingQuery = {
      storeId: req.user.storeId,
      status: { $in: ['confirmed', 'in_progress'] },
      $or: [
        {
          startDate: {
            $gte: today,
            $lt: tomorrow
          }
        },
        {
          endDate: {
            $gte: today,
            $lt: tomorrow
          }
        },
        {
          startDate: { $lte: today },
          endDate: { $gte: tomorrow }
        }
      ]
    };
    
    const bookings = await CareBooking.find(bookingQuery)
      .populate('userId', 'name email phone')
      .populate('petId', 'name species breed profileImage')
      .populate('serviceType', 'name')
      .populate('assignedCaregivers.caregiver', 'name')
      .sort({ startDate: 1 });
    
    console.log('🔍 getTodaySchedule - CareBooking system results:', bookings.length);
    
    // ALSO query TemporaryCareApplication system (older) for relevant applications
    // Include multiple statuses that need manager attention
    const relevantApplications = await TemporaryCareApplication.find({
      status: { $in: ['active_care', 'approved', 'advance_paid'] },
      // TODO: Add center filtering when centerId is properly set
      // centerId: req.user.centerId
    })
    .populate('userId', 'name email phone');
    
    console.log('🔍 getTodaySchedule - TemporaryCareApplication system results:', relevantApplications.length);
    console.log('🔍 getTodaySchedule - Application statuses found:', relevantApplications.map(app => ({ id: app._id, status: app.status, finalPayment: app.paymentStatus?.final?.status })));
    
    // Convert applications to booking-like format for compatibility
    const applicationBookings = [];
    
    for (const app of relevantApplications) {
      // Get pet details for each pet in the application
      for (const petEntry of app.pets || []) {
        let petDetails = null;
        
        // Try to find pet by petCode in different collections
        const Pet = require('../../../../core/models/Pet');
        const AdoptionPet = require('../../../adoption/manager/models/AdoptionPet');
        
        petDetails = await Pet.findOne({ petCode: petEntry.petId });
        if (!petDetails) {
          petDetails = await AdoptionPet.findOne({ petCode: petEntry.petId });
        }
        
        applicationBookings.push({
          _id: app._id,
          bookingNumber: app.applicationNumber,
          userId: app.userId,
          petId: petDetails || { name: 'Unknown Pet', species: 'Unknown', breed: 'Unknown' },
          startDate: app.startDate,
          endDate: app.endDate,
          status: 'in_progress',
          paymentStatus: {
            advance: app.paymentStatus.advance,
            final: app.paymentStatus.final
          },
          handover: {
            pickup: {
              otp: app.handover?.pickup?.otp || null,
              otpUsed: app.handover?.pickup?.otpUsed || false
            }
          },
          isFromApplication: true, // Flag to identify source
          applicationId: app._id // Store original application ID for OTP operations
        });
      }
    }
    
    // Combine both systems
    const allBookings = [...bookings, ...applicationBookings];
    
    console.log('🔍 getTodaySchedule - Combined results:', allBookings.length);
    console.log('🔍 getTodaySchedule - Sample combined booking:', allBookings[0]);
    
    // Categorize bookings
    const checkIns = allBookings.filter(b => {
      const start = new Date(b.startDate);
      return start >= today && start < tomorrow;
    });
    
    // For checkOuts, include applications that are ready for pickup (final payment completed)
    // regardless of end date, plus normal date-based checkouts
    const checkOuts = allBookings.filter(b => {
      const end = new Date(b.endDate);
      const isEndingToday = end >= today && end < tomorrow;
      const isReadyForPickup = b.paymentStatus?.final?.status === 'completed' && 
                               (b.status === 'active_care' || b.status === 'in_progress');
      
      return isEndingToday || isReadyForPickup;
    });
    
    const ongoing = allBookings.filter(b => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const isOngoing = start < today && end >= tomorrow;
      const isInProgress = (b.status === 'active_care' || b.status === 'in_progress') && 
                          b.paymentStatus?.final?.status !== 'completed';
      
      return isOngoing || isInProgress;
    });
    
    console.log('🔍 getTodaySchedule - Categorized results:', {
      checkIns: checkIns.length,
      checkOuts: checkOuts.length,
      ongoing: ongoing.length
    });
    
    // Debug: Log details about checkOuts
    if (checkOuts.length > 0) {
      console.log('🔍 CheckOuts details:');
      checkOuts.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.bookingNumber}:`, {
          endDate: booking.endDate,
          finalPaymentStatus: booking.paymentStatus?.final?.status,
          status: booking.status,
          isFromApplication: booking.isFromApplication
        });
      });
    } else {
      console.log('🔍 No checkOuts found. Checking why...');
      allBookings.forEach((booking, index) => {
        const end = new Date(booking.endDate);
        const isEndingToday = end >= today && end < tomorrow;
        const isReadyForPickup = booking.paymentStatus?.final?.status === 'completed' && 
                                 (booking.status === 'active_care' || booking.status === 'in_progress');
        
        console.log(`  Booking ${index + 1} (${booking.bookingNumber}):`, {
          endDate: booking.endDate,
          isEndingToday,
          finalPaymentStatus: booking.paymentStatus?.final?.status,
          status: booking.status,
          isReadyForPickup,
          shouldBeInCheckOuts: isEndingToday || isReadyForPickup
        });
      });
    }
    
    res.json({
      success: true,
      data: {
        checkIns,
        checkOuts,
        ongoing,
        total: allBookings.length
      }
    });
  } catch (error) {
    console.error('Error fetching today schedule:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get booking details
exports.getBookingDetails = async (req, res) => {
  try {
    const booking = await CareBooking.findOne({
      _id: req.params.id,
      storeId: req.user.storeId
    })
    .populate('userId', 'name email phone address')
    .populate('petId')
    .populate('serviceType')
    .populate('assignedCaregivers.caregiver', 'name email phone profilePicture')
    .populate('activityLog.performedBy', 'name');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Assign staff to booking
exports.assignStaff = async (req, res) => {
  try {
    const { staffId, role = 'primary' } = req.body;
    
    const booking = await CareBooking.findOne({
      _id: req.params.id,
      storeId: req.user.storeId
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const staff = await CareStaff.findOne({
      userId: staffId,
      storeId: req.user.storeId,
      isActive: true
    });
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    if (staff.availability.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: `Staff is currently ${staff.availability.status}`
      });
    }
    
    // Check if already assigned
    const alreadyAssigned = booking.assignedCaregivers.some(
      ac => ac.caregiver.toString() === staffId
    );
    
    if (alreadyAssigned) {
      return res.status(400).json({
        success: false,
        message: 'Staff already assigned to this booking'
      });
    }
    
    booking.assignedCaregivers.push({
      caregiver: staffId,
      role,
      assignedAt: new Date()
    });
    
    await booking.save();
    
    // Update staff availability
    if (role === 'primary') {
      staff.availability.status = 'busy';
      await staff.save();
    }
    
    const updatedBooking = await CareBooking.findById(booking._id)
      .populate('assignedCaregivers.caregiver', 'name email');
    
    res.json({
      success: true,
      message: 'Staff assigned successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error assigning staff:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Add activity log
exports.addActivity = async (req, res) => {
  try {
    const { activityType, notes, media } = req.body;
    
    const booking = await CareBooking.findOne({
      _id: req.params.id,
      storeId: req.user.storeId
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (booking.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Can only add activities for in-progress bookings'
      });
    }
    
    booking.activityLog.push({
      activityType,
      notes,
      performedBy: req.user.id,
      media: media || [],
      timestamp: new Date()
    });
    
    await booking.save();
    
    const updatedBooking = await CareBooking.findById(booking._id)
      .populate('activityLog.performedBy', 'name');
    
    res.json({
      success: true,
      message: 'Activity added successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Generate drop-off OTP
exports.generateDropOffOTP = async (req, res) => {
  try {
    const booking = await CareBooking.findOne({
      _id: req.params.id,
      storeId: req.user.storeId,
      status: 'confirmed'
    });
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found or not in confirmed status' 
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    booking.handover.dropOff.otp = {
      code: otp,
      generatedAt: new Date(),
      expiresAt,
      verified: false
    };
    
    await booking.save();
    
    res.json({
      success: true,
      message: 'Drop-off OTP generated successfully',
      data: {
        otp,
        expiresAt,
        bookingNumber: booking.bookingNumber
      }
    });
  } catch (error) {
    console.error('Error generating drop-off OTP:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Verify drop-off OTP
exports.verifyDropOffOTP = async (req, res) => {
  try {
    const { otp, notes } = req.body;
    
    const booking = await CareBooking.findOne({
      _id: req.params.id,
      storeId: req.user.storeId
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (!booking.handover.dropOff.otp || !booking.handover.dropOff.otp.code) {
      return res.status(400).json({ success: false, message: 'OTP not generated' });
    }
    
    if (booking.handover.dropOff.otp.verified) {
      return res.status(400).json({ success: false, message: 'Drop-off already completed' });
    }
    
    if (new Date() > new Date(booking.handover.dropOff.otp.expiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    
    if (booking.handover.dropOff.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    // Verify and update booking
    booking.handover.dropOff.otp.verified = true;
    booking.handover.dropOff.otp.verifiedAt = new Date();
    booking.handover.dropOff.actualTime = new Date();
    booking.handover.dropOff.completedBy = req.user.id;
    booking.handover.dropOff.notes = notes || '';
    booking.status = 'in_progress';
    
    await booking.save();
    
    // IMPORTANT: Update pet status to show "in temporary care" banner
    const Pet = require('../../../../core/models/Pet');
    const AdoptionPet = require('../../../adoption/manager/models/AdoptionPet');
    
    // Try to find the pet in different collections
    let pet = await Pet.findById(booking.petId);
    let isAdoptionPet = false;
    
    if (!pet) {
      pet = await AdoptionPet.findById(booking.petId);
      isAdoptionPet = true;
    }
    
    if (pet) {
      // Set pet to temporary care status - THIS IS THE KEY PART
      pet.temporaryCareStatus = {
        inCare: true,
        applicationId: booking._id, // Use booking ID as reference
        centerId: req.user.storeId,
        startDate: booking.startDate,
        expectedEndDate: booking.endDate
      };
      
      // Update pet location to temporary care center
      if (!isAdoptionPet) {
        pet.currentLocation = 'at_care_center';
      }
      
      await pet.save();
      console.log(`✅ Pet ${pet.name} moved to temporary care after OTP verification`);
    }
    
    res.json({
      success: true,
      message: 'Pet checked in successfully and moved to temporary care',
      data: booking
    });
  } catch (error) {
    console.error('Error verifying drop-off OTP:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Generate pickup OTP
exports.generatePickupOTP = async (req, res) => {
  try {
    const booking = await CareBooking.findOne({
      _id: req.params.id,
      storeId: req.user.storeId,
      status: 'in_progress'
    })
    .populate('userId', 'name email phone')
    .populate('petId', 'name species breed');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not in progress'
      });
    }
    
    // Check if final payment is completed
    if (booking.paymentStatus.final.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Final payment must be completed before generating pickup OTP'
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    booking.handover.pickup.otp = {
      code: otp,
      generatedAt: new Date(),
      expiresAt,
      verified: false
    };
    
    await booking.save();
    
    // Send OTP via email
    try {
      const { sendMail } = require('../../../../core/utils/email');
      const { generatePickupOTPEmail } = require('../../templates/pickup-otp-email');
      
      const emailData = {
        userName: booking.userId.name,
        petName: booking.petId.name,
        otp,
        expiresAt,
        bookingNumber: booking.bookingNumber,
        storeName: req.user.storeName || 'Pet Care Center',
        storeAddress: req.user.storeAddress,
        storePhone: req.user.storePhone
      };
      
      await sendMail({
        to: booking.userId.email,
        subject: `🐾 ${booking.petId.name} is Ready for Pickup - OTP: ${otp}`,
        html: generatePickupOTPEmail(emailData)
      });
      
      console.log(`Pickup OTP email sent to ${booking.userId.email} for booking ${booking.bookingNumber}`);
    } catch (emailError) {
      console.error('Failed to send pickup OTP email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.json({
      success: true,
      message: 'Pickup OTP generated and sent to pet owner via email',
      data: {
        otp, // Include OTP in response for manager to see
        expiresAt,
        bookingNumber: booking.bookingNumber,
        petOwner: {
          name: booking.userId.name,
          email: booking.userId.email,
          phone: booking.userId.phone
        },
        pet: {
          name: booking.petId.name,
          species: booking.petId.species,
          breed: booking.petId.breed
        }
      }
    });
  } catch (error) {
    console.error('Error generating pickup OTP:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Verify pickup OTP
exports.verifyPickupOTP = async (req, res) => {
  try {
    const { otp, notes } = req.body;
    
    const booking = await CareBooking.findOne({
      _id: req.params.id,
      storeId: req.user.storeId
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (!booking.handover.pickup.otp || !booking.handover.pickup.otp.code) {
      return res.status(400).json({ success: false, message: 'OTP not generated' });
    }
    
    if (booking.handover.pickup.otp.verified) {
      return res.status(400).json({ success: false, message: 'Pickup already completed' });
    }
    
    if (new Date() > new Date(booking.handover.pickup.otp.expiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    
    if (booking.handover.pickup.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    // Check if final payment is completed
    if (booking.paymentStatus.final.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Final payment must be completed before checkout'
      });
    }
    
    // Verify and complete
    booking.handover.pickup.otp.verified = true;
    booking.handover.pickup.otp.verifiedAt = new Date();
    booking.handover.pickup.actualTime = new Date();
    booking.handover.pickup.completedBy = req.user.id;
    booking.handover.pickup.notes = notes || '';
    booking.status = 'completed';
    
    await booking.save();
    
    // Release assigned caregivers
    for (const ac of booking.assignedCaregivers) {
      const staff = await CareStaff.findOne({ userId: ac.caregiver });
      if (staff && staff.availability.status === 'busy') {
        staff.availability.status = 'available';
        await staff.updatePerformance('completed');
        await staff.save();
      }
    }
    
    // Update pet ownership back to user and remove temporary care status
    const Pet = require('../../../../core/models/Pet');
    const pet = await Pet.findById(booking.petId);
    if (pet) {
      // Remove temporary care status and restore original ownership
      pet.temporaryCareStatus = undefined;
      pet.temporaryCareDetails = undefined;
      
      // IMPORTANT: Restore pet location to at_owner
      pet.currentLocation = 'at_owner';
      
      // Ensure pet ownership is back to original user
      pet.ownerId = booking.userId;
      
      // Ensure original tags are preserved (they should already be there)
      // Tags like 'adoption', 'petshop', 'purchased' should remain intact
      // Only remove temporary care related tags if any were added
      if (pet.tags && pet.tags.includes('temporary-care')) {
        pet.tags = pet.tags.filter(tag => tag !== 'temporary-care');
      }
      
      await pet.save();
    }
    
    res.json({
      success: true,
      message: 'Pet checked out successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error verifying pickup OTP:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get manager dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const storeQuery = { storeId: req.user.storeId };
    
    // Today's check-ins and check-outs
    const todayCheckIns = await CareBooking.countDocuments({
      ...storeQuery,
      startDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'in_progress'] }
    });
    
    const todayCheckOuts = await CareBooking.countDocuments({
      ...storeQuery,
      endDate: { $gte: today, $lt: tomorrow },
      status: 'in_progress'
    });
    
    // Current occupancy
    const currentOccupancy = await CareBooking.countDocuments({
      ...storeQuery,
      status: 'in_progress'
    });
    
    // Pending confirmations
    const pendingConfirmations = await CareBooking.countDocuments({
      ...storeQuery,
      status: 'pending_payment'
    });
    
    // Available staff
    const availableStaff = await CareStaff.countDocuments({
      storeId: req.user.storeId,
      'availability.status': 'available',
      isActive: true
    });
    
    // This month stats
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStats = await CareBooking.aggregate([
      {
        $match: {
          ...storeQuery,
          createdAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        today: {
          checkIns: todayCheckIns,
          checkOuts: todayCheckOuts,
          currentOccupancy
        },
        pending: {
          confirmations: pendingConfirmations
        },
        staff: {
          available: availableStaff
        },
        thisMonth: monthStats[0] || {
          totalBookings: 0,
          totalRevenue: 0,
          completed: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Resend pickup OTP
exports.resendPickupOTP = async (req, res) => {
  try {
    const booking = await CareBooking.findOne({
      _id: req.params.id,
      storeId: req.user.storeId,
      status: 'in_progress'
    })
    .populate('userId', 'name email phone')
    .populate('petId', 'name species breed');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not in progress'
      });
    }
    
    // Check if final payment is completed
    if (booking.paymentStatus.final.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Final payment must be completed before generating pickup OTP'
      });
    }
    
    // Check if there's an existing OTP that's still valid
    const existingOTP = booking.handover.pickup.otp;
    if (existingOTP && existingOTP.code && !existingOTP.verified && new Date() < new Date(existingOTP.expiresAt)) {
      // Resend the existing OTP
      try {
        const { sendMail } = require('../../../../core/utils/email');
        const { generatePickupOTPEmail } = require('../../templates/pickup-otp-email');
        
        const emailData = {
          userName: booking.userId.name,
          petName: booking.petId.name,
          otp: existingOTP.code,
          expiresAt: existingOTP.expiresAt,
          bookingNumber: booking.bookingNumber,
          storeName: req.user.storeName || 'Pet Care Center',
          storeAddress: req.user.storeAddress,
          storePhone: req.user.storePhone
        };
        
        await sendMail({
          to: booking.userId.email,
          subject: `🐾 ${booking.petId.name} Pickup OTP (Resent) - OTP: ${existingOTP.code}`,
          html: generatePickupOTPEmail(emailData)
        });
        
        return res.json({
          success: true,
          message: 'Existing pickup OTP resent to pet owner via email',
          data: {
            otp: existingOTP.code,
            expiresAt: existingOTP.expiresAt,
            bookingNumber: booking.bookingNumber,
            isResend: true
          }
        });
      } catch (emailError) {
        console.error('Failed to resend pickup OTP email:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to resend OTP email'
        });
      }
    }
    
    // Generate new OTP if no valid existing OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    booking.handover.pickup.otp = {
      code: otp,
      generatedAt: new Date(),
      expiresAt,
      verified: false
    };
    
    await booking.save();
    
    // Send new OTP via email
    try {
      const { sendMail } = require('../../../../core/utils/email');
      const { generatePickupOTPEmail } = require('../../templates/pickup-otp-email');
      
      const emailData = {
        userName: booking.userId.name,
        petName: booking.petId.name,
        otp,
        expiresAt,
        bookingNumber: booking.bookingNumber,
        storeName: req.user.storeName || 'Pet Care Center',
        storeAddress: req.user.storeAddress,
        storePhone: req.user.storePhone
      };
      
      await sendMail({
        to: booking.userId.email,
        subject: `🐾 ${booking.petId.name} New Pickup OTP - OTP: ${otp}`,
        html: generatePickupOTPEmail(emailData)
      });
      
      res.json({
        success: true,
        message: 'New pickup OTP generated and sent to pet owner via email',
        data: {
          otp,
          expiresAt,
          bookingNumber: booking.bookingNumber,
          isResend: false
        }
      });
    } catch (emailError) {
      console.error('Failed to send new pickup OTP email:', emailError);
      res.status(500).json({
        success: false,
        message: 'OTP generated but failed to send email'
      });
    }
  } catch (error) {
    console.error('Error resending pickup OTP:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Generate pickup OTP for TemporaryCareApplication
exports.generateApplicationPickupOTP = async (req, res) => {
  try {
    const applicationId = req.params.id;
    
    const application = await TemporaryCareApplication.findById(applicationId)
      .populate('userId', 'name email phone')
      .populate('pets.petId', 'name species breed');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Check if final payment is completed
    if (application.paymentStatus.final.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Final payment must be completed before generating pickup OTP'
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    // Initialize handover if it doesn't exist
    if (!application.handover) {
      application.handover = {};
    }
    if (!application.handover.pickup) {
      application.handover.pickup = {};
    }
    
    application.handover.pickup = {
      otp: otp,
      otpGeneratedAt: new Date(),
      otpExpiresAt: expiresAt,
      otpUsed: false
    };
    
    await application.save();
    
    // Send OTP via email
    try {
      const { sendMail } = require('../../../../core/utils/email');
      const { generatePickupOTPEmail } = require('../../templates/pickup-otp-email');
      
      const emailData = {
        userName: application.userId.name,
        petName: application.pets[0]?.petId || 'Your Pet',
        otp,
        expiresAt,
        bookingNumber: application.applicationNumber,
        storeName: 'Pet Care Center',
        storeAddress: '',
        storePhone: ''
      };
      
      await sendMail({
        to: application.userId.email,
        subject: `🐾 Your Pet is Ready for Pickup - OTP: ${otp}`,
        html: generatePickupOTPEmail(emailData)
      });
      
      console.log(`Pickup OTP email sent to ${application.userId.email} for application ${application.applicationNumber}`);
    } catch (emailError) {
      console.error('Failed to send pickup OTP email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.json({
      success: true,
      message: 'Pickup OTP generated and sent to pet owner via email',
      data: {
        otp, // Include OTP in response for manager to see
        expiresAt,
        applicationNumber: application.applicationNumber,
        petOwner: {
          name: application.userId.name,
          email: application.userId.email,
          phone: application.userId.phone
        }
      }
    });
  } catch (error) {
    console.error('Error generating application pickup OTP:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Verify pickup OTP for TemporaryCareApplication
exports.verifyApplicationPickupOTP = async (req, res) => {
  try {
    const { otp, notes } = req.body;
    const applicationId = req.params.id;
    
    const application = await TemporaryCareApplication.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    if (!application.handover?.pickup?.otp) {
      return res.status(400).json({ success: false, message: 'OTP not generated' });
    }
    
    if (application.handover.pickup.otpUsed) {
      return res.status(400).json({ success: false, message: 'Pickup already completed' });
    }
    
    if (new Date() > new Date(application.handover.pickup.otpExpiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    
    if (application.handover.pickup.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    // Check if final payment is completed
    if (application.paymentStatus.final.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Final payment must be completed before checkout'
      });
    }
    
    // Mark OTP as used and complete the application
    application.handover.pickup.otpUsed = true;
    application.handover.pickup.otpUsedAt = new Date();
    application.handover.pickup.notes = notes || '';
    application.status = 'completed';
    
    await application.save();
    
    // Update pet ownership back to user and remove temporary care status
    for (const petEntry of application.pets) {
      let pet = await Pet.findOne({ petCode: petEntry.petId });
      if (!pet) {
        const AdoptionPet = require('../../../adoption/manager/models/AdoptionPet');
        pet = await AdoptionPet.findOne({ petCode: petEntry.petId });
      }
      
      if (pet) {
        // Remove temporary care status and restore original ownership
        pet.temporaryCareStatus = undefined;
        pet.temporaryCareDetails = undefined;
        
        // IMPORTANT: Restore pet location to at_owner
        if (pet.currentLocation) {
          pet.currentLocation = 'at_owner';
        }
        
        // Ensure pet ownership is back to original user
        pet.ownerId = application.userId;
        
        // Remove temporary care tags if any were added
        if (pet.tags && pet.tags.includes('temporary-care')) {
          pet.tags = pet.tags.filter(tag => tag !== 'temporary-care');
        }
        
        await pet.save();
        console.log(`✅ Pet ${pet.name} returned to owner after application pickup OTP verification`);
      }
    }
    
    res.json({
      success: true,
      message: 'Pet checked out successfully and returned to owner',
      data: application
    });
  } catch (error) {
    console.error('Error verifying application pickup OTP:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Resend pickup OTP for TemporaryCareApplication
exports.resendApplicationPickupOTP = async (req, res) => {
  try {
    const applicationId = req.params.id;
    
    const application = await TemporaryCareApplication.findById(applicationId)
      .populate('userId', 'name email phone')
      .populate('pets.petId', 'name species breed');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Check if final payment is completed
    if (application.paymentStatus.final.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Final payment must be completed before generating pickup OTP'
      });
    }
    
    // Check if there's an existing OTP that's still valid
    const existingOTP = application.handover?.pickup;
    if (existingOTP && existingOTP.otp && !existingOTP.otpUsed && new Date() < new Date(existingOTP.otpExpiresAt)) {
      // Resend the existing OTP
      try {
        const { sendMail } = require('../../../../core/utils/email');
        const { generatePickupOTPEmail } = require('../../templates/pickup-otp-email');
        
        const emailData = {
          userName: application.userId.name,
          petName: application.pets[0]?.petId || 'Your Pet',
          otp: existingOTP.otp,
          expiresAt: existingOTP.otpExpiresAt,
          bookingNumber: application.applicationNumber,
          storeName: 'Pet Care Center',
          storeAddress: '',
          storePhone: ''
        };
        
        await sendMail({
          to: application.userId.email,
          subject: `🐾 Your Pet Pickup OTP (Resent) - OTP: ${existingOTP.otp}`,
          html: generatePickupOTPEmail(emailData)
        });
        
        return res.json({
          success: true,
          message: 'Existing pickup OTP resent to pet owner via email',
          data: {
            otp: existingOTP.otp,
            expiresAt: existingOTP.otpExpiresAt,
            applicationNumber: application.applicationNumber,
            isResend: true
          }
        });
      } catch (emailError) {
        console.error('Failed to resend pickup OTP email:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to resend OTP email'
        });
      }
    }
    
    // Generate new OTP if no valid existing OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    // Initialize handover if it doesn't exist
    if (!application.handover) {
      application.handover = {};
    }
    if (!application.handover.pickup) {
      application.handover.pickup = {};
    }
    
    application.handover.pickup = {
      otp: otp,
      otpGeneratedAt: new Date(),
      otpExpiresAt: expiresAt,
      otpUsed: false
    };
    
    await application.save();
    
    // Send new OTP via email
    try {
      const { sendMail } = require('../../../../core/utils/email');
      const { generatePickupOTPEmail } = require('../../templates/pickup-otp-email');
      
      const emailData = {
        userName: application.userId.name,
        petName: application.pets[0]?.petId || 'Your Pet',
        otp,
        expiresAt,
        bookingNumber: application.applicationNumber,
        storeName: 'Pet Care Center',
        storeAddress: '',
        storePhone: ''
      };
      
      await sendMail({
        to: application.userId.email,
        subject: `🐾 New Pet Pickup OTP - OTP: ${otp}`,
        html: generatePickupOTPEmail(emailData)
      });
      
      res.json({
        success: true,
        message: 'New pickup OTP generated and sent to pet owner via email',
        data: {
          otp,
          expiresAt,
          applicationNumber: application.applicationNumber,
          isResend: false
        }
      });
    } catch (emailError) {
      console.error('Failed to send new pickup OTP email:', emailError);
      res.status(500).json({
        success: false,
        message: 'OTP generated but failed to send email'
      });
    }
  } catch (error) {
    console.error('Error resending application pickup OTP:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get available staff (placeholder for compatibility)
exports.getAvailableStaff = async (req, res) => {
  try {
    // This is a placeholder - implement based on your staff model
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error fetching available staff:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
// Get all applications for debugging
exports.getAllApplications = async (req, res) => {
  try {
    console.log('🔍 getAllApplications - Manager user:', req.user.id, req.user.email);
    
    // Get all applications regardless of status for debugging
    const allApplications = await TemporaryCareApplication.find({})
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    
    console.log('🔍 getAllApplications - Total applications found:', allApplications.length);
    
    // Log details of each application
    allApplications.forEach((app, index) => {
      console.log(`🔍 Application ${index + 1}:`, {
        id: app._id,
        applicationNumber: app.applicationNumber,
        userId: app.userId?._id,
        userEmail: app.userId?.email,
        status: app.status,
        centerId: app.centerId,
        advancePayment: app.paymentStatus?.advance?.status,
        finalPayment: app.paymentStatus?.final?.status,
        startDate: app.startDate,
        endDate: app.endDate,
        pets: app.pets?.length || 0
      });
    });
    
    // Convert to booking-like format for frontend compatibility
    const applicationBookings = [];
    
    for (const app of allApplications) {
      for (const petEntry of app.pets || []) {
        let petDetails = null;
        
        // Try to find pet by petCode
        const Pet = require('../../../../core/models/Pet');
        const AdoptionPet = require('../../../adoption/manager/models/AdoptionPet');
        
        petDetails = await Pet.findOne({ petCode: petEntry.petId });
        if (!petDetails) {
          petDetails = await AdoptionPet.findOne({ petCode: petEntry.petId });
        }
        
        applicationBookings.push({
          _id: app._id,
          bookingNumber: app.applicationNumber,
          userId: app.userId,
          petId: petDetails || { name: 'Unknown Pet', species: 'Unknown', breed: 'Unknown' },
          startDate: app.startDate,
          endDate: app.endDate,
          status: app.status,
          paymentStatus: {
            advance: app.paymentStatus.advance,
            final: app.paymentStatus.final
          },
          handover: {
            pickup: {
              otp: app.handover?.pickup?.otp || null,
              otpUsed: app.handover?.pickup?.otpUsed || false
            }
          },
          isFromApplication: true,
          applicationId: app._id,
          centerId: app.centerId
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        applications: applicationBookings,
        total: applicationBookings.length,
        debug: {
          managerUserId: req.user.id,
          managerStoreId: req.user.storeId,
          totalApplicationsInDB: allApplications.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all applications:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};