/**
 * Debug script to identify the cause of inventory API errors
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import all required models to register schemas
require('../core/models/Species');
require('../core/models/Breed');
require('../core/models/Image');
require('../core/models/User');
require('../core/models/Pet');
require('../core/models/PetNew');

// Import models we need to work with
const PetInventoryItem = require('../modules/petshop/manager/models/PetInventoryItem');
const PetShop = require('../modules/petshop/manager/models/PetShop');

// Connect to database with proper error handling
const connectDB = async () => {
  try {
    // Load environment variables
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pet_management_system';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const debugInventoryError = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Debugging inventory API error...');
    
    // Simulate the filter that would be used by a manager
    const filter = { 
      storeId: '68fd0b4e55af6d11a8cdadae', // Example store ID
      isActive: true 
    };
    
    console.log('Filter used:', filter);
    
    // Try to find inventory items with this filter
    console.log('\n--- Testing inventory query ---');
    const items = await PetInventoryItem.find(filter)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('imageIds')
      .limit(1);
    
    console.log(`Found ${items.length} items`);
    
    if (items.length > 0) {
      const item = items[0];
      console.log('Sample item:', {
        _id: item._id,
        name: item.name,
        petCode: item.petCode,
        speciesId: item.speciesId,
        breedId: item.breedId,
        price: item.price,
        storeId: item.storeId,
        createdBy: item.createdBy,
        status: item.status
      });
      
      // Check for missing required fields
      console.log('\n--- Validation check ---');
      if (!item.speciesId) {
        console.log('❌ Missing speciesId');
      }
      if (!item.breedId) {
        console.log('❌ Missing breedId');
      }
      if (item.price === undefined || item.price === null) {
        console.log('❌ Missing price');
      }
      if (item.price < 0) {
        console.log('❌ Negative price');
      }
      if (!item.storeId) {
        console.log('❌ Missing storeId');
      }
      if (!item.createdBy) {
        console.log('❌ Missing createdBy');
      }
    }
    
    // Try a simple count query
    console.log('\n--- Testing count query ---');
    const total = await PetInventoryItem.countDocuments(filter);
    console.log(`Total items: ${total}`);
    
    console.log('\n🎉 Debug completed successfully!');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the debug
if (require.main === module) {
  debugInventoryError();
}

module.exports = { debugInventoryError };