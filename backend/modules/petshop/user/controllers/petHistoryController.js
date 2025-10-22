const Pet = require('../../../../core/models/Pet');
const { getStoreFilter } = require('../../../../core/utils/storeFilter');

// Pet History Functions
const getPetHistory = async (req, res) => {
  try {
    const { petId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // For managers, apply store filter
    const storeFilter = getStoreFilter(req.user);
    let filter = { _id: petId };
    
    // Apply store filter for managers
    if (storeFilter._id) {
      filter.storeId = storeFilter._id;
    }
    
    // Find the pet
    const pet = await Pet.findOne(filter);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    // Get pet history (this would typically come from a separate history collection)
    // For now, we'll simulate some history data
    const history = [
      {
        id: 1,
        date: pet.createdAt,
        action: 'Created',
        description: 'Pet record created',
        performedBy: pet.createdBy
      },
      {
        id: 2,
        date: pet.updatedAt,
        action: 'Updated',
        description: 'Pet information updated',
        performedBy: pet.lastUpdatedBy
      }
    ];
    
    // If pet has status changes, add those to history
    if (pet.currentStatus) {
      history.push({
        id: 3,
        date: new Date(),
        action: 'Status Change',
        description: `Pet status changed to ${pet.currentStatus}`,
        performedBy: pet.lastUpdatedBy
      });
    }
    
    res.json({
      success: true,
      data: { 
        pet: {
          id: pet._id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          currentStatus: pet.currentStatus
        },
        history 
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