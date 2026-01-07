const CareStaff = require('../../models/CareStaff');
const User = require('../../../../core/models/User');
const CareBooking = require('../../models/CareBooking');

/**
 * Admin Staff Management
 */

// Get all care staff
exports.getAllStaff = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      specialization,
      storeId 
    } = req.query;
    
    const query = {};
    if (status) query['availability.status'] = status;
    if (specialization) query['experience.specializations'] = specialization;
    if (storeId) query.storeId = storeId;
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(u => u._id);
      query.userId = { $in: userIds };
    }
    
    const staff = await CareStaff.find(query)
      .populate('userId', 'name email phone profilePicture')
      .populate('employment.manager', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await CareStaff.countDocuments(query);
    
    res.json({
      success: true,
      data: staff,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get single staff member
exports.getStaff = async (req, res) => {
  try {
    const staff = await CareStaff.findById(req.params.id)
      .populate('userId', 'name email phone profilePicture address')
      .populate('employment.manager', 'name email');
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    // Get recent bookings for this staff
    const recentBookings = await CareBooking.find({
      'assignedCaregivers.caregiver': staff.userId
    })
    .populate('petId', 'name species breed')
    .populate('userId', 'name email')
    .sort({ startDate: -1 })
    .limit(5);
    
    res.json({
      success: true,
      data: {
        staff,
        recentBookings
      }
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create staff member
exports.createStaff = async (req, res) => {
  try {
    const {
      userId,
      qualifications,
      experience,
      skills,
      availability,
      servicePreferences,
      documents,
      emergencyContact,
      employment,
      bio
    } = req.body;
    
    // Check if user exists and is not already staff
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const existingStaff = await CareStaff.findOne({ userId });
    if (existingStaff) {
      return res.status(400).json({ success: false, message: 'User is already a staff member' });
    }
    
    const staff = await CareStaff.create({
      userId,
      qualifications,
      experience,
      skills,
      availability,
      servicePreferences,
      documents,
      emergencyContact,
      employment: {
        ...employment,
        manager: req.user.id
      },
      bio,
      storeId: req.user.storeId,
      storeName: req.user.storeName
    });
    
    // Update user role to include caregiver
    if (!user.role.includes('caregiver')) {
      user.role.push('caregiver');
      await user.save();
    }
    
    const populatedStaff = await CareStaff.findById(staff._id)
      .populate('userId', 'name email phone');
    
    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: populatedStaff
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update staff member
exports.updateStaff = async (req, res) => {
  try {
    const staff = await CareStaff.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone');
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: staff
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete staff member
exports.deleteStaff = async (req, res) => {
  try {
    // Check if staff has any active bookings
    const activeBookings = await CareBooking.countDocuments({
      'assignedCaregivers.caregiver': req.params.id,
      status: { $in: ['confirmed', 'in_progress'] }
    });
    
    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete staff. They have ${activeBookings} active bookings. Deactivate instead.`
      });
    }
    
    const staff = await CareStaff.findByIdAndDelete(req.params.id);
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update staff availability status
exports.updateStaffStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['available', 'busy', 'on_leave', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const staff = await CareStaff.findByIdAndUpdate(
      req.params.id,
      { 'availability.status': status },
      { new: true }
    ).populate('userId', 'name email');
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    res.json({
      success: true,
      message: 'Staff status updated successfully',
      data: staff
    });
  } catch (error) {
    console.error('Error updating staff status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Verify staff document
exports.verifyDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { verified } = req.body;
    
    const staff = await CareStaff.findOne({ 'documents._id': documentId });
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    const document = staff.documents.id(documentId);
    document.verified = verified;
    document.verifiedAt = new Date();
    document.verifiedBy = req.user.id;
    
    await staff.save();
    
    res.json({
      success: true,
      message: `Document ${verified ? 'verified' : 'rejected'} successfully`,
      data: staff
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get staff statistics
exports.getStaffStats = async (req, res) => {
  try {
    const stats = await CareStaff.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$availability.status', 'available'] }, 1, 0] }
          },
          busy: {
            $sum: { $cond: [{ $eq: ['$availability.status', 'busy'] }, 1, 0] }
          },
          onLeave: {
            $sum: { $cond: [{ $eq: ['$availability.status', 'on_leave'] }, 1, 0] }
          },
          inactive: {
            $sum: { $cond: [{ $eq: ['$availability.status', 'inactive'] }, 1, 0] }
          },
          avgRating: { $avg: '$performance.averageRating' },
          totalBookings: { $sum: '$performance.totalBookings' },
          completedBookings: { $sum: '$performance.completedBookings' }
        }
      }
    ]);
    
    // Top performers
    const topPerformers = await CareStaff.find({ 'performance.averageRating': { $gte: 4 } })
      .populate('userId', 'name email')
      .sort({ 'performance.averageRating': -1 })
      .limit(5)
      .select('userId performance');
    
    res.json({
      success: true,
      data: {
        overview: stats[0] || { 
          total: 0, 
          available: 0, 
          busy: 0, 
          onLeave: 0, 
          inactive: 0,
          avgRating: 0,
          totalBookings: 0,
          completedBookings: 0
        },
        topPerformers
      }
    });
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get staff performance report
exports.getStaffPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const performance = await CareBooking.aggregate([
      { $match: matchStage },
      { $unwind: '$assignedCaregivers' },
      {
        $group: {
          _id: '$assignedCaregivers.caregiver',
          totalBookings: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$pricing.totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          totalBookings: 1,
          completed: 1,
          cancelled: 1,
          totalRevenue: 1,
          completionRate: {
            $cond: [
              { $eq: ['$totalBookings', 0] },
              0,
              { $multiply: [{ $divide: ['$completed', '$totalBookings'] }, 100] }
            ]
          }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Error fetching staff performance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
