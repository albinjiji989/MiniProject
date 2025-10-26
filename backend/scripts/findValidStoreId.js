/**
 * Find a valid storeId from existing inventory items
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

const findValidStoreId = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Finding valid storeId from existing inventory items...');
    
    // Find inventory items that have a valid storeId
    const itemsWithStore = await PetInventoryItem.find({ 
      storeId: { $exists: true, $ne: null }
    }).limit(1);
    
    if (itemsWithStore.length > 0) {
      const item = itemsWithStore[0];
      console.log(`✅ Found valid storeId: ${item.storeId}`);
      console.log(`   Store name: ${item.storeName}`);
      console.log(`   From item: ${item._id} - ${item.name}`);
    } else {
      console.log('❌ No inventory items with valid storeId found');
    }
    
    // Check items without storeId
    const itemsWithoutStore = await PetInventoryItem.find({ 
      $or: [
        { storeId: { $exists: false } },
        { storeId: null }
      ]
    });
    
    console.log(`\nFound ${itemsWithoutStore.length} items without storeId:`);
    itemsWithoutStore.forEach(item => {
      console.log(`  - ${item._id}: ${item.name || 'Unnamed'} (${item.petCode})`);
    });
    
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
  findValidStoreId();
}

module.exports = { findValidStoreId };