/**
 * Debug script to check what data is returned by the purchased pets endpoint
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

const debugPurchasedPets = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Debugging purchased pets endpoint data...');
    
    // Get completed reservations (purchased pets)
    const reservations = await PetReservation.find({
      status: { $in: ['completed', 'at_owner'] }
    })
    .populate({
      path: 'itemId',
      select: 'name petCode price images speciesId breedId storeId storeName',
      populate: [
        { path: 'speciesId', select: 'name displayName' },
        { path: 'breedId', select: 'name' },
        { path: 'imageIds' } // Populate imageIds
      ]
    })
    .populate('petId') // Populate the petId field which references the actual pet
    .sort({ createdAt: -1 });
    
    // Manually populate the virtual 'images' field for each item
    for (const reservation of reservations) {
      if (reservation.itemId) {
        await reservation.itemId.populate('images');
      }
    }
    
    console.log(`Found ${reservations.length} purchased reservations`);
    
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
  debugPurchasedPets();
}

module.exports = { debugPurchasedPets };