const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Connect to database
const connectDB = require('../core/db');
connectDB();

// Import models
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');

async function checkSpecificPet() {
  const petId = '68f74a849867d88ea26b5b1b';
  
  console.log(`Checking specific pet with ID: ${petId}`);
  
  try {
    // Check if pet exists
    const pet = await AdoptionPet.findById(petId);
    
    if (pet) {
      console.log('Pet found:');
      console.log({
        _id: pet._id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        status: pet.status,
        isActive: pet.isActive,
        createdAt: pet.createdAt,
        updatedAt: pet.updatedAt
      });
    } else {
      console.log('Pet not found in database');
      
      // Let's check if there are any pets at all
      const count = await AdoptionPet.countDocuments();
      console.log(`Total adoption pets in database: ${count}`);
      
      // Get a few sample pets
      const samples = await AdoptionPet.find().limit(5).select('_id name status isActive createdAt');
      console.log('Sample pets:');
      samples.forEach(p => {
        console.log({
          _id: p._id,
          name: p.name,
          status: p.status,
          isActive: p.isActive,
          createdAt: p.createdAt
        });
      });
    }
  } catch (error) {
    console.error('Error checking pet:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkSpecificPet();