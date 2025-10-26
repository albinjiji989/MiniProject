const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to database
const connectDB = require('../core/db');

async function testImageFix() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Import all models to register them
    const PetRegistry = require('../core/models/PetRegistry');
    const Pet = require('../core/models/Pet');
    const Species = require('../core/models/Species');
    const Breed = require('../core/models/Breed');
    const Image = require('../core/models/Image');

    // Get the specific pet
    const petId = '68fd3a70550bd93bc40666c8';
    
    // Check the Pet object
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

    console.log('=== Before Fix ===');
    console.log(`Pet Name: ${pet.name}`);
    console.log(`Pet Code: ${pet.petCode}`);
    console.log(`Images Count: ${pet.images?.length || 0}`);
    console.log(`ImageIds Count: ${pet.imageIds?.length || 0}`);

    // Apply the fix logic
    // If pet is found but has no images, check if it's a pet shop purchased pet
    if (pet && (!pet.images || pet.images.length === 0) && pet.petCode) {
      console.log('\nApplying fix: Checking registry for images...');
      // Try to get images from PetRegistry
      try {
        const registryPet = await PetRegistry.findOne({ petCode: pet.petCode })
          .populate('imageIds');
        
        if (registryPet) {
          await registryPet.populate('images');
          
          // If registry has images, add them to the pet
          if (registryPet.images && registryPet.images.length > 0) {
            console.log('✅ Found images in registry, applying fix...');
            pet.images = registryPet.images;
            pet.imageIds = registryPet.imageIds;
          }
        }
      } catch (registryError) {
        console.log('Failed to get images from registry:', registryError.message);
      }
    }

    console.log('\n=== After Fix ===');
    console.log(`Pet Name: ${pet.name}`);
    console.log(`Pet Code: ${pet.petCode}`);
    console.log(`Images Count: ${pet.images?.length || 0}`);
    console.log(`ImageIds Count: ${pet.imageIds?.length || 0}`);
    
    if (pet.images && pet.images.length > 0) {
      console.log('✅ Images successfully added to pet object');
      console.log('First image URL:', pet.images[0].url);
    } else {
      console.log('❌ Still no images in pet object');
    }

    console.log('\n=== Test complete ===');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from database');
  }
}

// Run the test function
testImageFix();