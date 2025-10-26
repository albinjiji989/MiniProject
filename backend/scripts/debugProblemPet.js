/**
 * Debug script to check the specific problem pet
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

const debugProblemPet = async () => {
  try {
    await connectDB();
    
    const problemPetId = '68fd1c83e33ab9f6177fe409';
    console.log(`🔍 Debugging problem pet ID: ${problemPetId}`);
    
    // Check the reservation
    const reservation = await PetReservation.findById('68fd2763e33ab9f6177fe7a6')
      .populate('itemId');
    
    if (reservation) {
      console.log(`✅ Reservation found:`);
      console.log(`   Status: ${reservation.status}`);
      console.log(`   Item ID: ${reservation.itemId}`);
      console.log(`   Pet ID: ${reservation.petId}`);
      console.log(`   User ID: ${reservation.userId}`);
      
      if (reservation.itemId) {
        await reservation.itemId.populate('images');
        console.log(`   Item Name: ${reservation.itemId.name}`);
        console.log(`   Item PetCode: ${reservation.itemId.petCode}`);
        console.log(`   Item Images: ${reservation.itemId.images?.length || 0}`);
      }
    } else {
      console.log(`❌ Reservation not found`);
    }
    
    // Check if the pet exists in PetRegistry
    const registryEntry = await PetRegistry.findOne({ petCode: 'OHB56406' });
    if (registryEntry) {
      console.log(`✅ Pet found in PetRegistry:`);
      console.log(`   ID: ${registryEntry._id}`);
      console.log(`   Name: ${registryEntry.name}`);
      console.log(`   PetCode: ${registryEntry.petCode}`);
      console.log(`   Current Owner: ${registryEntry.currentOwnerId}`);
      console.log(`   Current Status: ${registryEntry.currentStatus}`);
      console.log(`   Current Location: ${registryEntry.currentLocation}`);
      console.log(`   Source: ${registryEntry.source}`);
      console.log(`   PetShop Item ID: ${registryEntry.petShopItemId}`);
      console.log(`   Core Pet ID: ${registryEntry.corePetId}`);
    } else {
      console.log(`❌ Pet not found in PetRegistry`);
    }
    
    // Check if there's a Pet record
    const Pet = require('../core/models/Pet');
    const petRecord = await Pet.findOne({ petCode: 'OHB56406' });
    if (petRecord) {
      console.log(`✅ Pet record found:`);
      console.log(`   ID: ${petRecord._id}`);
      console.log(`   Name: ${petRecord.name}`);
      console.log(`   PetCode: ${petRecord.petCode}`);
      console.log(`   Owner: ${petRecord.owner}`);
    } else {
      console.log(`❌ Pet record not found`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the debug
if (require.main === module) {
  debugProblemPet();
}

module.exports = { debugProblemPet };