#!/usr/bin/env node
/**
 * Data migration script to fix PetRegistry inconsistencies for pet shop pets
 * This script ensures all PetInventoryItems are properly registered in the PetRegistry
 * and that purchased pets have correct ownership information
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const PetInventoryItem = require('../modules/petshop/manager/models/PetInventoryItem');
const PetRegistry = require('../core/models/PetRegistry');
const Pet = require('../core/models/Pet');
const PetReservation = require('../modules/petshop/user/models/PetReservation');

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pet_management_system');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Function to register a pet inventory item in PetRegistry
const registerPetInventoryItem = async (item) => {
  try {
    console.log(`\n🔧 Processing inventory item: ${item.name} (${item.petCode})`);
    
    // Get species and breed details
    const Species = require('../core/models/Species');
    const Breed = require('../core/models/Breed');
    
    const speciesDoc = item.speciesId ? await Species.findById(item.speciesId) : null;
    const breedDoc = item.breedId ? await Breed.findById(item.breedId) : null;
    
    // Populate images to ensure we have the correct imageIds
    await item.populate('images');
    const itemImageIds = item.imageIds || [];
    
    console.log(`  🖼️  Image IDs: ${itemImageIds.length}`);
    
    // Create or update registry entry
    const registryDoc = await PetRegistry.findOneAndUpdate(
      { petCode: item.petCode },
      {
        $set: {
          name: item.name,
          species: speciesDoc?._id,
          breed: breedDoc?._id,
          imageIds: itemImageIds,
          gender: item.gender,
          age: item.age,
          ageUnit: item.ageUnit,
          color: item.color,
          source: 'petshop',
          petShopItemId: item._id,
          firstAddedSource: 'pet_shop',
          currentLocation: item.status === 'available_for_sale' ? 'at_petshop' : 'in_petshop',
          currentStatus: item.status === 'available_for_sale' ? 'available' : 'in_petshop'
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    console.log(`  ✅ Registered in PetRegistry: ${registryDoc._id}`);
    return registryDoc;
  } catch (error) {
    console.error(`  ❌ Error registering inventory item ${item.petCode}:`, error.message);
    return null;
  }
};

// Function to update PetRegistry for purchased pets
const updatePurchasedPetRegistry = async (reservation) => {
  try {
    console.log(`\n💰 Processing purchased pet reservation: ${reservation.reservationCode}`);
    
    // Get the inventory item
    const inventoryItem = await PetInventoryItem.findById(reservation.itemId)
      .populate('speciesId')
      .populate('breedId')
      .populate('imageIds');
    
    if (!inventoryItem) {
      console.log(`  ⚠️  Inventory item not found for reservation ${reservation.reservationCode}`);
      return null;
    }
    
    // Get the actual pet record if it exists
    let actualPet = null;
    if (reservation.petId) {
      actualPet = await Pet.findById(reservation.petId);
    }
    
    console.log(`  🐾 Inventory item: ${inventoryItem.name} (${inventoryItem.petCode})`);
    console.log(`  👤 Owner: ${reservation.userId}`);
    
    // Update PetRegistry with ownership information
    const registryDoc = await PetRegistry.findOneAndUpdate(
      { petCode: inventoryItem.petCode },
      {
        $set: {
          name: inventoryItem.name,
          species: inventoryItem.speciesId,
          breed: inventoryItem.breedId,
          imageIds: inventoryItem.imageIds || [],
          gender: inventoryItem.gender,
          age: inventoryItem.age,
          ageUnit: inventoryItem.ageUnit,
          color: inventoryItem.color,
          currentOwnerId: reservation.userId,
          currentStatus: 'owned',
          currentLocation: 'at_owner',
          lastTransferAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    
    // Add ownership history if not already present
    const ownershipRecordExists = registryDoc.ownershipHistory.some(
      record => record.newOwnerId.toString() === reservation.userId.toString() &&
                record.transferType === 'purchase'
    );
    
    if (!ownershipRecordExists) {
      await PetRegistry.findByIdAndUpdate(
        registryDoc._id,
        {
          $push: {
            ownershipHistory: {
              previousOwnerId: null,
              newOwnerId: reservation.userId,
              transferType: 'purchase',
              transferDate: reservation.updatedAt || new Date(),
              transferPrice: reservation.paymentInfo?.amount || 0,
              transferReason: 'Pet shop purchase',
              source: 'petshop',
              performedBy: reservation.userId
            }
          }
        }
      );
      console.log(`  📝 Added ownership history record`);
    }
    
    console.log(`  ✅ Updated PetRegistry for purchased pet: ${registryDoc._id}`);
    return registryDoc;
  } catch (error) {
    console.error(`  ❌ Error updating purchased pet registry for reservation ${reservation.reservationCode}:`, error.message);
    return null;
  }
};

// Main migration function
const runMigration = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting PetRegistry migration for pet shop pets...\n');
    
    // 1. Process all PetInventoryItems to ensure they're registered
    console.log('📋 Step 1: Registering all PetInventoryItems in PetRegistry...');
    const inventoryItems = await PetInventoryItem.find({}).populate('speciesId breedId imageIds');
    console.log(`  Found ${inventoryItems.length} inventory items`);
    
    let registeredCount = 0;
    for (const item of inventoryItems) {
      const result = await registerPetInventoryItem(item);
      if (result) registeredCount++;
    }
    console.log(`  ✅ Registered ${registeredCount} inventory items\n`);
    
    // 2. Process all completed reservations to update PetRegistry ownership
    console.log('📋 Step 2: Updating PetRegistry for purchased pets...');
    const purchasedReservations = await PetReservation.find({
      status: { $in: ['completed', 'at_owner', 'paid', 'ready_pickup', 'delivered'] }
    }).populate('itemId');
    console.log(`  Found ${purchasedReservations.length} purchased reservations`);
    
    let updatedCount = 0;
    for (const reservation of purchasedReservations) {
      const result = await updatePurchasedPetRegistry(reservation);
      if (result) updatedCount++;
    }
    console.log(`  ✅ Updated ${updatedCount} purchased pets\n`);
    
    // 3. Verify consistency
    console.log('📋 Step 3: Verifying consistency...');
    const registryCount = await PetRegistry.countDocuments({ source: 'petshop' });
    console.log(`  📊 Total pet shop pets in PetRegistry: ${registryCount}`);
    
    const availableCount = await PetRegistry.countDocuments({ 
      source: 'petshop', 
      currentStatus: 'available' 
    });
    console.log(`  📊 Available for sale: ${availableCount}`);
    
    const ownedCount = await PetRegistry.countDocuments({ 
      source: 'petshop', 
      currentStatus: 'owned' 
    });
    console.log(`  📊 Owned by users: ${ownedCount}`);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('📋 Summary:');
    console.log(`  - Registered ${registeredCount} inventory items`);
    console.log(`  - Updated ${updatedCount} purchased pets`);
    console.log(`  - Total pet shop pets in registry: ${registryCount}`);
    
  } catch (error) {
    console.error('_migration error:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the migration
if (require.main === module) {
  runMigration();
}

module.exports = {
  registerPetInventoryItem,
  updatePurchasedPetRegistry,
  runMigration
};