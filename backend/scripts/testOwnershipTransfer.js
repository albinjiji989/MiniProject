const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to database
const connectDB = require('../core/db');

async function testOwnershipTransfer() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Import all models to register them
    const PetRegistry = require('../core/models/PetRegistry');
    const PetReservation = require('../modules/petshop/user/models/PetReservation');
    const PetInventoryItem = require('../modules/petshop/manager/models/PetInventoryItem');
    const User = require('../core/models/User');
    const Pet = require('../core/models/Pet');
    const Image = require('../core/models/Image');
    const Species = require('../core/models/Species');
    const Breed = require('../core/models/Breed');

    // Get the specific reservation
    const reservationId = '68fd2763e33ab9f6177fe7a6';
    const reservation = await PetReservation.findById(reservationId)
      .populate('itemId petId userId');
    
    console.log('=== Reservation Details ===');
    console.log(`ID: ${reservation._id}`);
    console.log(`Status: ${reservation.status}`);
    console.log(`User: ${reservation.userId?.name} (${reservation.userId?._id})`);
    
    // Get the inventory item
    const inventoryItem = await PetInventoryItem.findById(reservation.itemId._id)
      .populate('speciesId breedId imageIds');
    
    // Manually populate images
    if (inventoryItem) {
      await inventoryItem.populate('images');
    }
    
    console.log('\n=== Inventory Item Details ===');
    console.log(`ID: ${inventoryItem._id}`);
    console.log(`Name: ${inventoryItem.name}`);
    console.log(`Pet Code: ${inventoryItem.petCode}`);
    console.log(`ImageIds:`, inventoryItem.imageIds?.length || 0);
    console.log(`Images:`, inventoryItem.images?.length || 0);
    
    // Test the registry update directly
    console.log('\n=== Testing Registry Update ===');
    const registryDoc = await PetRegistry.ensureRegistered({
      petCode: inventoryItem.petCode,
      name: inventoryItem.name || 'Pet',
      species: inventoryItem.speciesId,
      breed: inventoryItem.breedId,
      imageIds: inventoryItem.imageIds || [],
      source: 'petshop',
      petShopItemId: inventoryItem._id,
      firstAddedSource: 'pet_shop',
      firstAddedBy: reservation.userId._id,
      corePetId: reservation.petId._id
    }, {
      currentOwnerId: reservation.userId._id,
      currentStatus: 'owned',
      currentLocation: 'at_owner',
      lastTransferAt: new Date()
    });
    
    console.log('Registry update successful:');
    console.log(`Registry ID: ${registryDoc._id}`);
    console.log(`Current Owner: ${registryDoc.currentOwnerId}`);
    console.log(`Current Status: ${registryDoc.currentStatus}`);
    console.log(`Current Location: ${registryDoc.currentLocation}`);
    
    // Verify the update
    const updatedRegistry = await PetRegistry.findOne({ petCode: inventoryItem.petCode });
    console.log('\n=== Verification ===');
    console.log(`Current Owner: ${updatedRegistry.currentOwnerId}`);
    console.log(`Current Status: ${updatedRegistry.currentStatus}`);
    console.log(`Current Location: ${updatedRegistry.currentLocation}`);

    console.log('\n=== Test complete ===');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from database');
  }
}

// Run the test function
testOwnershipTransfer();