const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Connect to database
const connectDB = require('../core/db');
connectDB();

// Import models
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');

async function debugSpecificPet() {
  const petId = '68f74a849867d88ea26b5b1b';
  
  console.log(`\n🔍 Debugging pet with ID: ${petId}\n`);
  
  try {
    // Check if pet exists with all fields
    const pet = await AdoptionPet.findById(petId);
    
    if (pet) {
      console.log('✅ PET FOUND IN DATABASE:');
      console.log(`   ID: ${pet._id}`);
      console.log(`   Name: ${pet.name || 'Not set'}`);
      console.log(`   Species: ${pet.species || 'Not set'}`);
      console.log(`   Breed: ${pet.breed || 'Not set'}`);
      console.log(`   Status: ${pet.status}`);
      console.log(`   Active: ${pet.isActive ? 'Yes' : 'No'}`);
      console.log(`   Created: ${pet.createdAt ? pet.createdAt.toISOString() : 'Unknown'}`);
      console.log(`   Updated: ${pet.updatedAt ? pet.updatedAt.toISOString() : 'Never'}`);
      
      // Check why it might not be accessible
      console.log('\n🔍 ACCESSIBILITY CHECK:');
      if (!pet.isActive) {
        console.log('   ❌ Pet is not active');
      } else {
        console.log('   ✅ Pet is active');
      }
      
      if (pet.status !== 'available') {
        console.log(`   ❌ Pet status is "${pet.status}" (not "available")`);
      } else {
        console.log('   ✅ Pet status is "available"');
      }
      
      // Check if it passes the public pet details filter
      const isAccessible = pet.isActive && pet.status === 'available';
      console.log(`\n📊 Overall accessible: ${isAccessible ? 'YES' : 'NO'}`);
      
    } else {
      console.log('❌ PET NOT FOUND IN DATABASE');
      
      // Let's check if there are any pets at all
      const count = await AdoptionPet.countDocuments();
      console.log(`\n📊 Total adoption pets in database: ${count}`);
      
      // Get recent available pets
      console.log('\n🆕 Recent available pets:');
      const recentPets = await AdoptionPet.find({ status: 'available', isActive: true })
        .select('_id name petCode createdAt')
        .sort({ createdAt: -1 })
        .limit(5);
      
      if (recentPets.length > 0) {
        recentPets.forEach(p => {
          console.log(`   ${p._id} | ${p.name} | ${p.petCode || 'No code'} | ${p.createdAt.toISOString().split('T')[0]}`);
        });
      } else {
        console.log('   No available pets found');
      }
    }
  } catch (error) {
    console.error('Error checking pet:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugSpecificPet();