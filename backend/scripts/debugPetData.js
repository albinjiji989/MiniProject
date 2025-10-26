const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to database
const connectDB = require('../core/db');

async function debugPetData() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Import all models to register them
    const PetRegistry = require('../core/models/PetRegistry');
    const Pet = require('../core/models/Pet');
    const Image = require('../core/models/Image');
    const Species = require('../core/models/Species');
    const Breed = require('../core/models/Breed');

    // Get the specific pet
    const petId = '68fd3a70550bd93bc40666c8';
    
    console.log(`=== Debugging Pet Data for ID: ${petId} ===`);
    
    // Test 1: Direct Pet lookup
    console.log('\n--- Test 1: Direct Pet lookup ---');
    let pet = await Pet.findById(petId)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('imageIds');

    // Manually populate the virtual 'images' field
    if (pet) {
      await pet.populate('images');
    }

    console.log('1. Pet Object:');
    console.log(`   Name: ${pet?.name}`);
    console.log(`   Pet Code: ${pet?.petCode}`);
    console.log(`   ImageIds:`, pet?.imageIds);
    console.log(`   ImageIds length: ${pet?.imageIds?.length || 0}`);
    console.log(`   Images:`, pet?.images);
    console.log(`   Images length: ${pet?.images?.length || 0}`);
    
    // Test 2: Registry lookup
    console.log('\n--- Test 2: Registry lookup ---');
    if (pet?.petCode) {
      const registryPet = await PetRegistry.findOne({ petCode: pet.petCode })
        .populate('imageIds');
      
      if (registryPet) {
        await registryPet.populate('images');
      }
      
      console.log('2. Registry Pet:');
      console.log(`   Name: ${registryPet?.name}`);
      console.log(`   Pet Code: ${registryPet?.petCode}`);
      console.log(`   ImageIds:`, registryPet?.imageIds);
      console.log(`   ImageIds length: ${registryPet?.imageIds?.length || 0}`);
      console.log(`   Images:`, registryPet?.images);
      console.log(`   Images length: ${registryPet?.images?.length || 0}`);
      
      if (registryPet?.images?.length > 0) {
        console.log('   First image URL:', registryPet.images[0].url);
      }
    }
    
    // Test 3: Simulate the API fix
    console.log('\n--- Test 3: Simulating API fix ---');
    if (pet && (!pet.images || pet.images.length === 0) && pet.petCode) {
      console.log('   Applying fix...');
      const registryPet = await PetRegistry.findOne({ petCode: pet.petCode })
        .populate('imageIds');
      
      if (registryPet) {
        await registryPet.populate('images');
        
        if (registryPet.images && registryPet.images.length > 0) {
          pet.images = registryPet.images;
          pet.imageIds = registryPet.imageIds;
          console.log('   Fix applied successfully');
        }
      }
    }
    
    console.log('3. Pet Object after fix:');
    console.log(`   Name: ${pet?.name}`);
    console.log(`   Pet Code: ${pet?.petCode}`);
    console.log(`   ImageIds:`, pet?.imageIds);
    console.log(`   ImageIds length: ${pet?.imageIds?.length || 0}`);
    console.log(`   Images:`, pet?.images);
    console.log(`   Images length: ${pet?.images?.length || 0}`);
    
    if (pet?.images?.length > 0) {
      console.log('   First image URL:', pet.images[0].url);
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
debugPetData();