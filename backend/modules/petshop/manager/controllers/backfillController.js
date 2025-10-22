const PetInventoryItem = require('../models/PetInventoryItem');
const { getStoreFilter } = require('../../../core/utils/storeFilter');

// Inventory Backfill Functions
const managerBackfillInventoryStoreIds = async (req, res) => {
  try {
    const storeFilter = getStoreFilter(req.user);
    
    // Find items without storeId or storeName
    const filter = {
      $or: [
        { storeId: { $exists: false } },
        { storeId: null },
        { storeName: { $exists: false } },
        { storeName: null }
      ]
    };
    
    // Apply store filter to only update items for this manager's store
    if (storeFilter.storeId) {
      filter.createdBy = storeFilter.storeId;
    }
    
    const items = await PetInventoryItem.find(filter);
    
    let updatedCount = 0;
    for (const item of items) {
      // Update storeId and storeName if missing
      if (!item.storeId || !item.storeName) {
        item.storeId = storeFilter.storeId || item.createdBy;
        item.storeName = req.user.storeName || 'Unknown Store';
        await item.save();
        updatedCount++;
      }
    }
    
    res.json({
      success: true,
      message: `Successfully backfilled ${updatedCount} inventory items`,
      data: { updatedCount, totalProcessed: items.length }
    });
  } catch (err) {
    console.error('Backfill inventory store IDs error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  managerBackfillInventoryStoreIds
};