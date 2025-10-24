const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Connect to database
const connectDB = require('./core/db');
connectDB();

// Import models
const PetRegistry = require('./core/models/PetRegistry');
const PetInventoryItem = require('./modules/petshop/manager/models/PetInventoryItem');
const PetReservation = require('./modules/petshop/user/models/PetReservation');
const User = require('./core/models/User');

async function findPurchasedPets() {
  try {
    console.log('Finding purchased pets...');
    
    // Find all registry entries from petshop
    const registryPets = await PetRegistry.find({ source: 'petshop' })
      .populate('currentOwnerId', 'name email');
    
    console.log(`Found ${registryPets.length} pets in registry from petshop`);
    
    for (const pet of registryPets) {
      console.log('\n--- Pet ---');
      console.log(`Pet Code: ${pet.petCode}`);
      console.log(`Name: ${pet.name}`);
      console.log(`Status: ${pet.currentStatus}`);
      console.log(`Location: ${pet.currentLocation}`);
      console.log(`Owner: ${pet.currentOwnerId ? `${pet.currentOwnerId.name} (${pet.currentOwnerId.email})` : 'None'}`);
      console.log(`Last Transfer: ${pet.lastTransferAt}`);
      
      // Find inventory item
      if (pet.petShopItemId) {
        const inventoryItem = await PetInventoryItem.findById(pet.petShopItemId);
        if (inventoryItem) {
          console.log(`Price: ₹${inventoryItem.price}`);
          console.log(`Store: ${inventoryItem.storeName}`);
        }
      }
      
      // Find reservation
      if (pet.petShopItemId) {
        const reservation = await PetReservation.findOne({ itemId: pet.petShopItemId })
          .populate('userId', 'name email');
        if (reservation) {
          console.log(`Reservation Status: ${reservation.status}`);
          console.log(`Reserved by: ${reservation.userId ? `${reservation.userId.name} (${reservation.userId.email})` : 'None'}`);
        }
      }
    }
  } catch (error) {
    console.error('Error finding purchased pets:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

findPurchasedPets();