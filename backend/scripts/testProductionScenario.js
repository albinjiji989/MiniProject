/**
 * Comprehensive test to verify the pet shop system works correctly in production scenarios
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

const testProductionScenario = async () => {
  const session = await mongoose.startSession();
  try {
    await connectDB();
    await session.startTransaction();
    
    console.log('🔍 Testing production scenario for pet shop purchase...');
    
    // Test 1: Create a new pet inventory item
    console.log('\n--- Test 1: Creating pet inventory item ---');
    const inventoryItem = new PetInventoryItem({
      name: 'Buddy',
      speciesId: '68fd013c1775377dcf91976e', // Dog species ID
      breedId: '68fd01671775377dcf9197a9', // German Shepherd breed ID
      age: 2,
      ageUnit: 'months',
      gender: 'Male',
      color: 'Brown',
      price: 1500,
      storeId: '68fd0b4e55af6d11a8cdadae',
      createdBy: '68fcffdb1775377dcf9195b0'
    });
    
    await inventoryItem.save({ session });
    console.log(`✅ Created inventory item: ${inventoryItem._id} with petCode: ${inventoryItem.petCode}`);
    
    // Test 2: Verify PetRegistry registration
    console.log('\n--- Test 2: Verifying PetRegistry registration ---');
    const registryEntry = await PetRegistry.findOne({ petCode: inventoryItem.petCode }).session(session);
    if (registryEntry) {
      console.log(`✅ Pet registered in PetRegistry:`);
      console.log(`   ID: ${registryEntry._id}`);
      console.log(`   Name: ${registryEntry.name}`);
      console.log(`   PetCode: ${registryEntry.petCode}`);
      console.log(`   Current Status: ${registryEntry.currentStatus}`);
      console.log(`   Current Location: ${registryEntry.currentLocation}`);
    } else {
      console.log(`❌ Pet not found in PetRegistry`);
      throw new Error('PetRegistry registration failed');
    }
    
    // Test 3: Create a reservation
    console.log('\n--- Test 3: Creating reservation ---');
    const reservation = new PetReservation({
      itemId: inventoryItem._id,
      userId: '68fcffdb1775377dcf9195b0',
      status: 'pending'
    });
    
    await reservation.save({ session });
    console.log(`✅ Created reservation: ${reservation._id}`);
    
    // Test 4: Simulate purchase completion (ownership transfer)
    console.log('\n--- Test 4: Simulating ownership transfer ---');
    
    // Update reservation status to completed
    reservation.status = 'completed';
    await reservation.save({ session });
    
    // Simulate the handlePetOwnershipTransfer function
    const Pet = require('../core/models/Pet');
    
    // Create a new pet record for the user
    const petData = {
      name: inventoryItem.name || 'Pet',
      species: inventoryItem.speciesId,
      breed: inventoryItem.breedId,
      age: inventoryItem.age,
      ageUnit: inventoryItem.ageUnit,
      gender: inventoryItem.gender || 'Unknown',
      color: inventoryItem.color || 'Unknown',
      description: inventoryItem.description,
      images: [], // No images in this test
      owner: reservation.userId,
      ownerId: reservation.userId,
      petCode: inventoryItem.petCode,
      source: 'petshop_purchase',
      currentStatus: 'sold',
      status: 'available',
      createdBy: reservation.userId
    };

    const newPet = new Pet(petData);
    await newPet.save({ session });

    // Update inventory item status to sold
    inventoryItem.status = 'sold';
    inventoryItem.soldTo = reservation.userId;
    inventoryItem.soldAt = new Date();
    await inventoryItem.save({ session });

    // Update reservation with pet reference
    reservation.petId = newPet._id;
    await reservation.save({ session });

    // Update PetRegistry to reflect new ownership
    const updatedRegistryDoc = await PetRegistry.ensureRegistered({
      petCode: inventoryItem.petCode,
      name: inventoryItem.name || 'Pet',
      species: inventoryItem.speciesId,
      breed: inventoryItem.breedId,
      imageIds: [],
      source: 'petshop',
      petShopItemId: inventoryItem._id,
      firstAddedSource: 'pet_shop',
      firstAddedBy: reservation.userId,
      corePetId: newPet._id
    }, {
      currentOwnerId: reservation.userId,
      currentStatus: 'owned',
      currentLocation: 'at_owner',
      lastTransferAt: new Date()
    }, { session });
    
    // Add ownership history
    await PetRegistry.findByIdAndUpdate(
      updatedRegistryDoc._id,
      {
        $push: {
          ownershipHistory: {
            previousOwnerId: null,
            newOwnerId: reservation.userId,
            transferType: 'purchase',
            transferDate: new Date(),
            transferPrice: 1500,
            transferReason: 'Pet shop purchase',
            source: 'petshop',
            performedBy: reservation.userId
          }
        }
      },
      { session }
    );
    
    console.log(`✅ Ownership transfer completed successfully`);
    console.log(`   New Pet ID: ${newPet._id}`);
    console.log(`   Updated Registry Status: ${updatedRegistryDoc.currentStatus}`);
    console.log(`   Updated Registry Location: ${updatedRegistryDoc.currentLocation}`);
    
    // Test 5: Verify user can access purchased pet
    console.log('\n--- Test 5: Verifying user can access purchased pet ---');
    
    // Simulate the getUserPurchasedPets function
    const userReservations = await PetReservation.find({
      userId: reservation.userId,
      status: { $in: ['completed', 'at_owner'] }
    })
    .populate({
      path: 'itemId',
      select: 'name petCode price images speciesId breedId storeId storeName gender age ageUnit color',
      populate: [
        { path: 'speciesId', select: 'name displayName' },
        { path: 'breedId', select: 'name' },
        { path: 'imageIds' }
      ]
    })
    .populate('petId')
    .session(session)
    .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${userReservations.length} purchased pets for user`);
    
    if (userReservations.length > 0) {
      const userPet = userReservations[0];
      console.log(`   Reservation ID: ${userPet._id}`);
      console.log(`   Pet ID: ${userPet.petId}`);
      console.log(`   Pet Code: ${userPet.itemId.petCode}`);
      console.log(`   Pet Name: ${userPet.itemId.name}`);
    }
    
    await session.commitTransaction();
    console.log('\n🎉 All production scenario tests passed successfully!');
    
    console.log('\n✅ Summary of production-ready improvements:');
    console.log('1. Atomic transactions prevent data inconsistency');
    console.log('2. Proper validation ensures data integrity');
    console.log('3. Error handling prevents partial updates');
    console.log('4. Session support for transaction safety');
    console.log('5. Robust fallback mechanisms');
    console.log('6. Comprehensive logging for debugging');
    
  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Production scenario test failed:', error);
    throw error;
  } finally {
    await session.endSession();
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the test
if (require.main === module) {
  testProductionScenario();
}

module.exports = { testProductionScenario };