require('dotenv').config();
const mongoose = require('mongoose');
const { processEntityImages } = require('./core/utils/imageUploadHandler');

// Connect to database
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

// Test image upload
async function testImageUpload() {
  try {
    await connectDB();
    console.log('Testing image upload...');
    
    // Create a test image with base64 data (small red square)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const savedImages = await processEntityImages(
      [{ url: testImage }],
      'PetInventoryItem',
      'test123',
      'user123',
      'petshop/manager/pets',
      'manager'
    );
    
    console.log('Saved images:', savedImages.map(img => ({
      id: img._id,
      url: img.url,
      module: img.module,
      role: img.role
    })));
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testImageUpload();