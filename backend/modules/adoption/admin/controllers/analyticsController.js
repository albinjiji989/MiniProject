const AdoptionPet = require('../../manager/models/AdoptionPet');
const AdoptionRequest = require('../../manager/models/AdoptionRequest');
const User = require('../../../../core/models/User');

const getAnalytics = async (req, res) => {
  try {
    // Breed popularity
    const breedStats = await AdoptionPet.aggregate([
      { $match: { status: 'adopted', isActive: true } },
      { $group: { _id: '$breed', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Age group distribution
    const ageStats = await AdoptionPet.aggregate([
      { $match: { status: 'adopted', isActive: true } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ['$age', 12] }, then: '0-1 years' },
                { case: { $lte: ['$age', 24] }, then: '1-2 years' },
                { case: { $lte: ['$age', 36] }, then: '2-3 years' },
                { case: { $lte: ['$age', 60] }, then: '3-5 years' }
              ],
              default: '5+ years'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Application success rate
    const applicationStats = await AdoptionRequest.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        breedStats,
        ageStats,
        applicationStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Manager Performance Analytics
const getManagerAnalytics = async (req, res) => {
  try {
    // Get all adoption managers
    const managers = await User.find({ role: 'adoption_manager', isActive: true }).select('name email');
    
    const managerStats = await Promise.all(managers.map(async (manager) => {
      // Pets added by this manager
      const petsAdded = await AdoptionPet.countDocuments({ 
        createdBy: manager._id, 
        isActive: true 
      });
      
      // Pets adopted (managed by this manager)
      const petsAdopted = await AdoptionPet.countDocuments({ 
        createdBy: manager._id, 
        status: 'adopted', 
        isActive: true 
      });
      
      // Applications reviewed by this manager
      const applicationsReviewed = await AdoptionRequest.countDocuments({ 
        reviewedBy: manager._id, 
        isActive: true 
      });
      
      // Revenue generated from pets added by this manager
      const revenueGenerated = await AdoptionRequest.aggregate([
        {
          $lookup: {
            from: 'adoptionpets',
            localField: 'petId',
            foreignField: '_id',
            as: 'pet'
          }
        },
        {
          $match: {
            'pet.createdBy': manager._id,
            paymentStatus: 'completed',
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$paymentDetails.amount' }
          }
        }
      ]);
      
      return {
        managerId: manager._id,
        managerName: manager.name,
        managerEmail: manager.email,
        petsAdded,
        petsAdopted,
        applicationsReviewed,
        revenueGenerated: revenueGenerated[0]?.total || 0,
        adoptionRate: petsAdded > 0 ? ((petsAdopted / petsAdded) * 100).toFixed(1) : 0
      };
    }));

    res.json({
      success: true,
      data: {
        managerStats: managerStats.sort((a, b) => b.petsAdopted - a.petsAdopted)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// User Adoption Analytics
const getUserAnalytics = async (req, res) => {
  try {
    // Top adopters
    const topAdopters = await AdoptionRequest.aggregate([
      { $match: { status: 'completed', isActive: true } },
      { $group: { _id: '$userId', adoptionCount: { $sum: 1 } } },
      { $sort: { adoptionCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          userId: '$_id',
          adoptionCount: 1,
          userName: { $arrayElemAt: ['$user.name', 0] },
          userEmail: { $arrayElemAt: ['$user.email', 0] }
        }
      }
    ]);

    // User activity by month
    const userActivityByMonth = await AdoptionRequest.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          uniqueUsers: { $addToSet: '$userId' },
          totalApplications: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          totalApplications: 1
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Application status distribution
    const applicationStatusStats = await AdoptionRequest.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        topAdopters,
        userActivityByMonth,
        applicationStatusStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Pet Analytics
const getPetAnalytics = async (req, res) => {
  try {
    // Species distribution
    const speciesStats = await AdoptionPet.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$species', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Gender distribution
    const genderStats = await AdoptionPet.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // Health status distribution
    const healthStats = await AdoptionPet.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$healthStatus', count: { $sum: 1 } } }
    ]);

    // Average time to adoption
    const adoptionTimeStats = await AdoptionPet.aggregate([
      { $match: { status: 'adopted', isActive: true } },
      {
        $project: {
          daysToAdoption: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDaysToAdoption: { $avg: '$daysToAdoption' },
          minDaysToAdoption: { $min: '$daysToAdoption' },
          maxDaysToAdoption: { $max: '$daysToAdoption' }
        }
      }
    ]);

    // Pets added over time
    const petsAddedOverTime = await AdoptionPet.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        speciesStats,
        genderStats,
        healthStats,
        adoptionTimeStats: adoptionTimeStats[0] || { avgDaysToAdoption: 0, minDaysToAdoption: 0, maxDaysToAdoption: 0 },
        petsAddedOverTime
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAnalytics,
  getManagerAnalytics,
  getUserAnalytics,
  getPetAnalytics
};