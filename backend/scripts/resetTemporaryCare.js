/**
 * Temporary Care Reset Script
 * 
 * This script returns all pets from temporary care back to their owners
 * and resets the temporary care system.
 * 
 * Usage:
 *   node scripts/resetTemporaryCare.js              - Return pets and complete applications
 *   node scripts/resetTemporaryCare.js --delete-all - Also delete all applications
 */

const mongoose = require('mongoose');

async function resetTemporaryCare() {
  try {
    // Wait a bit for MongoDB to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n🧹 Starting Temporary Care Reset...\n');

    // Import models
    const TemporaryCareApplication = require('../modules/temporary-care/models/TemporaryCareApplication');
    const Pet = require('../core/models/Pet');
    const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
    const PetRegistry = require('../core/models/PetRegistry');

    // 1. Find all applications with active_care status
    const activeCareApps = await TemporaryCareApplication.find({ 
      status: 'active_care' 
    });

    console.log(`📋 Found ${activeCareApps.length} applications with active_care status`);

    // 2. Return pets to users
    let petsReturned = 0;
    for (const app of activeCareApps) {
      console.log(`\n📦 Processing application: ${app.applicationNumber}`);
      
      for (const petEntry of app.pets) {
        const petCode = petEntry.petId;
        console.log(`  🐾 Returning pet: ${petCode}`);

        // Find pet in Pet collection
        let pet = await Pet.findOne({ petCode });
        
        // If not found, try AdoptionPet collection
        if (!pet) {
          pet = await AdoptionPet.findOne({ petCode });
        }

        if (pet) {
          // Remove temporary care status
          pet.temporaryCareStatus = {
            inCare: false,
            applicationId: null,
            centerId: null,
            startDate: null
          };
          
          // Set status back to 'with user'
          pet.currentStatus = 'with user';
          
          await pet.save();
          console.log(`    ✅ Pet ${petCode} returned to user (status: ${pet.currentStatus})`);

          // Update PetRegistry
          const registryUpdate = await PetRegistry.findOneAndUpdate(
            { petCode },
            { 
              currentStatus: 'with user',
              currentLocation: null
            }
          );
          
          if (registryUpdate) {
            console.log(`    ✅ PetRegistry updated for ${petCode}`);
          }

          petsReturned++;
        } else {
          console.log(`    ⚠️  Pet ${petCode} not found in database`);
        }
      }

      // Update application status to completed
      app.status = 'completed';
      app.checkOut = {
        actualCheckOutTime: new Date(),
        completedBy: null,
        notes: 'Reset script - pets returned to user'
      };
      await app.save();
      console.log(`  ✅ Application ${app.applicationNumber} marked as completed`);
    }

    console.log(`\n✅ ${petsReturned} pets returned to their owners`);

    // 3. Optional: Delete all temporary care applications
    const deleteChoice = process.argv[2];
    if (deleteChoice === '--delete-all') {
      console.log('\n🗑️  Deleting all temporary care applications...');
      const deleteResult = await TemporaryCareApplication.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} applications`);
    } else {
      // Show summary of all applications
      const allApps = await TemporaryCareApplication.find({});
      console.log(`\n📊 Total applications in database: ${allApps.length}`);
      
      const statusCounts = {};
      allApps.forEach(app => {
        statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      });
      
      console.log('📈 Status breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      console.log('\n💡 To delete all applications, run: node scripts/resetTemporaryCare.js --delete-all');
    }

    console.log('\n✨ Reset completed successfully!\n');
    mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during reset:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Connect to MongoDB and run reset
mongoose.connect('mongodb://localhost:27017/petconnect', {
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
    return resetTemporaryCare();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('\n⚠️  Make sure MongoDB is running!');
    process.exit(1);
  });
