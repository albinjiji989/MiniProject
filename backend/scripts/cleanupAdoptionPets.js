const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Connect to database
const connectDB = require('../core/db');
connectDB();

// Import models
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
const AdoptionRequest = require('../modules/adoption/manager/models/AdoptionRequest');

async function cleanupPets(options = {}) {
  const { 
    dryRun = true, 
    daysOld = 30, 
    status = 'all' 
  } = options;
  
  try {
    console.log(`=== ADOPTION PETS CLEANUP ===`);
    console.log(`Dry Run: ${dryRun ? 'YES' : 'NO'}`);
    console.log(`Days Old: ${daysOld}`);
    console.log(`Status Filter: ${status}`);
    
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // Build query for old pets
    const query = {
      createdAt: { $lt: cutoffDate },
      isActive: true
    };
    
    // Add status filter if specified
    if (status !== 'all') {
      query.status = status;
    }
    
    // Find old pets
    const oldPets = await AdoptionPet.find(query)
      .select('_id name petCode status createdAt');
    
    console.log(`\nFound ${oldPets.length} pets older than ${daysOld} days\n`);
    
    if (oldPets.length === 0) {
      console.log('No pets to cleanup.');
      return;
    }
    
    // Show details of pets to be cleaned up
    console.log('Pets to be cleaned up:');
    console.log('ID\t\t\t\tName\t\tCode\t\tStatus\t\tCreated At');
    console.log('-'.repeat(100));
    
    oldPets.forEach(pet => {
      console.log(
        `${pet._id}\t${pet.name.substring(0, 15)}\t\t${pet.petCode || '-'}\t\t${pet.status}\t\t${pet.createdAt.toISOString().split('T')[0]}`
      );
    });
    
    // Check if any of these pets have pending applications
    console.log('\nChecking for pending applications...');
    let petsWithApplications = 0;
    
    for (const pet of oldPets) {
      const pendingApps = await AdoptionRequest.countDocuments({
        petId: pet._id,
        status: 'pending',
        isActive: true
      });
      
      if (pendingApps > 0) {
        console.log(`  ⚠️  ${pet.name} (${pet.petCode}) has ${pendingApps} pending application(s)`);
        petsWithApplications++;
      }
    }
    
    if (petsWithApplications > 0) {
      console.log(`\n⚠️  ${petsWithApplications} pets have pending applications. Skipping cleanup for these pets.`);
      return;
    }
    
    // If not a dry run, actually delete the pets
    if (!dryRun) {
      console.log('\nPerforming cleanup...');
      let deletedCount = 0;
      
      for (const pet of oldPets) {
        try {
          // First, mark as inactive rather than deleting
          await AdoptionPet.findByIdAndUpdate(pet._id, { isActive: false });
          console.log(`  ✅ Marked ${pet.name} as inactive`);
          deletedCount++;
        } catch (error) {
          console.error(`  ❌ Failed to update ${pet.name}:`, error.message);
        }
      }
      
      console.log(`\n✅ Successfully marked ${deletedCount} pets as inactive`);
    } else {
      console.log('\n📋 This was a dry run. No pets were actually modified.');
      console.log('To perform actual cleanup, run with --dryRun false');
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key && value !== undefined) {
      switch (key) {
        case 'dryRun':
          options.dryRun = value !== 'false';
          break;
        case 'days':
          options.daysOld = parseInt(value);
          break;
        case 'status':
          options.status = value;
          break;
      }
    }
  }
  
  return options;
}

// Show help
function showHelp() {
  console.log(`
Usage: node scripts/cleanupAdoptionPets.js [options]

Options:
  --dryRun <true|false>  Whether to perform a dry run (default: true)
  --days <number>        Age in days for pets to be considered old (default: 30)
  --status <string>      Status filter (available, reserved, adopted, all) (default: all)

Examples:
  node scripts/cleanupAdoptionPets.js --dryRun true
  node scripts/cleanupAdoptionPets.js --days 60 --status available
  node scripts/cleanupAdoptionPets.js --dryRun false --days 90
  `);
}

// Check if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

const options = parseArgs();
cleanupPets(options);