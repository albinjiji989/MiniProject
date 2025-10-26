const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to database
const connectDB = require('../core/db');

async function debugPetImages() {
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

    // Get the specific pet
    const petId = '68fd3a70550bd93bc40666c8';
    
    // Check the Pet object
    const pet = await Pet.findById(petId).populate('imageIds');
    console.log('=== Pet Object ===');
    console.log(`ID: ${pet._id}`);
    console.log(`Name: ${pet.name}`);
    console.log(`Pet Code: ${pet.petCode}`);
    console.log(`ImageIds:`, pet.imageIds?.length || 0);
    console.log(`ImageIds content:`, pet.imageIds);
    
    // Manually populate images
    if (pet) {
      await pet.populate('images');
    }
    console.log(`Images:`, pet.images?.length || 0);
    console.log(`Images content:`, pet.images);
    
    // Check the registry entry
    if (pet.petCode) {
      const registryEntry = await PetRegistry.findOne({ petCode: pet.petCode })
        .populate('imageIds');
      
      // Manually populate images
      if (registryEntry) {
        await registryEntry.populate('images');
      }
      
      console.log('\n=== Registry Entry ===');
      console.log(`ID: ${registryEntry._id}`);
      console.log(`Pet Code: ${registryEntry.petCode}`);
      console.log(`Name: ${registryEntry.name}`);
      console.log(`ImageIds:`, registryEntry.imageIds?.length || 0);
      console.log(`ImageIds content:`, registryEntry.imageIds);
      console.log(`Images:`, registryEntry.images?.length || 0);
      console.log(`Images content:`, registryEntry.images);
      
      // Check if registry has images but pet doesn't
      if (registryEntry.images?.length > 0 && (!pet.images || pet.images.length === 0)) {
        console.log('\n!!! ISSUE FOUND: Registry has images but Pet object does not !!!');
      }
    }
    
    // Check the inventory item
    const inventoryItem = await PetInventoryItem.findOne({ petCode: pet.petCode })
      .populate('imageIds');
    
    // Manually populate images
    if (inventoryItem) {
      await inventoryItem.populate('images');
    }
    
    console.log('\n=== Inventory Item ===');
    console.log(`ID: ${inventoryItem._id}`);
    console.log(`Name: ${inventoryItem.name}`);
    console.log(`Pet Code: ${inventoryItem.petCode}`);
    console.log(`ImageIds:`, inventoryItem.imageIds?.length || 0);
    console.log(`ImageIds content:`, inventoryItem.imageIds);
    console.log(`Images:`, inventoryItem.images?.length || 0);
    console.log(`Images content:`, inventoryItem.images);

    console.log('\n=== Debug complete ===');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from database');
  }
}

// Run the debug function
debugPetImages();