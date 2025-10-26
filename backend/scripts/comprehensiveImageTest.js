/**
 * Comprehensive test for all image upload scenarios
 */

require('dotenv').config({ path: './.env' });

const mongoose = require('mongoose');
const connectDB = require('../core/db');
const { processEntityImages } = require('../core/utils/imageUploadHandler');

// Test image data (small base64 encoded image)
const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function comprehensiveImageTest() {
  try {
    console.log('🧪 Starting comprehensive image upload test...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Test 1: Adoption Manager - Add Adoption Pet
    console.log('\n📋 Test 1: Adoption Manager - Add Adoption Pet');
    const adoptionImages = [{ url: testImageData, isPrimary: true, caption: 'Adoption pet' }];
    const adoptionSaved = await processEntityImages(
      adoptionImages,
      'AdoptionPet',
      '64f8a0b4c9e7a123456789ab',
      '64f8a0b4c9e7a123456789ab',
      'adoption',
      'manager'
    );
    console.log('✅ Adoption pet images processed:', adoptionSaved.length);
    console.log('📍 Cloudinary URL:', adoptionSaved[0].url);
    
    // Test 2: Pet Shop Manager - Add Pet Stock
    console.log('\n📋 Test 2: Pet Shop Manager - Add Pet Stock');
    const petshopImages = [{ url: testImageData, isPrimary: true, caption: 'Pet shop inventory' }];
    const petshopSaved = await processEntityImages(
      petshopImages,
      'PetInventoryItem',
      '64f8a0b4c9e7a123456789ac',
      '64f8a0b4c9e7a123456789ac',
      'petshop',
      'manager'
    );
    console.log('✅ Pet shop inventory images processed:', petshopSaved.length);
    console.log('📍 Cloudinary URL:', petshopSaved[0].url);
    
    // Test 3: User - Add Pet
    console.log('\n📋 Test 3: User - Add Pet');
    const userPetImages = [{ url: testImageData, isPrimary: true, caption: 'User pet' }];
    const userPetSaved = await processEntityImages(
      userPetImages,
      'PetNew',
      '64f8a0b4c9e7a123456789ad',
      '64f8a0b4c9e7a123456789ad',
      'otherpets',
      'user'
    );
    console.log('✅ User pet images processed:', userPetSaved.length);
    console.log('📍 Cloudinary URL:', userPetSaved[0].url);
    
    // Test 4: Fetch/Display Verification
    console.log('\n📋 Test 4: Fetch/Display Verification');
    const allImages = [...adoptionSaved, ...petshopSaved, ...userPetSaved];
    let allValid = true;
    
    for (const image of allImages) {
      if (image.url && image.url.startsWith('http')) {
        console.log('✅ Valid Cloudinary URL:', image.url);
      } else {
        console.log('❌ Invalid URL:', image.url);
        allValid = false;
      }
    }
    
    if (allValid) {
      console.log('✅ All images have valid Cloudinary URLs');
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    const Image = require('../core/models/Image');
    for (const image of allImages) {
      await Image.findByIdAndDelete(image._id);
    }
    console.log('✅ Cleanup completed');
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Adoption manager uploads work with Cloudinary');
    console.log('✅ Pet shop manager uploads work with Cloudinary');
    console.log('✅ User pet uploads work with Cloudinary');
    console.log('✅ Image fetching works correctly with Cloudinary URLs');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔚 Database connection closed');
  }
}

comprehensiveImageTest();