const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Connect to database
const connectDB = require('../core/db');
connectDB();

// Import models
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');

async function verifyPet(petIdToCheck) {
  // Use the pet ID passed as argument, or default to the problematic one
  const petId = petIdToCheck || '68e26d6e85b730dd2f1a8c2b';
  
  console.log(`Checking adoption pet with ID: ${petId}`);
  
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
        petCode: pet.petCode,
        age: `${pet.age || 0} ${pet.ageUnit || 'months'}`,
        gender: pet.gender,
        createdAt: pet.createdAt,
        updatedAt: pet.updatedAt
      });
    } else {
      console.log('Pet not found in database');
      
      // Let's check if there are any pets at all
      const count = await AdoptionPet.countDocuments();
      console.log(`Total adoption pets in database: ${count}`);
      
      // Get all available pets (just show count and sample)
      const availableCount = await AdoptionPet.countDocuments({ status: 'available', isActive: true });
      const reservedCount = await AdoptionPet.countDocuments({ status: 'reserved', isActive: true });
      const adoptedCount = await AdoptionPet.countDocuments({ status: 'adopted', isActive: true });
      
      console.log(`\nStatus breakdown:`);
      console.log(`  Available: ${availableCount}`);
      console.log(`  Reserved: ${reservedCount}`);
      console.log(`  Adopted: ${adoptedCount}`);
      
      if (availableCount > 0) {
        console.log(`\nRecent available pets:`);
        const recentPets = await AdoptionPet.find({ status: 'available', isActive: true })
          .select('_id name petCode createdAt')
          .sort({ createdAt: -1 })
          .limit(5);
        
        recentPets.forEach(p => {
          console.log(`  ${p._id} | ${p.name} | ${p.petCode} | ${p.createdAt.toISOString().split('T')[0]}`);
        });
      }
    }
  } catch (error) {
    console.error('Error checking pet:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Show help
function showHelp() {
  console.log(`
Usage: node scripts/verifyAdoptionPet.js [petId]

Arguments:
  petId    The ID of the pet to verify (optional)

If no petId is provided, it will check the default problematic ID.

Examples:
  node scripts/verifyAdoptionPet.js
  node scripts/verifyAdoptionPet.js 68e26d6e85b730dd2f1a8c2b
  `);
}

// Check if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Get pet ID from command line arguments
const args = process.argv.slice(2);
const petIdToCheck = args[0] && !args[0].startsWith('-') ? args[0] : null;

verifyPet(petIdToCheck);