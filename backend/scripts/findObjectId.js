/**
 * Debug script to find what document an ObjectId refers to
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

const findObjectId = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Finding what ObjectId 68fd0b4e55af6d11a8cdadae refers to...');
    
    const targetId = '68fd0b4e55af6d11a8cdadae';
    
    // Check if it's a User
    const user = await User.findById(targetId);
    if (user) {
      console.log(`✅ Found User: ${user._id} - ${user.name || user.email}`);
      return;
    }
    
    // Check if it's a PetShop
    const petShop = await PetShop.findById(targetId);
    if (petShop) {
      console.log(`✅ Found PetShop: ${petShop._id} - ${petShop.name}`);
      return;
    }
    
    // Check if it's a PetInventoryItem
    const inventoryItem = await PetInventoryItem.findById(targetId);
    if (inventoryItem) {
      console.log(`✅ Found PetInventoryItem: ${inventoryItem._id} - ${inventoryItem.name} (${inventoryItem.petCode})`);
      return;
    }
    
    console.log('❌ ObjectId does not correspond to any known document type');
    
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
  findObjectId();
}

module.exports = { findObjectId };