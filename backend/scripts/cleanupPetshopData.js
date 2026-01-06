/**
 * Cleanup script to remove all petshop pets from database
 * Removes: PetInventoryItems, PetStocks, PetBatches
 * Cleans PetRegistry entries but preserves adoption pets
 */

require('dotenv').config();
const mongoose = require('mongoose');
const PetInventoryItem = require('../modules/petshop/manager/models/PetInventoryItem');
const PetStock = require('../modules/petshop/manager/models/PetStock');
const PetBatch = require('../modules/petshop/manager/models/PetBatch');
const PetRegistry = require('../core/models/PetRegistry');

const cleanupPetshopData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Find all petshop inventory items
    const petshopItems = await PetInventoryItem.find({});
    const petshopItemIds = petshopItems.map(item => item._id);
    const petCodes = petshopItems.map(item => item.petCode).filter(Boolean);
    
    console.log(`\n📊 Found ${petshopItems.length} petshop inventory items to delete`);
    console.log(`📊 Found ${petCodes.length} pet codes to remove from registry`);

    // 2. Delete all PetInventoryItems
    const deletedItems = await PetInventoryItem.deleteMany({});
    console.log(`✅ Deleted ${deletedItems.deletedCount} PetInventoryItems`);

    // 3. Delete all PetStocks
    const deletedStocks = await PetStock.deleteMany({});
    console.log(`✅ Deleted ${deletedStocks.deletedCount} PetStocks`);

    // 4. Delete all PetBatches
    const deletedBatches = await PetBatch.deleteMany({});
    console.log(`✅ Deleted ${deletedBatches.deletedCount} PetBatches`);

    // 5. Clean up PetRegistry entries for petshop pets ONLY
    // Be careful to only remove entries with source='petshop' or firstAddedSource='pet_shop'
    const registryFilter = {
      $or: [
        { source: 'petshop' },
        { firstAddedSource: 'pet_shop' },
        { petCode: { $in: petCodes } }
      ]
    };

    // First, let's see what we're about to delete
    const registryEntriesToDelete = await PetRegistry.find(registryFilter);
    console.log(`\n📊 Found ${registryEntriesToDelete.length} PetRegistry entries to clean up`);
    
    // Show sample entries
    if (registryEntriesToDelete.length > 0) {
      console.log('Sample entries to delete:');
      registryEntriesToDelete.slice(0, 3).forEach(entry => {
        console.log(`  - ${entry.petCode} (source: ${entry.source}, firstAddedSource: ${entry.firstAddedSource})`);
      });
    }

    // Delete petshop entries from PetRegistry
    const deletedRegistry = await PetRegistry.deleteMany(registryFilter);
    console.log(`✅ Deleted ${deletedRegistry.deletedCount} PetRegistry entries`);

    // 6. Verify adoption pets are still there
    const adoptionPets = await PetRegistry.countDocuments({
      $or: [
        { source: 'adoption' },
        { firstAddedSource: 'adoption_center' }
      ]
    });
    console.log(`\n✅ Verified: ${adoptionPets} adoption pets remain in PetRegistry`);

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('Summary:');
    console.log(`  - PetInventoryItems deleted: ${deletedItems.deletedCount}`);
    console.log(`  - PetStocks deleted: ${deletedStocks.deletedCount}`);
    console.log(`  - PetBatches deleted: ${deletedBatches.deletedCount}`);
    console.log(`  - PetRegistry entries deleted: ${deletedRegistry.deletedCount}`);
    console.log(`  - Adoption pets preserved: ${adoptionPets}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
};

cleanupPetshopData();
