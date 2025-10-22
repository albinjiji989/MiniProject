const User = require('../../../../core/models/User');
const VeterinaryAppointment = require('../models/VeterinaryAppointment');
const VeterinaryService = require('../models/VeterinaryService');
const VeterinaryStaff = require('../models/VeterinaryStaff');
const Pet = require('../../../../core/models/Pet');

// Get veterinary manager dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const managerId = req.user.id;
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store not set up. Please complete store setup first.'
      });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Real stats from database
    const [todayAppointments, pendingAppointments, totalPatients, staffCount] = await Promise.all([
      VeterinaryAppointment.countDocuments({
        storeId,
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: { $ne: 'cancelled' }
      }),
      VeterinaryAppointment.countDocuments({
        storeId,
        status: 'pending'
      }),
      VeterinaryAppointment.distinct('petId', { storeId }),
      VeterinaryStaff.countDocuments({ storeId })
    ]);

    // Get recent appointments
    const recentAppointments = await VeterinaryAppointment.find({ storeId })
      .populate('petId', 'name species breed')
      .populate('ownerId', 'name email phone')
      .populate('veterinarianId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const stats = {
      todayAppointments,
      pendingAppointments,
      totalPatients: totalPatients.length,
      staffCount,
      recentAppointments
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Veterinary dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
};

// Get appointments list
const getAppointments = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const { status, date, page = 1, limit = 20 } = req.query;

    const filter = { storeId };
    if (status) filter.status = status;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const appointments = await VeterinaryAppointment.find(filter)
      .populate('petId', 'name species breed age gender')
      .populate('ownerId', 'name email phone')
      .populate('veterinarianId', 'name')
      .sort({ appointmentDate: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await VeterinaryAppointment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        appointments,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  }
};

// Get medical records
const getMedicalRecords = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const { petId, page = 1, limit = 20 } = req.query;

    const filter = {
      storeId,
      status: 'completed',
      $or: [
        { diagnosis: { $exists: true, $ne: '' } },
        { treatment: { $exists: true, $ne: '' } }
      ]
    };
    
    if (petId) filter.petId = petId;

    const records = await VeterinaryAppointment.find(filter)
      .populate('petId', 'name species breed age gender')
      .populate('ownerId', 'name email phone')
      .populate('veterinarianId', 'name')
      .sort({ completedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await VeterinaryAppointment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        records,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical records'
    });
  }
};

// Get veterinary services
const getServices = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const { category, isActive } = req.query;

    const filter = { storeId };
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const services = await VeterinaryService.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        services,
        total: services.length
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services'
    });
  }
};

module.exports = {
  getDashboardStats,
  getAppointments,
  getMedicalRecords,
  getServices
};
