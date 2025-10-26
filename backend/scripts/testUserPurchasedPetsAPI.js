/**
 * Test script to verify the user purchased pets API endpoint works correctly
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
const PetRegistry = require('../core/models/PetRegistry');
const PetReservation = require('../modules/petshop/user/models/PetReservation');

// Mock request and response objects
const mockReq = {
  user: {
    _id: '68fcffdb1775377dcf9195b0' // The user ID from our problem pet
  }
};

const mockRes = {
  json: function(data) {
    console.log('API Response:', JSON.stringify(data, null, 2));
    return this;
  },
  status: function(code) {
    this.statusCode = code;
    return this;
  }
};

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

const testUserPurchasedPetsAPI = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Testing getUserPurchasedPets API endpoint...');
    
    // Import the controller function
    const { getUserPurchasedPets } = require('../modules/petshop/user/controllers/userController');
    
    // Call the function with mock request/response
    await getUserPurchasedPets(mockReq, mockRes);
    
    console.log('\n🎉 API test completed successfully!');
    
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
  testUserPurchasedPetsAPI();
}

module.exports = { testUserPurchasedPetsAPI };