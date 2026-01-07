const CareBooking = require('../../models/CareBooking');
const Pet = require('../../../../core/models/Pet');
const User = require('../../../../core/models/User');
const CareStaff = require('../../models/CareStaff');
const ServiceType = require('../../models/ServiceType');

/**
 * Admin Booking Management
 */

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      serviceCategory,
      startDate,
      endDate,
      search,
      storeId
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (serviceCategory) query.serviceCategory = serviceCategory;
    if (storeId) query.storeId = storeId;
    
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
      .sort({ createdAt: -1 })
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

// Get single booking
exports.getBooking = async (req, res) => {
  try {
    const booking = await CareBooking.findById(req.params.id)
      .populate('userId', 'name email phone address')
      .populate('petId')
      .populate('serviceType')
      .populate('assignedCaregivers.caregiver', 'name email phone profilePicture');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const validStatuses = ['pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const booking = await CareBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    booking.status = status;
    if (notes) {
      booking.internalNotes = `${booking.internalNotes}\n[${new Date().toISOString()}] Status changed to ${status}: ${notes}`;
    }
    
    await booking.save();
    
    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Assign caregiver to booking
exports.assignCaregiver = async (req, res) => {
  try {
    const { caregiverId, role = 'primary' } = req.body;
    
    const booking = await CareBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Check if caregiver exists and is available
    const staff = await CareStaff.findOne({ userId: caregiverId });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Caregiver not found' });
    }
    
    if (staff.availability.status !== 'available') {
      return res.status(400).json({ 
        success: false, 
        message: `Caregiver is currently ${staff.availability.status}` 
      });
    }
    
    // Check if already assigned
    const alreadyAssigned = booking.assignedCaregivers.some(
      ac => ac.caregiver.toString() === caregiverId
    );
    
    if (alreadyAssigned) {
      return res.status(400).json({ 
        success: false, 
        message: 'Caregiver already assigned to this booking' 
      });
    }
    
    booking.assignedCaregivers.push({
      caregiver: caregiverId,
      role,
      assignedAt: new Date()
    });
    
    await booking.save();
    
    // Update staff status if primary caregiver
    if (role === 'primary') {
      staff.availability.status = 'busy';
      await staff.save();
    }
    
    const updatedBooking = await CareBooking.findById(booking._id)
      .populate('assignedCaregivers.caregiver', 'name email');
    
    res.json({
      success: true,
      message: 'Caregiver assigned successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error assigning caregiver:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Remove caregiver from booking
exports.removeCaregiver = async (req, res) => {
  try {
    const { caregiverId } = req.body;
    
    const booking = await CareBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const caregiverIndex = booking.assignedCaregivers.findIndex(
      ac => ac.caregiver.toString() === caregiverId
    );
    
    if (caregiverIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Caregiver not assigned to this booking' 
      });
    }
    
    booking.assignedCaregivers.splice(caregiverIndex, 1);
    await booking.save();
    
    res.json({
      success: true,
      message: 'Caregiver removed successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error removing caregiver:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Add activity log to booking
exports.addActivityLog = async (req, res) => {
  try {
    const { activityType, notes, media } = req.body;
    
    const booking = await CareBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    booking.activityLog.push({
      activityType,
      notes,
      performedBy: req.user.id,
      media: media || [],
      timestamp: new Date()
    });
    
    await booking.save();
    
    res.json({
      success: true,
      message: 'Activity log added successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error adding activity log:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get booking statistics
exports.getBookingStats = async (req, res) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (storeId) {
      matchStage.storeId = storeId;
    }
    
    const stats = await CareBooking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          pendingPayment: {
            $sum: { $cond: [{ $eq: ['$status', 'pending_payment'] }, 1, 0] }
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          advanceCollected: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus.advance.status', 'completed'] },
                '$pricing.advanceAmount',
                0
              ]
            }
          }
        }
      }
    ]);
    
    // Category wise breakdown
    const categoryStats = await CareBooking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$serviceCategory',
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);
    
    // Daily bookings trend
    const dailyTrend = await CareBooking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalBookings: 0,
          pendingPayment: 0,
          confirmed: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
          totalRevenue: 0,
          advanceCollected: 0
        },
        byCategory: categoryStats,
        dailyTrend
      }
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Cancel booking (admin)
exports.cancelBooking = async (req, res) => {
  try {
    const { reason, refundAmount } = req.body;
    
    const booking = await CareBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (!['pending_payment', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or confirmed bookings can be cancelled'
      });
    }
    
    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: req.user.id,
      reason,
      refundAmount: refundAmount || 0,
      refundStatus: refundAmount > 0 ? 'pending' : undefined
    };
    
    await booking.save();
    
    // Update staff availability if caregivers were assigned
    for (const ac of booking.assignedCaregivers) {
      const staff = await CareStaff.findOne({ userId: ac.caregiver });
      if (staff && staff.availability.status === 'busy') {
        staff.availability.status = 'available';
        await staff.save();
      }
    }
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Generate OTP for handover
exports.generateHandoverOTP = async (req, res) => {
  try {
    const { type } = req.body; // 'dropOff' or 'pickup'
    
    const booking = await CareBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    if (type === 'dropOff') {
      booking.handover.dropOff.otp = {
        code: otp,
        generatedAt: new Date(),
        expiresAt,
        verified: false
      };
    } else if (type === 'pickup') {
      booking.handover.pickup.otp = {
        code: otp,
        generatedAt: new Date(),
        expiresAt,
        verified: false
      };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }
    
    await booking.save();
    
    res.json({
      success: true,
      message: 'OTP generated successfully',
      data: { otp, expiresAt }
    });
  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
