const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { authorize } = require('../../middleware/role');
const User = require('../../models/User');
const Pet = require('../../models/Pet');
const Species = require('../../models/Species');
const Breed = require('../../models/Breed');
const PetCategory = require('../../models/PetCategory');
const Module = require('../../models/Module');
const CustomBreedRequest = require('../../models/CustomBreedRequest');

// @route   GET /api/admin/dashboard/stats
// @desc    Get comprehensive dashboard statistics
// @access  Private (Admin only)
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all statistics in parallel
    const [
      // User statistics
      totalUsers,
      activeUsers,
      newUsers,
      recentUsers,
      
      // Manager statistics
      totalManagers,
      activeManagers,
      
      // Pet statistics
      totalPets,
      availablePets,
      adoptedPets,
      petsBySpecies,
      petsByHealthStatus,
      recentPets,
      
      // Species statistics
      totalSpecies,
      activeSpecies,
      
      // Breed statistics
      totalBreeds,
      activeBreeds,
      
      // Category statistics
      totalCategories,
      activeCategories,
      
      // Module statistics
      totalModules,
      activeModules,
      
      // Breed request statistics
      totalBreedRequests,
      pendingBreedRequests,
      approvedBreedRequests,
    ] = await Promise.all([
      // Users
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      User.countDocuments({ role: 'user', createdAt: { $gte: sevenDaysAgo } }),
      User.find({ role: 'user' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email createdAt'),
      
      // Managers - count all manager-type roles
      User.countDocuments({ role: { $regex: /manager/i } }),
      User.countDocuments({ role: { $regex: /manager/i }, isActive: true }),
      
      // Pets
      Pet.countDocuments({ isActive: true }),
      Pet.countDocuments({ currentStatus: 'Available', isActive: true }),
      Pet.countDocuments({ currentStatus: 'Adopted', isActive: true }),
      Pet.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$speciesId', count: { $sum: 1 } } },
        { $lookup: { from: 'species', localField: '_id', foreignField: '_id', as: 'species' } },
        { $unwind: { path: '$species', preserveNullAndEmptyArrays: true } },
        { $project: { species: { $ifNull: ['$species.displayName', 'Unknown'] }, count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Pet.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$healthStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Pet.find({ isActive: true })
        .populate('speciesId', 'displayName')
        .populate('breedId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name speciesId breedId createdAt'),
      
      // Species
      Species.countDocuments(),
      Species.countDocuments({ isActive: true }),
      
      // Breeds
      Breed.countDocuments(),
      Breed.countDocuments({ isActive: true }),
      
      // Categories
      PetCategory.countDocuments(),
      PetCategory.countDocuments({ isActive: true }),
      
      // Modules
      Module.countDocuments(),
      Module.countDocuments({ isActive: true }),
      
      // Breed Requests
      CustomBreedRequest.countDocuments(),
      CustomBreedRequest.countDocuments({ status: 'pending' }),
      CustomBreedRequest.countDocuments({ status: 'approved' }),
    ]);

    // Calculate growth rates (simplified - you can enhance this)
    const userGrowth = newUsers > 0 ? Math.round((newUsers / Math.max(totalUsers - newUsers, 1)) * 100) : 0;

    const dashboardStats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        growth: userGrowth,
        recent: recentUsers
      },
      managers: {
        total: totalManagers,
        active: activeManagers,
        pending: 0,
        growth: 0
      },
      pets: {
        total: totalPets,
        available: availablePets,
        adopted: adoptedPets,
        growth: 0,
        bySpecies: petsBySpecies,
        byHealthStatus: petsByHealthStatus,
        recent: recentPets
      },
      species: {
        total: totalSpecies,
        active: activeSpecies,
        growth: 0
      },
      breeds: {
        total: totalBreeds,
        active: activeBreeds,
        growth: 0
      },
      categories: {
        total: totalCategories,
        active: activeCategories,
        growth: 0
      },
      modules: {
        total: totalModules,
        active: activeModules,
        growth: 0
      },
      breedRequests: {
        total: totalBreedRequests,
        pending: pendingBreedRequests,
        approved: approvedBreedRequests,
        growth: 0
      }
    };

    res.json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});

// @route   GET /api/admin/dashboard/recent-activities
// @desc    Get recent system activities
// @access  Private (Admin only)
router.get('/recent-activities', auth, authorize('admin'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent activities from different sources
    const [recentUsers, recentPets, recentBreedRequests] = await Promise.all([
      User.find({ role: 'user' })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('name email createdAt'),
      Pet.find({ isActive: true })
        .populate('speciesId', 'displayName')
        .sort({ createdAt: -1 })
        .limit(3)
        .select('name speciesId createdAt'),
      CustomBreedRequest.find()
        .populate('requestedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(2)
        .select('breedName requestedBy createdAt status')
    ]);

    const activities = [];

    // Add user activities
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user._id}`,
        type: 'user_registered',
        message: `New user registered: ${user.name}`,
        time: user.createdAt,
        icon: 'PersonAdd'
      });
    });

    // Add pet activities
    recentPets.forEach(pet => {
      activities.push({
        id: `pet-${pet._id}`,
        type: 'pet_added',
        message: `Pet "${pet.name}" added to system`,
        time: pet.createdAt,
        icon: 'Pets'
      });
    });

    // Add breed request activities
    recentBreedRequests.forEach(request => {
      activities.push({
        id: `breed-${request._id}`,
        type: 'breed_request',
        message: `Breed request for "${request.breedName}" by ${request.requestedBy?.name || 'Unknown'}`,
        time: request.createdAt,
        icon: 'Assignment'
      });
    });

    // Sort by time and limit
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedActivities = activities.slice(0, limit);

    res.json({
      success: true,
      data: limitedActivities
    });
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities',
      error: error.message
    });
  }
});

// @route   GET /api/admin/dashboard/system-alerts
// @desc    Get system alerts and notifications
// @access  Private (Admin only)
router.get('/system-alerts', auth, authorize('admin'), async (req, res) => {
  try {
    const alerts = [];

    // Check for pending breed requests
    const pendingRequests = await CustomBreedRequest.countDocuments({ status: 'pending' });
    if (pendingRequests > 0) {
      alerts.push({
        id: 'pending-breed-requests',
        type: 'warning',
        message: `${pendingRequests} breed request${pendingRequests > 1 ? 's' : ''} need${pendingRequests === 1 ? 's' : ''} review`,
        action: 'Review Requests',
        actionUrl: '/admin/custom-breed-requests'
      });
    }

    // Check for inactive managers
    const inactiveManagers = await User.countDocuments({ role: { $regex: /manager/i }, isActive: false });
    if (inactiveManagers > 0) {
      alerts.push({
        id: 'inactive-managers',
        type: 'info',
        message: `${inactiveManagers} manager${inactiveManagers > 1 ? 's are' : ' is'} inactive`,
        action: 'View Managers',
        actionUrl: '/admin/managers'
      });
    }

    // Check for pets without proper categorization
    const uncategorizedPets = await Pet.countDocuments({ 
      isActive: true, 
      $or: [{ species: null }, { breed: null }] 
    });
    if (uncategorizedPets > 0) {
      alerts.push({
        id: 'uncategorized-pets',
        type: 'warning',
        message: `${uncategorizedPets} pet${uncategorizedPets > 1 ? 's need' : ' needs'} proper categorization`,
        action: 'Review Pets',
        actionUrl: '/admin/pets'
      });
    }

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('System alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system alerts',
      error: error.message
    });
  }
});

module.exports = router;