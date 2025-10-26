/**
 * Debug script to check store references and fix the user's storeId
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
const User = require('../core/models/User');
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

const debugStoreReference = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Debugging store references...');
    
    // Find all pet shops
    const petShops = await PetShop.find({});
    console.log(`Found ${petShops.length} pet shops:`);
    for (const shop of petShops) {
      console.log(`  ${shop._id}: ${shop.name}`);
    }
    
    // Find the petshop manager user
    const user = await User.findOne({ role: 'petshop_manager' });
    if (!user) {
      console.log('❌ No petshop manager user found');
      return;
    }
    
    console.log(`\nUser storeId:`, user.storeId);
    console.log(`User storeId type:`, typeof user.storeId);
    
    // Check if user.storeId matches any pet shop _id
    const matchingShop = petShops.find(shop => shop._id.toString() === user.storeId);
    if (matchingShop) {
      console.log(`✅ User storeId matches pet shop: ${matchingShop.name}`);
    } else {
      console.log(`❌ User storeId does not match any pet shop _id`);
      
      // Check if user.storeId matches any pet shop storeId field (if it exists)
      const matchingByStoreId = petShops.find(shop => shop.storeId === user.storeId);
      if (matchingByStoreId) {
        console.log(`✅ User storeId matches pet shop storeId field: ${matchingByStoreId.name}`);
        console.log(`   Should update user.storeId to: ${matchingByStoreId._id}`);
      } else {
        console.log(`❌ User storeId does not match any pet shop storeId field either`);
      }
    }
    
    // Check inventory items
    const inventoryItems = await PetInventoryItem.find({}).limit(5);
    console.log(`\nSample inventory items:`);
    for (const item of inventoryItems) {
      console.log(`  ${item._id}: storeId=${item.storeId}, storeName=${item.storeName}`);
      console.log(`    storeId type:`, typeof item.storeId);
    }
    
    // Check if inventory items have valid ObjectId references
    console.log(`\nChecking inventory item storeId references:`);
    for (const item of inventoryItems) {
      if (item.storeId) {
        const matchingShop = petShops.find(shop => shop._id.toString() === item.storeId.toString());
        if (matchingShop) {
          console.log(`  ✅ ${item.petCode}: storeId references valid pet shop`);
        } else {
          console.log(`  ❌ ${item.petCode}: storeId does not reference any pet shop`);
          console.log(`     storeId value:`, item.storeId);
          console.log(`     storeId type:`, typeof item.storeId);
        }
      }
    }
    
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
  debugStoreReference();
}

module.exports = { debugStoreReference };