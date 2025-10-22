const AdoptionPet = require('../../manager/models/AdoptionPet');
const AdoptionRequest = require('../../manager/models/AdoptionRequest');
const User = require('../../../../core/models/User');

// Admin Controllers
const getAdminStats = async (req, res) => {
  try {
    const totalPets = await AdoptionPet.countDocuments({ isActive: true });
    const availablePets = await AdoptionPet.countDocuments({ status: 'available', isActive: true });
    const adoptedPets = await AdoptionPet.countDocuments({ status: 'adopted', isActive: true });
    const totalApplications = await AdoptionRequest.countDocuments({ isActive: true });
    const pendingApplications = await AdoptionRequest.countDocuments({ status: 'pending', isActive: true });
    const completedAdoptions = await AdoptionRequest.countDocuments({ status: 'completed', isActive: true });

    // Payment statistics
    const totalRevenue = await AdoptionRequest.aggregate([
      { $match: { paymentStatus: 'completed', isActive: true } },
      { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
    ]);

    const monthlyStats = await AdoptionRequest.aggregate([
      {
        $match: {
          status: 'completed',
          isActive: true,
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$paymentDetails.amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalPets,
          availablePets,
          adoptedPets,
          totalApplications,
          pendingApplications,
          completedAdoptions,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        monthlyStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllAdoptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const query = { isActive: true };

    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const adoptions = await AdoptionRequest.find(query)
      .populate('userId', 'name email phone')
      .populate('petId', 'name breed species age status')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AdoptionRequest.countDocuments(query);

    res.json({
      success: true,
      data: {
        adoptions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPaymentReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = { paymentStatus: 'completed', isActive: true };

    if (startDate || endDate) {
      matchQuery['paymentDetails.paymentDate'] = {};
      if (startDate) matchQuery['paymentDetails.paymentDate'].$gte = new Date(startDate);
      if (endDate) matchQuery['paymentDetails.paymentDate'].$lte = new Date(endDate);
    }

    const payments = await AdoptionRequest.find(matchQuery)
      .populate('userId', 'name email')
      .populate('petId', 'name breed')
      .select('paymentDetails status createdAt')
      .sort({ 'paymentDetails.paymentDate': -1 });

    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.paymentDetails?.amount || 0), 0);

    res.json({
      success: true,
      data: {
        payments,
        totalRevenue,
        totalTransactions: payments.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAdminStats,
  getAllAdoptions,
  getPaymentReports
};