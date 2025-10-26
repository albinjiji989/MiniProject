/**
 * Check all inventory items and their storeId status
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

const checkAllInventoryItems = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking all inventory items...');
    
    // Find all inventory items
    const items = await PetInventoryItem.find({});
    console.log(`Found ${items.length} total inventory items`);
    
    let withStoreId = 0;
    let withoutStoreId = 0;
    
    for (const item of items) {
      console.log(`\n--- Item ${item._id} ---`);
      console.log(`  Name: "${item.name}"`);
      console.log(`  PetCode: ${item.petCode}`);
      console.log(`  StoreId exists: ${item.storeId !== undefined}`);
      console.log(`  StoreId value: ${item.storeId}`);
      console.log(`  StoreId is null: ${item.storeId === null}`);
      
      if (item.storeId !== undefined && item.storeId !== null) {
        withStoreId++;
      } else {
        withoutStoreId++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total items: ${items.length}`);
    console.log(`  Items with storeId: ${withStoreId}`);
    console.log(`  Items without storeId: ${withoutStoreId}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  checkAllInventoryItems();
}

module.exports = { checkAllInventoryItems };