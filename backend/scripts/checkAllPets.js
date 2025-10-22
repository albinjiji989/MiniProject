const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Connect to database
const connectDB = require('../core/db');
connectDB();

// Import models
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');

async function checkAllPets() {
  console.log('\n🔍 CHECKING ALL ADOPTION PETS IN DATABASE\n');
  
  try {
    // Get all pets
    const allPets = await AdoptionPet.find({})
      .select('_id name status isActive petCode createdAt')
      .sort({ createdAt: -1 });
    
    console.log(`📊 Total pets in database: ${allPets.length}\n`);
    
    if (allPets.length === 0) {
      console.log('No pets found in database');
      return;
    }
    
    console.log('📋 ALL PETS:');
    console.log('ID\t\t\t\t\tName\t\tStatus\t\tActive\tCode');
    console.log('-'.repeat(80));
    
    allPets.forEach(pet => {
      const name = pet.name ? pet.name.substring(0, 12) : '-';
      const code = pet.petCode || '-';
      console.log(`${pet._id}\t${name}\t\t${pet.status}\t\t${pet.isActive ? 'Yes' : 'No'}\t${code}`);
    });
    
    // Check available pets (what should be shown to users)
    const availablePets = await AdoptionPet.find({ status: 'available', isActive: true })
      .select('_id name status isActive petCode createdAt')
      .sort({ createdAt: -1 });
    
    console.log(`\n🟢 AVAILABLE PETS (shown to users): ${availablePets.length}`);
    if (availablePets.length > 0) {
      availablePets.forEach(pet => {
        const name = pet.name ? pet.name.substring(0, 12) : '-';
        const code = pet.petCode || '-';
        console.log(`   ${pet._id}\t${name}\t\t${pet.status}\t\t${pet.isActive ? 'Yes' : 'No'}\t${code}`);
      });
    }
    
    // Check inactive pets
    const inactivePets = await AdoptionPet.find({ isActive: false })
      .select('_id name status isActive petCode createdAt')
      .sort({ createdAt: -1 });
    
    console.log(`\n🔴 INACTIVE PETS: ${inactivePets.length}`);
    if (inactivePets.length > 0) {
      inactivePets.forEach(pet => {
        const name = pet.name ? pet.name.substring(0, 12) : '-';
        const code = pet.petCode || '-';
        console.log(`   ${pet._id}\t${name}\t\t${pet.status}\t\t${pet.isActive ? 'Yes' : 'No'}\t${code}`);
      });
    }
    
    // Check the specific problematic pet
    const problemPetId = '68f74a849867d88ea26b5b1b';
    const problemPet = await AdoptionPet.findById(problemPetId);
    
    console.log(`\n🔍 PROBLEM PET (${problemPetId}):`);
    if (problemPet) {
      console.log(`   Name: ${problemPet.name || 'Not set'}`);
      console.log(`   Status: ${problemPet.status}`);
      console.log(`   Active: ${problemPet.isActive ? 'Yes' : 'No'}`);
      console.log(`   Created: ${problemPet.createdAt ? problemPet.createdAt.toISOString() : 'Unknown'}`);
    } else {
      console.log(`   Not found in database`);
    }
    
  } catch (error) {
    console.error('Error checking pets:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAllPets();