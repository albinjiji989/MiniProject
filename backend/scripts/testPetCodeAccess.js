/**
 * Test script to check if petCode access works
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
const PetRegistry = require('../core/models/PetRegistry');

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

const testPetCodeAccess = async () => {
  try {
    await connectDB();
    
    console.log(`🔍 Testing petCode access for OHB56406`);
    
    // Test 1: Try to find in PetRegistry by petCode
    const registryEntry = await PetRegistry.findOne({ petCode: 'OHB56406' });
    if (registryEntry) {
      console.log(`✅ Pet found in PetRegistry:`);
      console.log(`   ID: ${registryEntry._id}`);
      console.log(`   Name: ${registryEntry.name || 'Unnamed'}`);
      console.log(`   PetCode: ${registryEntry.petCode}`);
      console.log(`   Current Owner: ${registryEntry.currentOwnerId}`);
      console.log(`   Current Status: ${registryEntry.currentStatus}`);
      console.log(`   Source: ${registryEntry.source}`);
      console.log(`   Core Pet ID: ${registryEntry.corePetId}`);
    } else {
      console.log(`❌ Pet not found in PetRegistry`);
    }
    
    // Test 2: Try to find in Pet model by petCode
    const Pet = require('../core/models/Pet');
    const petRecord = await Pet.findOne({ petCode: 'OHB56406' });
    if (petRecord) {
      console.log(`✅ Pet found in Pet model:`);
      console.log(`   ID: ${petRecord._id}`);
      console.log(`   Name: ${petRecord.name}`);
      console.log(`   PetCode: ${petRecord.petCode}`);
      console.log(`   Owner: ${petRecord.owner}`);
    } else {
      console.log(`❌ Pet not found in Pet model`);
    }
    
    console.log(`\n🎉 Test complete!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the test
if (require.main === module) {
  testPetCodeAccess();
}

module.exports = { testPetCodeAccess };