const User = require('../../../../core/models/User');
const ManagerVeterinaryAppointment = require('../models/VeterinaryAppointment');
const VeterinaryAppointment = require('../../models/VeterinaryAppointment');
const VeterinaryMedicalRecord = require('../../models/VeterinaryMedicalRecord');
const VeterinaryService = require('../models/VeterinaryService');
const VeterinaryStaff = require('../models/VeterinaryStaff');
const Pet = require('../../../../core/models/Pet');
const Veterinary = require('../../models/Veterinary');

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

    // Get stats directly using storeId
    const [todayAppointments, pendingAppointments, totalPatients, staffCount] = await Promise.all([
      VeterinaryAppointment.countDocuments({
        storeId: storeId,
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: { $ne: 'cancelled' }
      }),
      VeterinaryAppointment.countDocuments({
        storeId: storeId,
        status: { $in: ['pending_approval', 'scheduled'] }
      }),
      VeterinaryAppointment.distinct('petId', { storeId: storeId }).then(ids => ids.length),
      VeterinaryStaff.countDocuments({ storeId, isActive: true })
    ]);

    // Get recent appointments
    const recentAppointments = await VeterinaryAppointment.find({ storeId: storeId })
      .populate('petId', 'name species breed')
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const stats = {
      todayAppointments,
      pendingAppointments,
      totalPatients,
      staffCount,
      recentAppointments
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
};

// Get medical records
const getMedicalRecords = async (req, res) => {
  try {
    const storeId = req.user.storeId;

    const { petId, page = 1, limit = 20 } = req.query;

    const filter = {
      storeId: storeId,
      isActive: true
    };
    
    if (petId) filter.pet = petId;

    const records = await VeterinaryMedicalRecord.find(filter)
      .populate('pet', 'name species breed age gender')
      .populate('owner', 'name email phone')
      .populate('staff', 'name')
      .sort({ visitDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await VeterinaryMedicalRecord.countDocuments(filter);

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

    // Find the veterinary store for this manager
    const veterinaryStore = await Veterinary.findOne({ storeId: storeId });
    if (!veterinaryStore) {
      return res.status(404).json({
        success: false,
        message: 'Veterinary store not found'
      });
    }

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
  getMedicalRecords,
  getServices
};