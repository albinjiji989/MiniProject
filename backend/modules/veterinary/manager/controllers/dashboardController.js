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

    // Find the veterinary store to get its ObjectId
    const veterinaryStore = await Veterinary.findOne({ storeId: storeId });
    if (!veterinaryStore) {
      return res.status(404).json({
        success: false,
        message: 'Veterinary store not found'
      });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Query both appointment collections
    // VeterinaryAppointment uses ObjectId for storeId
    // ManagerVeterinaryAppointment uses string for storeId
    const [
      todayUserAppointments,
      todayManagerAppointments,
      pendingUserAppointments,
      pendingManagerAppointments,
      totalUserPatients,
      totalManagerPatients,
      staffCount
    ] = await Promise.all([
      VeterinaryAppointment.countDocuments({
        storeId: veterinaryStore._id, // Use ObjectId
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: { $ne: 'cancelled' }
      }),
      ManagerVeterinaryAppointment.countDocuments({
        storeId: storeId, // Use string
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: { $ne: 'cancelled' }
      }),
      VeterinaryAppointment.countDocuments({
        storeId: veterinaryStore._id, // Use ObjectId
        status: { $in: ['pending_approval', 'confirmed'] }
      }),
      ManagerVeterinaryAppointment.countDocuments({
        storeId: storeId, // Use string
        status: { $in: ['pending_approval', 'confirmed'] }
      }),
      VeterinaryAppointment.distinct('petId', { storeId: veterinaryStore._id }).then(ids => ids.length),
      ManagerVeterinaryAppointment.distinct('petId', { storeId: storeId }).then(ids => ids.length),
      VeterinaryStaff.countDocuments({ storeId, isActive: true })
    ]);

    // Combine stats from both collections
    const todayAppointments = todayUserAppointments + todayManagerAppointments;
    const pendingAppointments = pendingUserAppointments + pendingManagerAppointments;
    const totalPatients = totalUserPatients + totalManagerPatients;

    // Get recent appointments from both collections
    const [recentUserAppointments, recentManagerAppointments] = await Promise.all([
      VeterinaryAppointment.find({ storeId: veterinaryStore._id })
        .populate('ownerId', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      ManagerVeterinaryAppointment.find({ storeId: storeId })
        .populate('petId', 'name species breed')
        .populate('ownerId', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    // Combine and sort recent appointments
    const recentAppointments = [...recentUserAppointments, ...recentManagerAppointments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

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