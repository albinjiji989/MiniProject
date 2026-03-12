const CentralizedPetService = require('../services/centralizedPetService');
const PetRegistry = require('../models/PetRegistry');
const AdoptionPet = require('../../modules/adoption/manager/models/AdoptionPet');
const PetInventoryItem = require('../../modules/petshop/manager/models/PetInventoryItem');

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

// Set pet name (one-time by user)
const setPetName = async (req, res) => {
  try {
    const { petCode } = req.params;
    const { name } = req.body;
    const userId = req.user._id || req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Pet name is required' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({ success: false, message: 'Pet name must be between 2 and 50 characters' });
    }

    // Find the registry entry
    const registry = await PetRegistry.findOne({ petCode });
    if (!registry) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Verify the user owns this pet
    if (!registry.currentOwnerId || registry.currentOwnerId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You are not the owner of this pet' });
    }

    // Check if name was already set by user
    if (registry.nameSetByUser) {
      return res.status(400).json({
        success: false,
        message: 'Pet name has already been set. Please request admin to change the name.',
        nameSetAt: registry.nameSetAt,
        currentName: registry.name
      });
    }

    const oldName = registry.name || '';

    // Track previous name
    if (oldName) {
      registry.previousNames = registry.previousNames || [];
      registry.previousNames.push({
        name: oldName,
        changedAt: new Date(),
        changedBy: userId,
        changedByRole: 'user'
      });
    }

    // Update name in PetRegistry
    registry.name = trimmedName;
    registry.nameSetByUser = true;
    registry.nameSetAt = new Date();
    registry.nameSetByUserId = userId;
    registry.updatedBy = userId;
    await registry.save();

    // Update name in source table
    try {
      if (registry.source === 'adoption' && registry.adoptionPetId) {
        await AdoptionPet.findByIdAndUpdate(registry.adoptionPetId, { name: trimmedName });
        console.log(`✅ Updated name in AdoptionPet for ${petCode}`);
      } else if (registry.source === 'petshop' && registry.petShopItemId) {
        await PetInventoryItem.findByIdAndUpdate(registry.petShopItemId, { name: trimmedName });
        console.log(`✅ Updated name in PetInventoryItem for ${petCode}`);
      } else if (registry.userPetId) {
        const Pet = require('../models/Pet');
        await Pet.findByIdAndUpdate(registry.userPetId, { name: trimmedName });
        console.log(`✅ Updated name in Pet for ${petCode}`);
      }
    } catch (sourceErr) {
      console.error(`⚠️ Failed to update name in source table for ${petCode}:`, sourceErr.message);
      // Continue - registry is already updated
    }

    // Log to blockchain
    try {
      const nameEventData = {
        petId: registry._id,
        petCode: registry.petCode,
        oldName: oldName || '(none)',
        newName: trimmedName,
        userId: userId,
        source: registry.source,
        setByRole: 'user',
        timestamp: new Date()
      };

      if (registry.source === 'petshop' || registry.petShopItemId) {
        const petshopBlockchain = require('../../modules/petshop/core/services/petshopBlockchainService');
        await petshopBlockchain.addBlock('pet_name_set', nameEventData);
      } else {
        const BlockchainService = require('../services/blockchainService');
        await BlockchainService.addBlock({
          eventType: 'pet_name_set',
          petId: registry._id.toString(),
          userId: userId.toString(),
          data: nameEventData
        });
      }
      console.log(`🔗 Blockchain: Name change logged for ${petCode}`);
    } catch (blockchainErr) {
      console.error(`⚠️ Blockchain logging failed for name change of ${petCode}:`, blockchainErr.message);
      // Continue - name is already updated
    }

    res.json({
      success: true,
      message: 'Pet name set successfully',
      data: {
        petCode,
        name: trimmedName,
        nameSetByUser: true,
        nameSetAt: registry.nameSetAt,
        previousName: oldName || null
      }
    });
  } catch (error) {
    console.error('Error setting pet name:', error);
    res.status(500).json({ success: false, message: 'Failed to set pet name', error: error.message });
  }
};

// Admin: change pet name (override)
const adminChangePetName = async (req, res) => {
  try {
    const { petCode } = req.params;
    const { name } = req.body;
    const userId = req.user._id || req.user.id;

    // Check if user is admin or manager
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only admins can change pet names after initial set' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Pet name is required' });
    }

    const trimmedName = name.trim();
    const registry = await PetRegistry.findOne({ petCode });
    if (!registry) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    const oldName = registry.name || '';

    // Track previous name
    registry.previousNames = registry.previousNames || [];
    registry.previousNames.push({
      name: oldName,
      changedAt: new Date(),
      changedBy: userId,
      changedByRole: 'admin'
    });

    // Update name in PetRegistry
    registry.name = trimmedName;
    registry.nameSetAt = new Date();
    registry.updatedBy = userId;
    await registry.save();

    // Update name in source table
    try {
      if (registry.source === 'adoption' && registry.adoptionPetId) {
        await AdoptionPet.findByIdAndUpdate(registry.adoptionPetId, { name: trimmedName });
      } else if (registry.source === 'petshop' && registry.petShopItemId) {
        await PetInventoryItem.findByIdAndUpdate(registry.petShopItemId, { name: trimmedName });
      } else if (registry.userPetId) {
        const Pet = require('../models/Pet');
        await Pet.findByIdAndUpdate(registry.userPetId, { name: trimmedName });
      }
    } catch (sourceErr) {
      console.error(`⚠️ Failed to update name in source table for ${petCode}:`, sourceErr.message);
    }

    // Log to blockchain
    try {
      const adminNameEventData = {
        petId: registry._id,
        petCode: registry.petCode,
        oldName: oldName,
        newName: trimmedName,
        adminId: userId,
        source: registry.source,
        setByRole: 'admin',
        timestamp: new Date()
      };

      if (registry.source === 'petshop' || registry.petShopItemId) {
        const petshopBlockchain = require('../../modules/petshop/core/services/petshopBlockchainService');
        await petshopBlockchain.addBlock('pet_name_changed_by_admin', adminNameEventData);
      } else {
        const BlockchainService = require('../services/blockchainService');
        await BlockchainService.addBlock({
          eventType: 'pet_name_changed_by_admin',
          petId: registry._id.toString(),
          userId: userId.toString(),
          data: adminNameEventData
        });
      }
    } catch (blockchainErr) {
      console.error(`⚠️ Blockchain logging failed for admin name change of ${petCode}:`, blockchainErr.message);
    }

    res.json({
      success: true,
      message: 'Pet name updated by admin',
      data: { petCode, name: trimmedName, previousName: oldName }
    });
  } catch (error) {
    console.error('Error admin changing pet name:', error);
    res.status(500).json({ success: false, message: 'Failed to change pet name', error: error.message });
  }
};

module.exports = {
  getAllCentralizedPets,
  getCentralizedPet,
  searchCentralizedPets,
  getCentralizedPetStats,
  getRecentPets,
  setPetName,
  adminChangePetName
};