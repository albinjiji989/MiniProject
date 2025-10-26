/**
 * Debug script to check the user reference
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

const checkUserReference = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking user reference...');
    
    const userId = '68fd0b4e55af6d11a8cdadae';
    
    // Find the user
    const user = await User.findById(userId);
    if (user) {
      console.log(`User: ${user._id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  StoreId: ${user.storeId}`);
      console.log(`  StoreName: ${user.storeName}`);
    }
    
    // Check inventory items referencing this user
    const inventoryItems = await PetInventoryItem.find({ storeId: userId });
    console.log(`\nFound ${inventoryItems.length} inventory items referencing this user:`);
    for (const item of inventoryItems) {
      console.log(`  ${item._id}: ${item.name} (${item.petCode})`);
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
  checkUserReference();
}

module.exports = { checkUserReference };