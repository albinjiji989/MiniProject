/**
 * Migration script to fix existing reservations that don't have petId set
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

const fixExistingReservations = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Fixing existing reservations without petId...');
    
    // Find all reservations with status 'completed' or 'at_owner' that don't have petId set
    const reservations = await PetReservation.find({
      status: { $in: ['completed', 'at_owner'] },
      $or: [
        { petId: { $exists: false } },
        { petId: null }
      ]
    }).populate('itemId');
    
    console.log(`Found ${reservations.length} reservations to fix`);
    
    let fixedCount = 0;
    
    for (const reservation of reservations) {
      console.log(`\n--- Processing reservation ${reservation._id} ---`);
      
      // Get the petCode from the inventory item
      if (!reservation.itemId || !reservation.itemId.petCode) {
        console.log(`❌ No petCode found for reservation ${reservation._id}`);
        continue;
      }
      
      const petCode = reservation.itemId.petCode;
      console.log(`PetCode: ${petCode}`);
      
      // Find the Pet record by petCode
      const Pet = require('../core/models/Pet');
      const petRecord = await Pet.findOne({ petCode });
      
      if (!petRecord) {
        console.log(`❌ No Pet record found for petCode ${petCode}`);
        continue;
      }
      
      console.log(`✅ Found Pet record: ${petRecord._id}`);
      
      // Update the reservation with the petId
      reservation.petId = petRecord._id;
      await reservation.save();
      
      console.log(`✅ Updated reservation ${reservation._id} with petId ${petRecord._id}`);
      fixedCount++;
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} reservations successfully!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the fix
if (require.main === module) {
  fixExistingReservations();
}

module.exports = { fixExistingReservations };