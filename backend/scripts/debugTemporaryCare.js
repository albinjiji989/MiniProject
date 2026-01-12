/**
 * Debug Temporary Care System
 * Shows the current state of all applications, pets, and centers
 */

const mongoose = require('mongoose');

async function debugTemporaryCare() {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n🔍 TEMPORARY CARE DEBUG REPORT\n');
    console.log('='.repeat(60));

    const TemporaryCareApplication = require('../modules/temporary-care/models/TemporaryCareApplication');
    const TemporaryCareCenter = require('../modules/temporary-care/manager/models/TemporaryCareCenter');
    const Pet = require('../core/models/Pet');
    const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
    const User = require('../core/models/User');

    // 1. Check all centers
    console.log('\n📍 TEMPORARY CARE CENTERS:');
    const centers = await TemporaryCareCenter.find({}).populate('owner', 'name email');
    console.log(`Total centers: ${centers.length}\n`);
    
    centers.forEach((center, idx) => {
      console.log(`${idx + 1}. ${center.name || 'Unnamed Center'}`);
      console.log(`   ID: ${center._id}`);
      console.log(`   Owner: ${center.owner?.name} (${center.owner?._id})`);
      console.log(`   Active: ${center.isActive}`);
      console.log('');
    });

    // 2. Check all applications
    console.log('\n📋 TEMPORARY CARE APPLICATIONS:');
    const applications = await TemporaryCareApplication.find({})
      .populate('userId', 'name email')
      .populate('centerId', 'name owner')
      .sort({ createdAt: -1 });
    
    console.log(`Total applications: ${applications.length}\n`);
    
    for (const app of applications) {
      console.log(`${app.applicationNumber}`);
      console.log(`   Application ID: ${app._id}`);
      console.log(`   Status: ${app.status}`);
      console.log(`   User: ${app.userId?.name} (${app.userId?._id})`);
      console.log(`   Center: ${app.centerId?.name} (${app.centerId?._id})`);
      console.log(`   Center Owner: ${app.centerId?.owner}`);
      console.log(`   Pets: ${app.pets?.length || 0}`);
      console.log(`   Payment Status:`);
      console.log(`     - Advance: ${app.paymentStatus?.advance?.status || 'not started'}`);
      console.log(`     - Final: ${app.paymentStatus?.final?.status || 'not started'}`);
      console.log(`   Dates: ${new Date(app.startDate).toLocaleDateString()} to ${new Date(app.endDate).toLocaleDateString()}`);
      
      // Check each pet
      if (app.pets?.length > 0) {
        console.log(`   Pet Details:`);
        for (const petEntry of app.pets) {
          const petCode = petEntry.petId;
          let pet = await Pet.findOne({ petCode });
          if (!pet) pet = await AdoptionPet.findOne({ petCode });
          
          if (pet) {
            console.log(`     - ${petCode}: ${pet.name}`);
            console.log(`       Current Status: ${pet.currentStatus}`);
            console.log(`       In Care: ${pet.temporaryCareStatus?.inCare || false}`);
          } else {
            console.log(`     - ${petCode}: NOT FOUND IN DATABASE`);
          }
        }
      }
      console.log('');
    }

    // 3. Check pets with temporary care status
    console.log('\n🐾 PETS IN TEMPORARY CARE:');
    const petsInCare = await Pet.find({ 'temporaryCareStatus.inCare': true });
    const adoptionPetsInCare = await AdoptionPet.find({ 'temporaryCareStatus.inCare': true });
    
    const allPetsInCare = [...petsInCare, ...adoptionPetsInCare];
    console.log(`Total pets marked as in care: ${allPetsInCare.length}\n`);
    
    allPetsInCare.forEach((pet, idx) => {
      console.log(`${idx + 1}. ${pet.name} (${pet.petCode})`);
      console.log(`   Current Status: ${pet.currentStatus}`);
      console.log(`   In Care: ${pet.temporaryCareStatus?.inCare}`);
      console.log(`   Application ID: ${pet.temporaryCareStatus?.applicationId}`);
      console.log(`   Center ID: ${pet.temporaryCareStatus?.centerId}`);
      console.log('');
    });

    // 4. Check managers
    console.log('\n👔 TEMPORARY CARE MANAGERS:');
    const managers = await User.find({ 
      role: { $in: ['temporary-care_manager', 'manager'] }
    }).select('name email role');
    
    console.log(`Total managers: ${managers.length}\n`);
    managers.forEach((mgr, idx) => {
      console.log(`${idx + 1}. ${mgr.name} (${mgr._id})`);
      console.log(`   Email: ${mgr.email}`);
      console.log(`   Role: ${mgr.role}`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('\n✅ Debug complete!\n');

    mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

mongoose.connect('mongodb://localhost:27017/petconnect', {
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
    return debugTemporaryCare();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
