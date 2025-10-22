/**
 * Test script for the adoption module image upload system
 * This script tests the image upload functionality for adoption managers
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to database
const connectDB = require('../core/db');
const Image = require('../core/models/Image');
const { processEntityImages } = require('../core/utils/imageUploadHandler');

// Mock manager user
const mockManager = {
  id: '64f8a0b4c9e7a123456789ac',
  name: 'Adoption Manager',
  email: 'manager@adoption.com',
  role: 'manager'
};

// Test image data (small base64 encoded image)
const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function runTest() {
  try {
    console.log('🔍 Testing adoption module image upload system...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Test image processing for adoption manager
    const testImages = [
      { url: testImageData, isPrimary: true, caption: 'Primary adoption pet image' },
      { url: testImageData, isPrimary: false, caption: 'Secondary adoption pet image' }
    ];
    
    console.log('🖼️  Processing test images for adoption/manager...');
    const savedImages = await processEntityImages(
      testImages,
      'AdoptionPet',  // Entity type
      mockManager.id, // Entity ID
      mockManager.id, // User ID
      'adoption',     // Module
      'manager'       // Role
    );
    
    console.log('✅ Processed', savedImages.length, 'images for adoption/manager');
    
    // Verify images were saved correctly
    for (const image of savedImages) {
      console.log('📋 Image:', {
        id: image._id,
        url: image.url,
        module: image.module,
        role: image.role,
        entityType: image.entityType
      });
      
      // Check if file exists
      const fullPath = path.join(__dirname, '../', image.url);
      try {
        await fs.access(fullPath);
        console.log('✅ Image file exists:', image.url);
      } catch (err) {
        console.log('❌ Image file missing:', image.url);
      }
    }
    
    // Cleanup
    console.log('🧹 Cleaning up test data...');
    for (const image of savedImages) {
      await Image.findByIdAndDelete(image._id);
      const fullPath = path.join(__dirname, '../', image.url);
      try {
        await fs.unlink(fullPath);
        console.log('🗑️  Deleted image file:', image.url);
      } catch (err) {
        console.log('⚠️  Could not delete image file:', image.url);
      }
    }
    
    console.log('🎉 Adoption module image upload test completed successfully!');
    
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