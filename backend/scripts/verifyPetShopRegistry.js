/**
 * Verification script to check if all pet shop pets are properly registered
 * and can be found in the system
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

// Import models
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

const runVerification = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Verifying PetRegistry entries for pet shop pets...\n');

    // Check inventory items
    const items = await PetInventoryItem.find({});
    console.log(`📦 Total pet inventory items: ${items.length}`);
    
    let missingRegistry = 0;
    let totalWithImages = 0;
    
    for (const item of items) {
      const registryEntry = await PetRegistry.findOne({ petCode: item.petCode });
      if (!registryEntry) {
        console.log(`❌ Missing from PetRegistry: ${item.petCode} - ${item.name}`);
        missingRegistry++;
      } else {
        if (registryEntry.imageIds && registryEntry.imageIds.length > 0) {
          totalWithImages++;
        }
      }
    }
    
    console.log(`\n📊 Registry verification:`);
    console.log(`  ✅ Properly registered: ${items.length - missingRegistry}`);
    console.log(`  ❌ Missing from registry: ${missingRegistry}`);
    console.log(`  🖼️  With images: ${totalWithImages}`);
    
    // Check purchased pets
    console.log('\n💰 Checking purchased pets...');
    const reservations = await PetReservation.find({
      status: { $in: ['completed', 'at_owner'] }
    }).populate('itemId');
    
    console.log(`🛒 Total purchased reservations: ${reservations.length}`);
    
    let missingOwnership = 0;
    let properOwnership = 0;
    
    for (const reservation of reservations) {
      if (reservation.itemId) {
        const registryEntry = await PetRegistry.findOne({ petCode: reservation.itemId.petCode });
        if (registryEntry) {
          if (registryEntry.currentOwnerId && registryEntry.currentOwnerId.toString() === reservation.userId.toString()) {
            properOwnership++;
          } else {
            console.log(`❌ Ownership mismatch: ${reservation.itemId.petCode} - ${reservation.itemId.name}`);
            missingOwnership++;
          }
        } else {
          console.log(`❌ Registry entry missing for purchased pet: ${reservation.itemId.petCode}`);
          missingOwnership++;
        }
      }
    }
    
    console.log(`\n📊 Ownership verification:`);
    console.log(`  ✅ Proper ownership: ${properOwnership}`);
    console.log(`  ❌ Ownership issues: ${missingOwnership}`);
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`  📦 Total inventory items: ${items.length}`);
    console.log(`  🛒 Total purchased pets: ${reservations.length}`);
    console.log(`  ✅ Registry coverage: ${((items.length - missingRegistry) / items.length * 100).toFixed(1)}%`);
    console.log(`  ✅ Ownership accuracy: ${((properOwnership) / (reservations.length || 1) * 100).toFixed(1)}%`);
    
    if (missingRegistry === 0 && missingOwnership === 0) {
      console.log('\n🎉 All pet shop pets are properly registered and tracked!');
    } else {
      console.log('\n⚠️  Some issues found. Run the fix script to resolve them.');
    }
    
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
  runVerification();
}

module.exports = { runVerification };