const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
const PetRegistry = require('../core/models/PetRegistry');
const Pet = require('../core/models/Pet');
const PetNew = require('../core/models/PetNew');
const PetReservation = require('../modules/petshop/user/models/PetReservation');

const USER_ID = '68fcffdb1775377dcf9195b0';

async function debugPets() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Debugging pet data for user:', USER_ID);
    console.log('=====================================');

    // 1. Check PetRegistry data
    console.log('\n1. PetRegistry data:');
    const registryPets = await PetRegistry.find({ currentOwnerId: USER_ID });
    console.log(`Found ${registryPets.length} pets in PetRegistry`);
    registryPets.forEach(pet => {
      console.log(`  - PetCode: ${pet.petCode}, Name: ${pet.name}, Location: ${pet.currentLocation}, Status: ${pet.currentStatus}`);
    });

    // 2. Check Pet model data
    console.log('\n2. Pet model data:');
    const petModelPets = await Pet.find({ ownerId: USER_ID });
    console.log(`Found ${petModelPets.length} pets in Pet model`);
    petModelPets.forEach(pet => {
      console.log(`  - ID: ${pet._id}, Name: ${pet.name}, ImageIds: ${pet.imageIds?.length || 0}`);
    });

    // 3. Check PetNew model data
    console.log('\n3. PetNew model data:');
    const petNewPets = await PetNew.find({ ownerId: USER_ID });
    console.log(`Found ${petNewPets.length} pets in PetNew model`);
    petNewPets.forEach(pet => {
      console.log(`  - ID: ${pet._id}, Name: ${pet.name}, ImageIds: ${pet.imageIds?.length || 0}`);
    });

    // 4. Check PetReservation data (all statuses)
    console.log('\n4. PetReservation data (all statuses):');
    const allReservations = await PetReservation.find({ userId: USER_ID });
    console.log(`Found ${allReservations.length} total reservations`);
    allReservations.forEach(res => {
      console.log(`  - Reservation ID: ${res._id}, Item ID: ${res.itemId}, Status: ${res.status}`);
    });

    // 5. Check specific reservation statuses
    console.log('\n5. Reservations with specific statuses:');
    const paidReservations = await PetReservation.find({ userId: USER_ID, status: 'paid' });
    console.log(`Found ${paidReservations.length} paid reservations`);
    
    const completedReservations = await PetReservation.find({ userId: USER_ID, status: 'completed' });
    console.log(`Found ${completedReservations.length} completed reservations`);
    
    const atOwnerReservations = await PetReservation.find({ userId: USER_ID, status: 'at_owner' });
    console.log(`Found ${atOwnerReservations.length} at_owner reservations`);

    console.log('\n✅ Debug completed');
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

debugPets();