/**
 * Fix script to correct the problem pet
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

const fixProblemPet = async () => {
  try {
    await connectDB();
    
    console.log(`🔍 Fixing problem pet with petCode: OHB56406`);
    
    // Get the reservation
    const reservation = await PetReservation.findById('68fd2763e33ab9f6177fe7a6')
      .populate('itemId');
    
    if (!reservation) {
      console.log(`❌ Reservation not found`);
      return;
    }
    
    console.log(`✅ Reservation found with status: ${reservation.status}`);
    
    // Get the inventory item
    const inventoryItem = await PetInventoryItem.findById(reservation.itemId)
      .populate('speciesId breedId imageIds');
    
    if (!inventoryItem) {
      console.log(`❌ Inventory item not found`);
      return;
    }
    
    // Manually populate images
    await inventoryItem.populate('images');
    
    console.log(`✅ Inventory item found: ${inventoryItem.name || 'Unnamed'} (${inventoryItem.petCode})`);
    
    // Check if Pet record already exists
    const Pet = require('../core/models/Pet');
    let petRecord = await Pet.findOne({ petCode: inventoryItem.petCode });
    
    if (!petRecord) {
      console.log(`❌ Pet record not found, creating new one...`);
      
      // Create a new pet record for the user
      const petData = {
        name: inventoryItem.name || 'Pet', // Use default name if empty
        species: inventoryItem.speciesId,
        breed: inventoryItem.breedId,
        age: inventoryItem.age,
        ageUnit: inventoryItem.ageUnit,
        gender: inventoryItem.gender,
        color: inventoryItem.color || 'Unknown',
        description: inventoryItem.description,
        images: inventoryItem.images || [], // Ensure images are properly included
        owner: reservation.userId, // Use 'owner' field instead of 'ownerId'
        ownerId: reservation.userId, // Also set ownerId for consistency
        petCode: inventoryItem.petCode,
        source: 'petshop_purchase',
        currentStatus: 'sold', // Use valid status from enum
        status: 'available',
        createdBy: reservation.userId
      };

      petRecord = new Pet(petData);
      await petRecord.save();
      console.log(`✅ Created new Pet record: ${petRecord._id}`);
    } else {
      console.log(`✅ Pet record already exists: ${petRecord._id}`);
    }
    
    // Update reservation with pet reference
    reservation.petId = petRecord._id;
    await reservation.save();
    console.log(`✅ Updated reservation with petId: ${petRecord._id}`);
    
    // Update PetRegistry to ensure it has the corePetId
    const registryEntry = await PetRegistry.findOneAndUpdate(
      { petCode: inventoryItem.petCode },
      {
        $set: {
          corePetId: petRecord._id
        }
      },
      { new: true }
    );
    
    if (registryEntry) {
      console.log(`✅ Updated PetRegistry with corePetId: ${petRecord._id}`);
    } else {
      console.log(`❌ Failed to update PetRegistry`);
    }
    
    console.log(`\n🎉 Problem pet fixed successfully!`);
    
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
  fixProblemPet();
}

module.exports = { fixProblemPet };