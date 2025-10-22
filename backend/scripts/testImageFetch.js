/**
 * Test script for fetching images
 * This script demonstrates how to fetch images by getting the path from DB and then serving the file
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to database
const connectDB = require('../core/db');
const Image = require('../core/models/Image');

async function runTest() {
  try {
    console.log('🔍 Testing image fetch system...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Create a test image record (without actually saving a file)
    const testImage = new Image({
      url: '/uploads/otherpets/user/test-image.png',
      caption: 'Test image',
      entityType: 'PetNew',
      entityId: '64f8a0b4c9e7a123456789ab',
      isPrimary: true,
      module: 'otherpets',
      role: 'user',
      uploadedBy: '64f8a0b4c9e7a123456789ab'
    });
    
    await testImage.save();
    console.log('✅ Test image record created with ID:', testImage._id);
    
    // Simulate fetching the image path from database
    const fetchedImage = await Image.findById(testImage._id);
    console.log('📋 Fetched image from DB:', {
      id: fetchedImage._id,
      url: fetchedImage.url,
      caption: fetchedImage.caption,
      module: fetchedImage.module,
      role: fetchedImage.role
    });
    
    // Demonstrate how to construct the full file path
    const fullPath = path.join(__dirname, '../', fetchedImage.url);
    console.log('📁 Full file path:', fullPath);
    
    // In a real application, this path would be used to serve the file
    // For example, in an Express route:
    // app.get('/images/:imageId', async (req, res) => {
    //   const image = await Image.findById(req.params.imageId);
    //   res.sendFile(path.join(__dirname, '../', image.url));
    // });
    
    console.log('✅ Image fetch test completed successfully!');
    console.log('\n🔧 Implementation example:');
    console.log('To serve images in your Express app, you would use:');
    console.log('app.get(\'/api/images/:imageId\', async (req, res) => {');
    console.log('  const image = await Image.findById(req.params.imageId);');
    console.log('  if (!image) return res.status(404).json({error: \'Image not found\'});');
    console.log('  res.sendFile(path.join(__dirname, \'../\', image.url));');
    console.log('});');
    
    // Cleanup
    await Image.findByIdAndDelete(testImage._id);
    console.log('🧹 Test data cleaned up');
    
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