const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/petcare');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  // Load models
  const PetRegistry = require('./core/models/PetRegistry');
  const PetInventoryItem = require('./modules/petshop/manager/models/PetInventoryItem');
  
  const userId = '68f6570d086135ed8623b28d';
  const petIdToCheck = '68fa04bf03bc4d5120b2816b';
  
  console.log(`Checking for pets owned by user ID: ${userId}`);
  console.log(`Checking if pet ID ${petIdToCheck} exists anywhere`);
  
  // Check if the pet ID exists in PetInventoryItem
  try {
    const inventoryItem = await PetInventoryItem.findById(petIdToCheck);
    if (inventoryItem) {
      console.log('Found in PetInventoryItem:');
      console.log('- ID:', inventoryItem._id);
      console.log('- PetCode:', inventoryItem.petCode);
      console.log('- Name:', inventoryItem.name);
      console.log('- Status:', inventoryItem.status);
      
      // Check if this pet is in the registry
      if (inventoryItem.petCode) {
        const registryEntry = await PetRegistry.findOne({ petCode: inventoryItem.petCode });
        if (registryEntry) {
          console.log('Found in PetRegistry:');
          console.log('- ID:', registryEntry._id);
          console.log('- Current Owner ID:', registryEntry.currentOwnerId);
          console.log('- Current Status:', registryEntry.currentStatus);
        } else {
          console.log('Not found in PetRegistry');
        }
      }
    } else {
      console.log('Not found in PetInventoryItem');
    }
  } catch (err) {
    console.log('Error checking PetInventoryItem:', err.message);
  }
  
  // Check user's pets in registry
  try {
    const pets = await PetRegistry.find({ currentOwnerId: userId });
    console.log('\nFound', pets.length, 'pets in registry for this user');
    
    pets.forEach((pet, index) => {
      console.log(`${index + 1}. ID: ${pet._id}, PetCode: ${pet.petCode}, Name: ${pet.name}, Source: ${pet.source}`);
    });
  } catch (err) {
    console.log('Error checking user pets:', err.message);
  }
  
  // Close connection
  mongoose.connection.close();
});