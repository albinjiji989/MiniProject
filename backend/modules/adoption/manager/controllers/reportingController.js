const AdoptionPet = require('../models/AdoptionPet');
const AdoptionRequest = require('../models/AdoptionRequest');
const User = require('../../../../core/models/User');

const getManagerReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = { isActive: true };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const stats = await AdoptionRequest.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const revenue = await AdoptionRequest.aggregate([
      { $match: { ...matchQuery, paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        statusStats: stats,
        totalRevenue: revenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getManagerReports
};