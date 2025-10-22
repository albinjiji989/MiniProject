require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../core/db');

const Species = require('../core/models/Species');
const Breed = require('../core/models/Breed');
const Pet = require('../core/models/Pet');

async function cleanup() {
  try {
    await connectDB();

    console.log('🧹 Cleaning up dummy seed data...');

    // Remove dummy species (dog and cat)
    const deletedSpecies = await Species.deleteMany({ 
      name: { $in: ['dog', 'cat'] } 
    });
    console.log(`✅ Deleted ${deletedSpecies.deletedCount} dummy species`);

    // Remove dummy breeds
    const deletedBreeds = await Breed.deleteMany({ 
      name: { $in: ['Labrador Retriever', 'Persian'] } 
    });
    console.log(`✅ Deleted ${deletedBreeds.deletedCount} dummy breeds`);

    // Remove dummy pets
    const deletedPets = await Pet.deleteMany({ 
      name: { $in: ['Buddy', 'Luna'] } 
    });
    console.log(`✅ Deleted ${deletedPets.deletedCount} dummy pets`);

    console.log('✅ Cleanup completed - All dummy data removed!');
    console.log('ℹ️  Admin must now manually add all species, breeds, and pets');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  }
}

cleanup();
