const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Connect to database
const connectDB = require('./core/db');
connectDB();

// Import models
const Pet = require('./core/models/Pet');
const PetRegistry = require('./core/models/PetRegistry');
const PetInventoryItem = require('./modules/petshop/manager/models/PetInventoryItem');
const PetReservation = require('./modules/petshop/user/models/PetReservation');

async function fixPurchasedPet(petCode, userId) {
  try {
    console.log(`Fixing purchased pet with code: ${petCode} for user: ${userId}`);
    
    // 1. Find the pet in the registry
    const registryPet = await PetRegistry.findOne({ petCode });
    if (!registryPet) {
      console.log('Pet not found in registry');
      return;
    }
    
    console.log('Found registry pet:', registryPet);
    
    // 2. Find the inventory item
    const inventoryItem = await PetInventoryItem.findById(registryPet.petShopItemId);
    if (!inventoryItem) {
      console.log('Inventory item not found');
      return;
    }
    
    console.log('Found inventory item:', inventoryItem);
    
    // 3. Check if pet already exists in user's collection
    const existingPet = await Pet.findOne({ petCode, owner: userId });
    if (existingPet) {
      console.log('Pet already exists in user collection:', existingPet._id);
      return;
    }
    
    // 4. Create pet in user's collection
    const newPet = new Pet({
      name: inventoryItem.name || 'Unnamed Pet',
      species: inventoryItem.speciesId,
      breed: inventoryItem.breedId,
      owner: userId,
      createdBy: userId,
      currentStatus: 'sold',
      gender: inventoryItem.gender || 'Unknown',
      age: inventoryItem.age || 0,
      ageUnit: inventoryItem.ageUnit || 'months',
      color: inventoryItem.color || '',
      petCode: inventoryItem.petCode,
      imageIds: inventoryItem.imageIds || [],
      description: `Purchased from ${inventoryItem.storeName || 'Pet Shop'}`,
      storeId: inventoryItem.storeId,
      storeName: inventoryItem.storeName,
      // Set default values for required fields
      healthStatus: 'Good',
      adoptionFee: 0,
      isAdoptionReady: false,
      tags: ['petshop', 'purchased'],
      location: {
        address: '',
        city: '',
        state: '',
        country: ''
      },
      weight: {
        value: inventoryItem.weight || 0,
        unit: 'kg'
      },
      size: 'medium',
      temperament: [],
      behaviorNotes: '',
      specialNeeds: [],
      adoptionRequirements: []
    });
    
    await newPet.save();
    console.log('Created pet in user collection:', newPet._id);
    
    // 5. Update registry with user as owner
    registryPet.currentOwnerId = userId;
    registryPet.currentLocation = 'at_owner';
    registryPet.currentStatus = 'sold';
    registryPet.lastTransferAt = new Date();
    await registryPet.save();
    
    console.log('Updated registry with user as owner');
    
    console.log('✅ Pet fixed successfully!');
  } catch (error) {
    console.error('Error fixing purchased pet:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node fix-purchased-pet.js <petCode> <userId>');
  console.log('Example: node fix-purchased-pet.js DOG12345 68f6570d086135ed8623b28d');
  process.exit(1);
}

const petCode = args[0];
const userId = args[1];

fixPurchasedPet(petCode, userId);