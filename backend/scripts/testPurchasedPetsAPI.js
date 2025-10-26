/**
 * Test script to check what data is returned by the purchased pets endpoint
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

const testPurchasedPetsAPI = async () => {
  try {
    await connectDB();
    
    const userId = '68fcffdb1775377dcf9195b0'; // The user ID from our problem pet
    console.log(`🔍 Testing purchased pets API for user: ${userId}`);
    
    // Get completed reservations (purchased pets) for this user
    const reservations = await PetReservation.find({
      userId: userId,
      status: { $in: ['completed', 'at_owner'] }
    })
    .populate({
      path: 'itemId',
      select: 'name petCode price images speciesId breedId storeId storeName gender age ageUnit color',
      populate: [
        { path: 'speciesId', select: 'name displayName' },
        { path: 'breedId', select: 'name' },
        { path: 'imageIds' } // Populate imageIds
      ]
    })
    .sort({ createdAt: -1 });
    
    // Manually populate the virtual 'images' field for each item
    for (const reservation of reservations) {
      if (reservation.itemId) {
        await reservation.itemId.populate('images');
      }
    }
    
    console.log(`Found ${reservations.length} purchased reservations for user`);
    
    // Map to a consistent pet format (same as in userController)
    const purchasedPets = await Promise.all(reservations
      .filter(r => r.itemId)
      .map(async (r) => {
        // Try to get the actual pet from the Pet model first
        let actualPet = null;
        const Pet = require('../core/models/Pet');
        if (r.petId) {
          actualPet = await Pet.findById(r.petId).populate('images');
        }
        
        // If not found, try to get from PetRegistry
        let registryEntry = null;
        if (!actualPet && r.itemId.petCode) {
          registryEntry = await PetRegistry.findOne({ petCode: r.itemId.petCode }).populate('images');
          if (registryEntry && registryEntry.corePetId) {
            actualPet = await Pet.findById(registryEntry.corePetId).populate('images');
          }
        }
        
        // Get images from the best available source
        let images = [];
        if (actualPet && actualPet.images) {
          images = actualPet.images;
        } else if (registryEntry && registryEntry.images) {
          images = registryEntry.images;
        } else if (r.itemId && r.itemId.images) {
          images = r.itemId.images;
        }
        
        return {
          _id: actualPet ? actualPet._id : (registryEntry ? registryEntry._id : r.itemId._id),
          petCode: r.itemId.petCode,
          name: r.itemId.name,
          images: images || [],
          species: r.itemId.speciesId,
          breed: r.itemId.breedId,
          gender: r.itemId.gender,
          age: r.itemId.age,
          color: r.itemId.color,
          currentStatus: 'purchased',
          source: 'petshop',
          sourceLabel: 'Purchased from Pet Shop',
          acquiredDate: r.updatedAt
        };
      }));
    
    console.log('\nMapped purchased pets:');
    purchasedPets.forEach((pet, index) => {
      console.log(`${index + 1}. _id: ${pet._id}`);
      console.log(`   petCode: ${pet.petCode}`);
      console.log(`   name: ${pet.name}`);
      console.log(`   images: ${pet.images?.length || 0}`);
      console.log('');
    });
    
    // Check the specific problem pet
    const problemPet = purchasedPets.find(pet => pet.petCode === 'OHB56406');
    if (problemPet) {
      console.log(`✅ Problem pet found in API response:`);
      console.log(`   _id: ${problemPet._id}`);
      console.log(`   petCode: ${problemPet.petCode}`);
      console.log(`   name: ${problemPet.name}`);
      console.log(`   images: ${problemPet.images?.length || 0}`);
    } else {
      console.log(`❌ Problem pet not found in API response`);
    }
    
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
  testPurchasedPetsAPI();
}

module.exports = { testPurchasedPetsAPI };