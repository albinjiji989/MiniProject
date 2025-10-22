const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import models (import before connecting to avoid issues)
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');

// Sample pet data - in a real scenario, this would come from a CSV file or API
const samplePets = [
  {
    name: "Buddy",
    breed: "Golden Retriever",
    species: "Dog",
    age: 2,
    ageUnit: "years",
    gender: "male",
    color: "Golden",
    weight: 30,
    healthStatus: "good",
    vaccinationStatus: "up_to_date",
    temperament: "friendly",
    description: "Friendly and energetic dog looking for a loving home",
    adoptionFee: 200
  },
  {
    name: "Whiskers",
    breed: "Siamese",
    species: "Cat",
    age: 1,
    ageUnit: "years",
    gender: "female",
    color: "Cream and brown",
    weight: 4,
    healthStatus: "excellent",
    vaccinationStatus: "up_to_date",
    temperament: "calm",
    description: "Beautiful Siamese cat, very affectionate and playful",
    adoptionFee: 150
  },
  {
    name: "Rocky",
    breed: "Bulldog",
    species: "Dog",
    age: 3,
    ageUnit: "years",
    gender: "male",
    color: "Brindle",
    weight: 25,
    healthStatus: "good",
    vaccinationStatus: "up_to_date",
    temperament: "calm",
    description: "Calm and loyal bulldog, great with children",
    adoptionFee: 250
  }
];

async function bulkAddPets(petsData, options = {}) {
  const { dryRun = true } = options;
  
  // Connect to database
  const connectDB = require('../core/db');
  await connectDB();
  
  try {
    console.log(`=== BULK ADD ADOPTION PETS ===`);
    console.log(`Dry Run: ${dryRun ? 'YES' : 'NO'}`);
    console.log(`Pets to add: ${petsData.length}\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < petsData.length; i++) {
      const petData = petsData[i];
      console.log(`Processing pet ${i + 1}/${petsData.length}: ${petData.name}`);
      
      try {
        if (!dryRun) {
          // In a real implementation, you might want to add the createdBy field
          // For now, we'll just save the pet data
          const pet = new AdoptionPet({
            ...petData,
            isActive: true,
            status: 'available'
          });
          
          await pet.save();
          console.log(`  ✅ Added ${pet.name} with ID: ${pet._id}`);
          successCount++;
        } else {
          console.log(`  📋 Would add ${petData.name} (dry run)`);
          successCount++;
        }
      } catch (error) {
        console.error(`  ❌ Failed to add ${petData.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (!dryRun) {
      console.log(`\n✅ Added ${successCount} pets to the adoption system`);
    } else {
      console.log(`\n📋 This was a dry run. No pets were actually added.`);
      console.log(`To perform actual addition, run with --dryRun false`);
    }
    
  } catch (error) {
    console.error('Error during bulk add:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dryRun' && args[i + 1]) {
      options.dryRun = args[i + 1] !== 'false';
      i++; // Skip the next argument
    }
  }
  
  return options;
}

// Show help
function showHelp() {
  console.log(`
Usage: node scripts/bulkAddAdoptionPets.js [options]

Options:
  --dryRun <true|false>  Whether to perform a dry run (default: true)

Examples:
  node scripts/bulkAddAdoptionPets.js --dryRun true
  node scripts/bulkAddAdoptionPets.js --dryRun false

Note: This script uses sample data. In a real implementation, you would
load data from a CSV file or other data source.
  `);
}

// Check if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

const options = parseArgs();
bulkAddPets(samplePets, options);