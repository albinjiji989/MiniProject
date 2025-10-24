const mongoose = require('mongoose');
const PetInventoryItem = require('./modules/petshop/manager/models/PetInventoryItem');
const { processEntityImages } = require('./core/utils/imageUploadHandler');
const path = require('path');

// MongoDB connection
const connectDB = async () => {
  try {
    // Load environment variables
    require('dotenv').config({ path: path.join(__dirname, '.env') });
    
    const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/petproject';
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Test pet code generation and image handling
const testPetInventory = async () => {
  await connectDB();
  
  try {
    // Test 1: Create a pet inventory item and check petCode generation
    console.log('=== Test 1: Pet Code Generation ===');
    const petItem = new PetInventoryItem({
      storeId: 'TEST001',
      storeName: 'Test Pet Shop',
      createdBy: new mongoose.Types.ObjectId(),
      categoryId: new mongoose.Types.ObjectId(),
      speciesId: new mongoose.Types.ObjectId(),
      breedId: new mongoose.Types.ObjectId(),
      gender: 'Male',
      age: 2,
      ageUnit: 'months',
      color: 'Brown',
      unitCost: 1000,
      price: 2500
    });
    
    await petItem.save();
    console.log('Pet created with petCode:', petItem.petCode);
    console.log('PetCode format valid:', /^[A-Z]{3}\d{5}$/.test(petItem.petCode));
    
    // Test 2: Test image processing
    console.log('\n=== Test 2: Image Processing ===');
    const testImages = [
      { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', isPrimary: true },
      { url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', isPrimary: false }
    ];
    
    const savedImages = await processEntityImages(
      testImages,
      'PetInventoryItem',
      petItem._id.toString(),
      petItem.createdBy.toString(),
      'petshop/manager/pets',
      'manager'
    );
    
    console.log('Images processed:', savedImages.length);
    console.log('Image paths:');
    savedImages.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img.url}`);
    });
    
    // Verify image files exist
    console.log('\n=== Test 3: File System Verification ===');
    const fs = require('fs').promises;
    for (const img of savedImages) {
      const fullPath = path.join(__dirname, img.url.substring(1)); // Remove leading slash
      try {
        await fs.access(fullPath);
        console.log(`✓ Image file exists: ${img.url}`);
      } catch (err) {
        console.log(`✗ Image file missing: ${img.url}`);
      }
    }
    
    // Clean up test data
    await PetInventoryItem.deleteOne({ _id: petItem._id });
    console.log('\n=== Cleanup ===');
    console.log('Test pet item deleted');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

testPetInventory();