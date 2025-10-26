/**
 * Quick script to fix PetRegistry entries for pet shop pets
 * Run this script to ensure all pet shop inventory items and purchased pets
 * are properly registered in the centralized PetRegistry
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

const runFix = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Fixing PetRegistry entries for pet shop pets...');

    // Process all pet inventory items
    console.log('📦 Fetching pet inventory items...');
    const items = await PetInventoryItem.find({}).limit(100);
    console.log(`📦 Found ${items.length} pet inventory items`);
    
    let fixedCount = 0;
    for (const item of items) {
      try {
        // Populate references
        await item.populate(['speciesId', 'breedId', 'imageIds']);
        
        // Register in PetRegistry if not already registered
        const existing = await PetRegistry.findOne({ petCode: item.petCode });
        if (!existing) {
          await PetRegistry.create({
            petCode: item.petCode,
            name: item.name,
            species: item.speciesId,
            breed: item.breedId,
            imageIds: item.imageIds || [],
            gender: item.gender,
            age: item.age,
            ageUnit: item.ageUnit,
            color: item.color,
            source: 'petshop',
            petShopItemId: item._id,
            firstAddedSource: 'pet_shop',
            currentLocation: item.status === 'available_for_sale' ? 'at_petshop' : 'unknown',
            currentStatus: item.status === 'available_for_sale' ? 'available' : 'in_petshop'
          });
          console.log(`✅ Registered ${item.petCode}: ${item.name}`);
          fixedCount++;
        } else {
          // Update existing entry if needed
          await PetRegistry.updateOne(
            { petCode: item.petCode },
            {
              $set: {
                name: item.name,
                species: item.speciesId,
                breed: item.breedId,
                imageIds: item.imageIds || [],
                gender: item.gender,
                age: item.age,
                ageUnit: item.ageUnit,
                color: item.color
              }
            }
          );
          console.log(`🔄 Updated ${item.petCode}: ${item.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${item.petCode}:`, error.message);
      }
    }
    
    // Process purchased pets
    console.log('\n💰 Processing purchased pets...');
    const reservations = await PetReservation.find({
      status: { $in: ['completed', 'at_owner'] }
    }).limit(100);
    
    console.log(`🛒 Found ${reservations.length} purchased reservations`);
    
    for (const reservation of reservations) {
      try {
        const item = await PetInventoryItem.findById(reservation.itemId);
        if (item) {
          // Update PetRegistry with ownership info
          await PetRegistry.updateOne(
            { petCode: item.petCode },
            {
              $set: {
                currentOwnerId: reservation.userId,
                currentStatus: 'owned',
                currentLocation: 'at_owner',
                lastTransferAt: new Date()
              },
              $push: {
                ownershipHistory: {
                  previousOwnerId: null,
                  newOwnerId: reservation.userId,
                  transferType: 'purchase',
                  transferDate: new Date(),
                  transferPrice: reservation.paymentInfo?.amount || 0,
                  transferReason: 'Pet shop purchase',
                  source: 'petshop'
                }
              }
            }
          );
          console.log(`✅ Updated ownership for ${item.petCode}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ownership:`, error.message);
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} pet registry entries`);
    console.log('✅ PetRegistry fix completed!');
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
  runFix();
}

module.exports = { runFix };