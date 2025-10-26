/**
 * Fix inventory items that are missing storeId field
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

const fixMissingStoreId = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Fixing inventory items with missing storeId...');
    
    // Find all inventory items first
    const allItems = await PetInventoryItem.find({});
    console.log(`Found ${allItems.length} total inventory items`);
    
    // Find items with valid storeId
    const itemsWithStore = allItems.filter(item => 
      item.storeId !== undefined && item.storeId !== null
    );
    
    if (itemsWithStore.length === 0) {
      console.log('❌ No inventory items with valid storeId found. Skipping fix.');
      return;
    }
    
    const validStoreId = itemsWithStore[0].storeId;
    const validStoreName = itemsWithStore[0].storeName || 'Default Store';
    console.log(`Using storeId: ${validStoreId}`);
    console.log(`Using storeName: ${validStoreName}`);
    
    // Find items without storeId
    const items = allItems.filter(item => 
      item.storeId === undefined || item.storeId === null
    );
    
    console.log(`Found ${items.length} items missing storeId`);
    
    let fixedCount = 0;
    
    for (const item of items) {
      console.log(`\n--- Fixing item ${item._id} ---`);
      console.log(`  Name: "${item.name}"`);
      console.log(`  PetCode: ${item.petCode}`);
      
      try {
        // Update the item with the storeId
        item.storeId = validStoreId;
        item.storeName = validStoreName;
        
        // If name is empty, set a default name
        if (!item.name || item.name.trim() === '') {
          item.name = 'Unnamed Pet';
        }
        
        // Save the item (this will trigger validation)
        await item.save();
        console.log(`  ✅ Fixed item ${item._id}`);
        fixedCount++;
      } catch (error) {
        console.log(`  ❌ Failed to fix item ${item._id}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Fix summary:`);
    console.log(`  Items processed: ${items.length}`);
    console.log(`  Items fixed: ${fixedCount}`);
    console.log(`  Items failed: ${items.length - fixedCount}`);
    
    if (fixedCount > 0) {
      console.log(`\n🎉 Successfully fixed ${fixedCount} inventory items!`);
    }
    
  } catch (error) {
    console.error('❌ Fix error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the fix
if (require.main === module) {
  fixMissingStoreId();
}

module.exports = { fixMissingStoreId };