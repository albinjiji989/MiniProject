const CentralizedPetService = require('../services/centralizedPetService');
const PetRegistry = require('../models/PetRegistry');

// Get all centralized pets with pagination
const getAllCentralizedPets = async (req, res) => {
  try {
    const { page = 1, limit = 20, source, status, search } = req.query;
    
    // Build filter
    const filter = {};
    if (source) filter.source = source;
    if (status) filter.currentStatus = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { petCode: { $regex: search, $options: 'i' } }
      ];
    }

    const result = await CentralizedPetService.getAllCentralizedPets(filter, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching centralized pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message
    });
  }
};

// Get a specific centralized pet by petCode
const getCentralizedPet = async (req, res) => {
  try {
    const { petCode } = req.params;
    console.log('🔍 Centralized Controller - Fetching pet with petCode:', petCode);
    
    const pet = await CentralizedPetService.getCentralizedPet(petCode);
    
    console.log('✅ Centralized Controller - Pet found:', pet?.petCode, 'with', pet?.images?.length || 0, 'images');
    
    res.json({
      success: true,
      data: pet
    });
  } catch (error) {
    console.error('❌ Centralized Controller - Error:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    console.error('Error fetching centralized pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet',
      error: error.message
    });
  }
};

// Search centralized pets
const searchCentralizedPets = async (req, res) => {
  try {
    const { searchTerm } = req.params;
    const { source, status } = req.query;
    
    // Build filter
    const filter = {};
    if (source) filter.source = source;
    if (status) filter.currentStatus = status;

    const pets = await CentralizedPetService.searchCentralizedPets(searchTerm, filter);
    
    res.json({
      success: true,
      data: { pets }
    });
  } catch (error) {
    console.error('Error searching centralized pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching pets',
      error: error.message
    });
  }
};

// Get statistics for centralized pets
const getCentralizedPetStats = async (req, res) => {
  try {
    // Get counts by source
    const sourceStats = await PetRegistry.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get counts by status
    const statusStats = await PetRegistry.aggregate([
      {
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get counts by location
    const locationStats = await PetRegistry.aggregate([
      {
        $group: {
          _id: '$currentLocation',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        bySource: sourceStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        byLocation: locationStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching pet stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// Get recent pets
const getRecentPets = async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    
    const pets = await PetRegistry.find()
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('currentOwnerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50));

    res.json({
      success: true,
      data: { pets }
    });
  } catch (error) {
    console.error('Error fetching recent pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent pets',
      error: error.message
    });
  }
};

module.exports = {
  getAllCentralizedPets,
  getCentralizedPet,
  searchCentralizedPets,
  getCentralizedPetStats,
  getRecentPets
};