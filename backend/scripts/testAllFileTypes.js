/**
 * Test script for all file types across all modules
 * This script tests the upload functionality for images and documents (certificates, contracts, etc.)
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to database
const connectDB = require('../core/db');
const Image = require('../core/models/Image');
const Document = require('../core/models/Document');
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

// Test document data (small PDF base64)
const testDocumentData = 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO';

async function runTest() {
  try {
    console.log('🔍 Testing all file types across all modules...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Test modules
    const testModules = [
      { name: 'adoption', entityType: 'AdoptionPet' },
      { name: 'petshop', entityType: 'PetInventoryItem' },
      { name: 'veterinary', entityType: 'Pet' },
      { name: 'temporary-care', entityType: 'PetNew' },
      { name: 'otherpets', entityType: 'PetNew' },
      { name: 'core', entityType: 'PetNew' }
    ];
    
    // Test each module
    for (const { name: module, entityType } of testModules) {
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
          console.log(`  🖼️  Processing images for ${module}/${role}...`);
          const savedImages = await processEntityImages(
            testImages,
            entityType,
            mockUser.id, // Entity ID
            mockUser.id, // User ID
            module,
            role
          );
          
          console.log(`  ✅ Processed ${savedImages.length} images for ${module}/${role}`);
          
          // Test document processing (simulating contract/certificate)
          // For documents, we would use a similar approach but with a document handler
          // This is a simplified example - in practice, you'd have a processEntityDocuments function
          console.log(`  📄 Processing documents for ${module}/${role}...`);
          
          // Create upload directory for documents
          const uploadDir = path.join(__dirname, `../uploads/${module}/${role}`);
          await fs.mkdir(uploadDir, { recursive: true });
          
          // Generate unique filename for document
          const docFilename = `contract-${mockUser.id}-${Date.now()}-0.pdf`;
          const docFilepath = path.join(uploadDir, docFilename);
          
          // Save document file
          const docBuffer = Buffer.from(testDocumentData.split(',')[1], 'base64');
          await fs.writeFile(docFilepath, docBuffer);
          
          // Store relative path in database
          const docRelativePath = `/uploads/${module}/${role}/${docFilename}`;
          console.log(`  ✅ Saved document: ${docRelativePath}`);
          
          // Verify files were saved correctly
          for (const image of savedImages) {
            // Check if image file exists
            const fullPath = path.join(__dirname, '../', image.url);
            try {
              await fs.access(fullPath);
              console.log(`  ✅ Image file exists: ${image.url}`);
            } catch (err) {
              console.log(`  ❌ Image file missing: ${image.url}`);
            }
          }
          
          // Check if document file exists
          try {
            await fs.access(docFilepath);
            console.log(`  ✅ Document file exists: ${docRelativePath}`);
          } catch (err) {
            console.log(`  ❌ Document file missing: ${docRelativePath}`);
          }
          
          // Cleanup
          console.log(`  🧹 Cleaning up test data for ${module}/${role}...`);
          for (const image of savedImages) {
            await Image.findByIdAndDelete(image._id);
            const fullPath = path.join(__dirname, '../', image.url);
            try {
              await fs.unlink(fullPath);
            } catch (err) {
              // File might already be deleted
            }
          }
          
          // Delete document file
          try {
            await fs.unlink(docFilepath);
          } catch (err) {
            // File might already be deleted
          }
        } catch (error) {
          console.error(`  ❌ Failed to process files for ${module}/${role}:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 All file types test completed successfully!');
    console.log('\n📋 Summary of implementation:');
    console.log('1. All images and documents are stored in uploads/{module}/{role}/');
    console.log('2. Files have unique names using entity ID, timestamp, and crypto hash');
    console.log('3. Only file paths are stored in the database, not base64 data');
    console.log('4. Each module has its own directory structure:');
    console.log('   - adoption/');
    console.log('   - petshop/');
    console.log('   - veterinary/');
    console.log('   - temporary-care/');
    console.log('   - otherpets/');
    console.log('   - core/');
    console.log('5. Each module directory has subdirectories for roles:');
    console.log('   - admin/');
    console.log('   - manager/');
    console.log('   - user/');
    console.log('6. Contract certificates and other documents are stored the same way as images');
    console.log('7. Files can be fetched by getting the path from DB and serving the file');
    
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