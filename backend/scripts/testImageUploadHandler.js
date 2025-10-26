/**
 * Test script for imageUploadHandler with Cloudinary
 */

require('dotenv').config({ path: './.env' });

// Connect to database first
const mongoose = require('mongoose');
const connectDB = require('../core/db');

const { processEntityImages } = require('../core/utils/imageUploadHandler');

// Test image data (small base64 encoded image)
const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function testImageUploadHandler() {
  try {
    console.log('Testing imageUploadHandler with Cloudinary...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Test image processing with valid values
    const testImages = [
      { url: testImageData, isPrimary: true, caption: 'Primary image' },
      { url: testImageData, isPrimary: false, caption: 'Secondary image' }
    ];
    
    console.log('🖼️  Processing test images...');
    const savedImages = await processEntityImages(
      testImages,
      'PetNew', // Valid entity type
      '64f8a0b4c9e7a123456789ab', // Valid ObjectId format
      '64f8a0b4c9e7a123456789ab', // Valid ObjectId format
      'otherpets', // Valid module
      'user' // Valid role
    );
    
    console.log('✅ Processed', savedImages.length, 'images');
    
    // Check if Cloudinary URLs are valid
    for (const image of savedImages) {
      if (image.url && image.url.startsWith('http')) {
        console.log('✅ Cloudinary image URL is valid:', image.url);
      } else {
        console.log('❌ Invalid image URL:', image.url);
      }
    }
    
    console.log('🎉 ImageUploadHandler test completed successfully!');
    
    // Cleanup
    const Image = require('../core/models/Image');
    for (const image of savedImages) {
      await Image.findByIdAndDelete(image._id);
    }
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔚 Database connection closed');
  }
}

testImageUploadHandler();