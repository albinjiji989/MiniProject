/**
 * Test script for the new image upload system
 * This script tests the image upload functionality for user-added pets
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to database
const connectDB = require('../core/db');
const PetNew = require('../core/models/PetNew');
const Image = require('../core/models/Image');
const { processEntityImages } = require('../core/utils/imageUploadHandler');

// Mock user object
const mockUser = {
  id: '64f8a0b4c9e7a123456789ab',
  name: 'Test User',
  email: 'test@example.com'
};

// Test image data (small base64 encoded image)
const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function runTest() {
  try {
    console.log('🔍 Testing image upload system...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Create a test pet
    const pet = new PetNew({
      name: 'Test Pet',
      age: 2,
      ageUnit: 'years',
      gender: 'Male',
      color: 'Brown',
      speciesId: '64f8a0b4c9e7a123456789ac',
      breedId: '64f8a0b4c9e7a123456789ad',
      ownerId: mockUser.id,
      createdBy: mockUser.id
    });
    
    await pet.save();
    console.log('✅ Test pet created with ID:', pet._id);
    
    // Test image processing
    const testImages = [
      { url: testImageData, isPrimary: true, caption: 'Primary image' },
      { url: testImageData, isPrimary: false, caption: 'Secondary image' }
    ];
    
    console.log('🖼️  Processing test images...');
    const savedImages = await processEntityImages(
      testImages,
      'PetNew',
      pet._id.toString(),
      mockUser.id,
      'otherpets',
      'user'
    );
    
    console.log('✅ Processed', savedImages.length, 'images');
    
    // Update pet with image references
    if (savedImages.length > 0) {
      pet.imageIds = savedImages.map(img => img._id);
      await pet.save();
      console.log('✅ Pet updated with image references');
    }
    
    // Verify images were saved correctly
    const updatedPet = await PetNew.findById(pet._id).populate('images');
    console.log('📋 Pet images:', updatedPet.images);
    
    // Check if files exist
    for (const image of updatedPet.images) {
      const fullPath = path.join(__dirname, '../', image.url);
      try {
        await fs.access(fullPath);
        console.log('✅ Image file exists:', image.url);
      } catch (err) {
        console.log('❌ Image file missing:', image.url);
      }
    }
    
    console.log('🎉 Test completed successfully!');
    
    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await PetNew.findByIdAndDelete(pet._id);
    for (const image of updatedPet.images) {
      await Image.findByIdAndDelete(image._id);
      const fullPath = path.join(__dirname, '../', image.url);
      try {
        await fs.unlink(fullPath);
        console.log('🗑️  Deleted image file:', image.url);
      } catch (err) {
        console.log('⚠️  Could not delete image file:', image.url);
      }
    }
    
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔚 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  runTest();
}

module.exports = { runTest };