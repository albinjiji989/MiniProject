/**
 * Verify that the fix worked correctly
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

const verifyFix = async () => {
  try {
    await connectDB();
    
    console.log(`🔍 Verifying fix for problem pet with petCode: OHB56406`);
    
    // Get the reservation directly from database to see all fields
    const reservation = await PetReservation.collection.findOne({ _id: new mongoose.Types.ObjectId('68fd2763e33ab9f6177fe7a6') });
    
    if (reservation) {
      console.log(`✅ Reservation found in database:`);
      console.log(`   Status: ${reservation.status}`);
      console.log(`   Item ID: ${reservation.itemId}`);
      console.log(`   Pet ID: ${reservation.petId}`);
      console.log(`   User ID: ${reservation.userId}`);
    } else {
      console.log(`❌ Reservation not found in database`);
    }
    
    // Test if we can access the pet using its petCode
    console.log(`\n🔍 Testing access to pet using petCode OHB56406...`);
    
    // Check if the pet can be found in PetRegistry
    const registryEntry = await PetRegistry.findOne({ petCode: 'OHB56406' });
    if (registryEntry) {
      console.log(`✅ Pet found in PetRegistry using petCode`);
      console.log(`   Name: ${registryEntry.name || 'Unnamed'}`);
      console.log(`   Current Owner: ${registryEntry.currentOwnerId}`);
      console.log(`   Current Status: ${registryEntry.currentStatus}`);
    } else {
      console.log(`❌ Pet not found in PetRegistry using petCode`);
    }
    
    console.log(`\n🎉 Verification complete!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the verification
if (require.main === module) {
  verifyFix();
}

module.exports = { verifyFix };