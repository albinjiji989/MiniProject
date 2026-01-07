const CareBooking = require('../../models/CareBooking');
const CareStaff = require('../../models/CareStaff');
const ServiceType = require('../../models/ServiceType');
const Pet = require('../../../../core/models/Pet');

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
    
    const query = {
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
    
    const bookings = await CareBooking.find(query)
      .populate('userId', 'name email phone')
      .populate('petId', 'name species breed profileImage')
      .populate('serviceType', 'name')
      .populate('assignedCaregivers.caregiver', 'name')
      .sort({ startDate: 1 });
    
    // Categorize bookings
    const checkIns = bookings.filter(b => {
      const start = new Date(b.startDate);
      return start >= today && start < tomorrow;
    });
    
    const checkOuts = bookings.filter(b => {
      const end = new Date(b.endDate);
      return end >= today && end < tomorrow;
    });
    
    const ongoing = bookings.filter(b => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      return start < today && end >= tomorrow;
    });
    
    res.json({
      success: true,
      data: {
        checkIns,
        checkOuts,
        ongoing,
        total: bookings.length
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
    
    // Verify and update
    booking.handover.dropOff.otp.verified = true;
    booking.handover.dropOff.otp.verifiedAt = new Date();
    booking.handover.dropOff.actualTime = new Date();
    booking.handover.dropOff.completedBy = req.user.id;
    booking.handover.dropOff.notes = notes || '';
    booking.status = 'in_progress';
    
    await booking.save();
    
    res.json({
      success: true,
      message: 'Pet checked in successfully',
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
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not in progress'
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
    
    res.json({
      success: true,
      message: 'Pickup OTP generated successfully',
      data: {
        otp,
        expiresAt,
        bookingNumber: booking.bookingNumber
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

// Get available staff list
exports.getAvailableStaff = async (req, res) => {
  try {
    const staff = await CareStaff.find({
      storeId: req.user.storeId,
      'availability.status': 'available',
      isActive: true
    })
    .populate('userId', 'name email phone profilePicture')
    .select('userId skills experience performance')
    .sort({ 'performance.averageRating': -1 });
    
    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Error fetching available staff:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
