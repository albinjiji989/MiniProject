const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to database
const connectDB = require('../core/db');

async function debugPetShopPets() {
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

    // Get users (any role)
    const users = await User.find({}).limit(10);
    console.log('Found users:', users.length);

    for (const user of users) {
      console.log(`\n=== Checking user: ${user.name} (${user._id}) Role: ${user.role} ===`);
      
      // Get completed reservations for this user
      const reservations = await PetReservation.find({
        userId: user._id,
        status: { $in: ['completed', 'at_owner'] }
      }).populate('itemId petId');
      
      console.log(`User has ${reservations.length} completed reservations`);
      
      for (const reservation of reservations) {
        console.log(`\n--- Reservation: ${reservation._id} ---`);
        console.log(`Item ID: ${reservation.itemId?._id}`);
        console.log(`Pet ID: ${reservation.petId}`);
        console.log(`Item petCode: ${reservation.itemId?.petCode}`);
        
        if (reservation.itemId) {
          // Get the inventory item
          const inventoryItem = await PetInventoryItem.findById(reservation.itemId._id)
            .populate('imageIds')
            .populate('speciesId breedId');
          
          // Manually populate images
          if (inventoryItem) {
            await inventoryItem.populate('images');
          }
          
          console.log(`Inventory item name: ${inventoryItem?.name}`);
          console.log(`Inventory item petCode: ${inventoryItem?.petCode}`);
          console.log(`Inventory item imageIds:`, inventoryItem?.imageIds?.length || 0);
          console.log(`Inventory item images:`, inventoryItem?.images?.length || 0);
          
          // Check if this pet is registered in PetRegistry
          if (inventoryItem?.petCode) {
            const registryEntry = await PetRegistry.findOne({ petCode: inventoryItem.petCode })
              .populate('imageIds')
              .populate('species breed');
            
            // Manually populate images
            if (registryEntry) {
              await registryEntry.populate('images');
            }
            
            console.log(`Registry entry exists: ${!!registryEntry}`);
            if (registryEntry) {
              console.log(`Registry currentOwnerId: ${registryEntry.currentOwnerId}`);
              console.log(`Registry currentStatus: ${registryEntry.currentStatus}`);
              console.log(`Registry imageIds:`, registryEntry.imageIds?.length || 0);
              console.log(`Registry images:`, registryEntry.images?.length || 0);
              console.log(`Registry source: ${registryEntry.source}`);
            }
          }
        }
      }
    }
    
    // Also check all registry entries
    console.log('\n=== Checking all PetRegistry entries ===');
    const allRegistryEntries = await PetRegistry.find({})
      .populate('imageIds')
      .populate('species breed')
      .populate('currentOwnerId', 'name email');
    
    // Manually populate images
    for (const entry of allRegistryEntries) {
      await entry.populate('images');
    }
    
    console.log(`Total registry entries: ${allRegistryEntries.length}`);
    for (const entry of allRegistryEntries) {
      console.log(`\n--- Registry Entry: ${entry.petCode} ---`);
      console.log(`Name: ${entry.name}`);
      console.log(`Current Owner: ${entry.currentOwnerId?.name} (${entry.currentOwnerId?._id})`);
      console.log(`Current Status: ${entry.currentStatus}`);
      console.log(`Source: ${entry.source}`);
      console.log(`ImageIds:`, entry.imageIds?.length || 0);
      console.log(`Images:`, entry.images?.length || 0);
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
debugPetShopPets();