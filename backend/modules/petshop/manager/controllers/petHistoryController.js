const PetHistory = require('../../../../core/models/PetHistory');
const PetInventoryItem = require('../models/PetInventoryItem');
const { getStoreFilter } = require('../../../../core/utils/storeFilter');

// Pet History Functions
const getPetHistory = async (req, res) => {
  try {
    const { petId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Apply store filter for managers
    const storeFilter = getStoreFilter(req.user);
    let filter = { petId: petId };
    
    // Apply store filter for managers
    if (storeFilter._id) {
      filter.storeId = storeFilter._id;
    }
    
    // Find the pet inventory item to verify it exists and belongs to this store
    const pet = await PetInventoryItem.findOne({ 
      _id: petId,
      ...storeFilter
    }).populate('imageIds').populate('speciesId', 'name displayName').populate('breedId', 'name');
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found or access denied'
      });
    }
    
    // Manually populate the virtual 'images' field to ensure images are available
    await pet.populate('images');
    
    // Get pet history with pagination
    const history = await PetHistory.find(filter)
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await PetHistory.countDocuments(filter);
    
    res.json({
      success: true,
      data: { 
        pet: pet, // Include the pet details with images
        history,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (err) {
    console.error('Get pet history error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getPetHistory
};