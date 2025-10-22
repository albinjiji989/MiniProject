/**
 * Test script for the core image upload system
 * This script tests the image upload functionality for core module (admin, manager, user)
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

// Mock user objects for different roles
const mockAdmin = {
  id: '64f8a0b4c9e7a123456789ab',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin'
};

const mockManager = {
  id: '64f8a0b4c9e7a123456789ac',
  name: 'Manager User',
  email: 'manager@example.com',
  role: 'manager'
};

const mockUser = {
  id: '64f8a0b4c9e7a123456789ad',
  name: 'Regular User',
  email: 'user@example.com',
  role: 'user'
};

// Test image data (small base64 encoded image)
const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function runTest() {
  try {
    console.log('🔍 Testing core image upload system...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Test for each role
    const roles = [
      { user: mockAdmin, role: 'admin' },
      { user: mockManager, role: 'manager' },
      { user: mockUser, role: 'user' }
    ];
    
    for (const { user, role } of roles) {
      console.log(`\n--- Testing ${role} role ---`);
      
      // Test image processing
      const testImages = [
        { url: testImageData, isPrimary: true, caption: `Primary image for ${role}` },
        { url: testImageData, isPrimary: false, caption: `Secondary image for ${role}` }
      ];
      
      console.log(`🖼️  Processing test images for ${role}...`);
      const savedImages = await processEntityImages(
        testImages,
        'PetNew', // Entity type (using a valid enum value)
        user.id, // Entity ID
        user.id, // User ID
        'core',  // Module
        role     // Role
      );
      
      console.log(`✅ Processed ${savedImages.length} images for ${role}`);
      
      // Verify images were saved correctly
      for (const image of savedImages) {
        console.log(`📋 Image for ${role}:`, {
          id: image._id,
          url: image.url,
          module: image.module,
          role: image.role
        });
        
        // Check if file exists
        const fullPath = path.join(__dirname, '../', image.url);
        try {
          await fs.access(fullPath);
          console.log(`✅ Image file exists for ${role}:`, image.url);
        } catch (err) {
          console.log(`❌ Image file missing for ${role}:`, image.url);
        }
      }
      
      // Cleanup
      console.log(`🧹 Cleaning up test data for ${role}...`);
      for (const image of savedImages) {
        await Image.findByIdAndDelete(image._id);
        const fullPath = path.join(__dirname, '../', image.url);
        try {
          await fs.unlink(fullPath);
          console.log(`🗑️  Deleted image file for ${role}:`, image.url);
        } catch (err) {
          console.log(`⚠️  Could not delete image file for ${role}:`, image.url);
        }
      }
    }
    
    console.log('\n🎉 Core image upload test completed successfully!');
    
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