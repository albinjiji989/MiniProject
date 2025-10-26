const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to database
const connectDB = require('../core/db');

async function debugReservationStatus() {
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
    console.log(`Item: ${reservation.itemId?.name} (${reservation.itemId?._id})`);
    console.log(`Pet: ${reservation.petId} (${reservation.petId?._id})`);
    console.log(`Created At: ${reservation.createdAt}`);
    console.log(`Updated At: ${reservation.updatedAt}`);
    
    // Check if status should trigger ownership transfer
    const shouldTransfer = reservation.status === 'completed' || reservation.status === 'at_owner';
    console.log(`Should trigger ownership transfer: ${shouldTransfer}`);
    
    // Check the inventory item
    if (reservation.itemId) {
      const inventoryItem = await PetInventoryItem.findById(reservation.itemId._id);
      console.log('\n=== Inventory Item Details ===');
      console.log(`ID: ${inventoryItem._id}`);
      console.log(`Name: ${inventoryItem.name}`);
      console.log(`Status: ${inventoryItem.status}`);
      console.log(`Sold To: ${inventoryItem.soldTo}`);
      console.log(`Sold At: ${inventoryItem.soldAt}`);
    }
    
    // Check the registry entry
    if (reservation.itemId?.petCode) {
      const registryEntry = await PetRegistry.findOne({ petCode: reservation.itemId.petCode });
      console.log('\n=== Registry Entry Details ===');
      console.log(`ID: ${registryEntry._id}`);
      console.log(`Pet Code: ${registryEntry.petCode}`);
      console.log(`Name: ${registryEntry.name}`);
      console.log(`Current Owner: ${registryEntry.currentOwnerId}`);
      console.log(`Current Status: ${registryEntry.currentStatus}`);
      console.log(`Current Location: ${registryEntry.currentLocation}`);
      console.log(`Last Transfer At: ${registryEntry.lastTransferAt}`);
      console.log(`Ownership History:`, registryEntry.ownershipHistory?.length || 0);
      
      if (registryEntry.ownershipHistory?.length > 0) {
        console.log('Ownership History Details:');
        registryEntry.ownershipHistory.forEach((history, index) => {
          console.log(`  ${index + 1}. Transfer Type: ${history.transferType}`);
          console.log(`     New Owner: ${history.newOwnerId}`);
          console.log(`     Transfer Date: ${history.transferDate}`);
          console.log(`     Source: ${history.source}`);
        });
      }
    }

    console.log('\n=== Debug complete ===');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from database');
  }
}

// Run the debug function
debugReservationStatus();