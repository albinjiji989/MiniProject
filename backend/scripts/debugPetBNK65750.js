const mongoose = require('mongoose');
require('dotenv').config();

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const PetReservation = require('../modules/petshop/user/models/PetReservation');
    const PetInventoryItem = require('../modules/petshop/manager/models/PetInventoryItem');
    
    const pet = await PetInventoryItem.findOne({ petCode: 'BNK65750' });
    console.log('\nPet BNK65750:');
    if (pet) {
      console.log('  _id:', pet._id);
      console.log('  petCode:', pet.petCode);
      console.log('  name:', pet.name);
      console.log('  status:', pet.status);
      
      const reservations = await PetReservation.find({ itemId: pet._id });
      console.log('\nReservations for this pet:', reservations.length);
      reservations.forEach((r, i) => {
        console.log(`\nReservation ${i + 1}:`);
        console.log('  userId:', r.userId);
        console.log('  status:', r.status);
        console.log('  createdAt:', r.createdAt);
        console.log('  updatedAt:', r.updatedAt);
      });
    } else {
      console.log('  Pet not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debug();
