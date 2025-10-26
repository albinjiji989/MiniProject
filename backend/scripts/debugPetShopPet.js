/**
 * Debug script to check what pet the ID 68fd1c83e33ab9f6177fe409 corresponds to
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

const debugPet = async () => {
  try {
    await connectDB();
    
    const petId = '68fd1c83e33ab9f6177fe409';
    console.log(`🔍 Debugging pet with ID: ${petId}`);
    
    // Check if this is a PetInventoryItem
    const inventoryItem = await PetInventoryItem.findById(petId);
    if (inventoryItem) {
      console.log(`✅ Found as PetInventoryItem:`);
      console.log(`  Name: ${inventoryItem.name}`);
      console.log(`  PetCode: ${inventoryItem.petCode}`);
      console.log(`  Status: ${inventoryItem.status}`);
      return;
    }
    
    // Check if this is a Pet (purchased pet record)
    const Pet = require('../core/models/Pet');
    const purchasedPet = await Pet.findById(petId);
    if (purchasedPet) {
      console.log(`✅ Found as Purchased Pet:`);
      console.log(`  Name: ${purchasedPet.name}`);
      console.log(`  PetCode: ${purchasedPet.petCode}`);
      console.log(`  Owner: ${purchasedPet.owner}`);
      return;
    }
    
    // Check if this is a PetNew (user pet)
    const PetNew = require('../core/models/PetNew');
    const userPet = await PetNew.findById(petId);
    if (userPet) {
      console.log(`✅ Found as User Pet (PetNew):`);
      console.log(`  Name: ${userPet.name}`);
      console.log(`  PetCode: ${userPet.petCode}`);
      console.log(`  Owner: ${userPet.ownerId}`);
      return;
    }
    
    // Check if this is a PetRegistry entry
    const registryEntry = await PetRegistry.findById(petId);
    if (registryEntry) {
      console.log(`✅ Found as PetRegistry entry:`);
      console.log(`  Name: ${registryEntry.name}`);
      console.log(`  PetCode: ${registryEntry.petCode}`);
      console.log(`  Owner: ${registryEntry.currentOwnerId}`);
      return;
    }
    
    // Check if this is a PetReservation
    const reservation = await PetReservation.findById(petId);
    if (reservation) {
      console.log(`✅ Found as PetReservation:`);
      console.log(`  Reservation Code: ${reservation.reservationCode}`);
      console.log(`  Item ID: ${reservation.itemId}`);
      console.log(`  User ID: ${reservation.userId}`);
      console.log(`  Status: ${reservation.status}`);
      
      // Get the inventory item
      const item = await PetInventoryItem.findById(reservation.itemId);
      if (item) {
        console.log(`  Inventory Item PetCode: ${item.petCode}`);
        console.log(`  Inventory Item Name: ${item.name}`);
      }
      return;
    }
    
    console.log(`❌ Pet with ID ${petId} not found in any collection`);
    
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
  debugPet();
}

module.exports = { debugPet };