const User = require('../../../../core/models/User');
const ManagerVeterinaryAppointment = require('../models/VeterinaryAppointment');
const VeterinaryAppointment = require('../../models/VeterinaryAppointment');
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

    // Find the veterinary store for this manager
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

    // Get stats from both collections
    const [todayManagerAppointments, todayUserAppointments, 
           pendingManagerAppointments, pendingUserAppointments] = await Promise.all([
      ManagerVeterinaryAppointment.countDocuments({
        storeId: veterinaryStore._id,
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: { $ne: 'cancelled' }
      }),
      VeterinaryAppointment.countDocuments({
        storeId: veterinaryStore.storeId,
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: { $ne: 'cancelled' }
      }),
      ManagerVeterinaryAppointment.countDocuments({
        storeId: veterinaryStore._id,
        status: 'pending'
      }),
      VeterinaryAppointment.countDocuments({
        storeId: veterinaryStore.storeId,
        status: 'pending'
      })
    ]);

    const todayAppointments = todayManagerAppointments + todayUserAppointments;
    const pendingAppointments = pendingManagerAppointments + pendingUserAppointments;

    // Get unique patients from both collections
    const [managerPatients, userPatients] = await Promise.all([
      ManagerVeterinaryAppointment.distinct('petId', { storeId: veterinaryStore._id }),
      VeterinaryAppointment.distinct('petId', { storeId: veterinaryStore.storeId })
    ]);

    // Combine and deduplicate patient IDs
    const allPatientIds = [...new Set([...managerPatients, ...userPatients])];
    const totalPatients = allPatientIds.length;

    const staffCount = await VeterinaryStaff.countDocuments({ storeId });

    // Get recent appointments from both collections
    const [recentManagerAppointments, recentUserAppointments] = await Promise.all([
      ManagerVeterinaryAppointment.find({ storeId: veterinaryStore._id })
        .populate('petId', 'name species breed')
        .populate('ownerId', 'name email phone')
        .populate('veterinarianId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      VeterinaryAppointment.find({ storeId: veterinaryStore.storeId })
        .populate('petId', 'name species breed')
        .populate('ownerId', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    // Combine and sort recent appointments
    const recentAppointments = [...recentManagerAppointments, ...recentUserAppointments]
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
    console.error('Veterinary dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
};

// Get medical records
const getMedicalRecords = async (req, res) => {
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

    const { petId, page = 1, limit = 20 } = req.query;

    const filter = {
      storeId: veterinaryStore._id,
      status: 'completed',
      $or: [
        { diagnosis: { $exists: true, $ne: '' } },
        { treatment: { $exists: true, $ne: '' } }
      ]
    };
    
    if (petId) filter.petId = petId;

    const records = await ManagerVeterinaryAppointment.find(filter)
      .populate('petId', 'name species breed age gender')
      .populate('ownerId', 'name email phone')
      .populate('veterinarianId', 'name')
      .sort({ completedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ManagerVeterinaryAppointment.countDocuments(filter);

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