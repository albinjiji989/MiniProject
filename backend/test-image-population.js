require('dotenv').config();
const mongoose = require('mongoose');
const PetInventoryItem = require('./modules/petshop/manager/models/PetInventoryItem');
const Image = require('./core/models/Image');

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

// Test image population
async function testImagePopulation() {
  try {
    await connectDB();
    console.log('Testing image population...');
    
    // Find a pet inventory item with images
    const item = await PetInventoryItem.findOne({ imageIds: { $exists: true, $ne: [] } })
      .populate('imageIds')
      .exec();
    
    if (!item) {
      console.log('No items with images found');
      return;
    }
    
    console.log('Found item with images:');
    console.log('- Item ID:', item._id);
    console.log('- Item name:', item.name);
    console.log('- Image IDs:', item.imageIds.map(img => img._id));
    console.log('- Image URLs:', item.imageIds.map(img => img.url));
    
    // Test virtual population
    await item.populate('images');
    console.log('- Virtual images count:', item.images ? item.images.length : 0);
    if (item.images && item.images.length > 0) {
      console.log('- Virtual image URLs:', item.images.map(img => img.url));
    }
    
    // Test JSON output (this is what gets sent to frontend)
    const jsonOutput = item.toJSON();
    console.log('- JSON output has images:', !!jsonOutput.images);
    if (jsonOutput.images) {
      console.log('- JSON images count:', jsonOutput.images.length);
      console.log('- JSON image URLs:', jsonOutput.images.map(img => img.url));
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testImagePopulation();