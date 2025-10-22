/**
 * Test script for the standardized image upload system across all modules
 * This script tests the image upload functionality for all modules (adoption, petshop, veterinary, etc.)
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

// Test modules and entity types (using only valid entity types)
const testModules = [
  { module: 'core', entityType: 'PetNew' }, // Using PetNew as it's a valid entity type
  { module: 'adoption', entityType: 'AdoptionPet' },
  { module: 'petshop', entityType: 'PetInventoryItem' },
  { module: 'veterinary', entityType: 'Pet' }, // Using Pet as it's a valid entity type
  { module: 'temporary-care', entityType: 'PetNew' }, // Using PetNew as it's a valid entity type
  { module: 'otherpets', entityType: 'PetNew' }
];

async function runTest() {
  try {
    console.log('🔍 Testing standardized image upload system across all modules...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Test each module
    for (const { module, entityType } of testModules) {
      console.log(`\n--- Testing ${module} module ---`);
      
      // Test for each role
      const roles = ['admin', 'manager', 'user'];
      
      for (const role of roles) {
        console.log(`\n  Testing ${role} role...`);
        
        // Test image processing
        const testImages = [
          { url: testImageData, isPrimary: true, caption: `Primary image for ${module}/${role}` },
          { url: testImageData, isPrimary: false, caption: `Secondary image for ${module}/${role}` }
        ];
        
        try {
          console.log(`  🖼️  Processing test images for ${module}/${role}...`);
          const savedImages = await processEntityImages(
            testImages,
            entityType,
            mockUser.id, // Entity ID
            mockUser.id, // User ID
            module,
            role
          );
          
          console.log(`  ✅ Processed ${savedImages.length} images for ${module}/${role}`);
          
          // Verify images were saved correctly
          for (const image of savedImages) {
            console.log(`  📋 Image for ${module}/${role}:`, {
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
              console.log(`  ✅ Image file exists for ${module}/${role}:`, image.url);
            } catch (err) {
              console.log(`  ❌ Image file missing for ${module}/${role}:`, image.url);
            }
          }
          
          // Cleanup
          console.log(`  🧹 Cleaning up test data for ${module}/${role}...`);
          for (const image of savedImages) {
            await Image.findByIdAndDelete(image._id);
            const fullPath = path.join(__dirname, '../', image.url);
            try {
              await fs.unlink(fullPath);
              console.log(`  🗑️  Deleted image file for ${module}/${role}:`, image.url);
            } catch (err) {
              console.log(`  ⚠️  Could not delete image file for ${module}/${role}:`, image.url);
            }
          }
        } catch (error) {
          console.error(`  ❌ Failed to process images for ${module}/${role}:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 All modules image upload test completed successfully!');
    
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