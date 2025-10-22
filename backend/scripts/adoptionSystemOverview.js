const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Connect to database
const connectDB = require('../core/db');
connectDB();

// Import models
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
const AdoptionRequest = require('../modules/adoption/manager/models/AdoptionRequest');
const User = require('../core/models/User');

async function systemOverview() {
  try {
    console.log(`\n=== ADOPTION SYSTEM OVERVIEW ===\n`);
    
    // Get total counts
    const petCount = await AdoptionPet.countDocuments();
    const activePetCount = await AdoptionPet.countDocuments({ isActive: true });
    const applicationCount = await AdoptionRequest.countDocuments();
    const activeApplicationCount = await AdoptionRequest.countDocuments({ isActive: true });
    const userManagerCount = await User.countDocuments({ role: 'adoption_manager', isActive: true });
    const userCount = await User.countDocuments({ isActive: true });
    
    console.log(`📊 SYSTEM STATS:`);
    console.log(`  Total Pets: ${petCount} (${activePetCount} active)`);
    console.log(`  Total Applications: ${applicationCount} (${activeApplicationCount} active)`);
    console.log(`  Active Managers: ${userManagerCount}`);
    console.log(`  Total Users: ${userCount}\n`);
    
    // Pet status breakdown
    console.log(`🐾 PET STATUS BREAKDOWN:`);
    const petStatuses = await AdoptionPet.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    petStatuses.forEach(status => {
      console.log(`  ${status._id}: ${status.count}`);
    });
    
    // Application status breakdown
    console.log(`\n📋 APPLICATION STATUS BREAKDOWN:`);
    const appStatuses = await AdoptionRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    appStatuses.forEach(status => {
      console.log(`  ${status._id}: ${status.count}`);
    });
    
    // Recently added pets
    console.log(`\n🆕 RECENTLY ADDED PETS (last 5):`);
    const recentPets = await AdoptionPet.find({ isActive: true })
      .select('_id name petCode status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    if (recentPets.length > 0) {
      recentPets.forEach(pet => {
        const date = pet.createdAt.toISOString().split('T')[0];
        console.log(`  ${date} | ${pet.name} (${pet.petCode}) | ${pet.status}`);
      });
    } else {
      console.log(`  No pets found`);
    }
    
    // Recently submitted applications
    console.log(`\n📝 RECENT APPLICATIONS (last 5):`);
    const recentApps = await AdoptionRequest.find({ isActive: true })
      .populate('userId', 'name')
      .populate('petId', 'name petCode')
      .sort({ createdAt: -1 })
      .limit(5);
    
    if (recentApps.length > 0) {
      recentApps.forEach(app => {
        const date = app.createdAt.toISOString().split('T')[0];
        const userName = app.userId ? app.userId.name : 'Unknown User';
        const petName = app.petId ? app.petId.name : 'Unknown Pet';
        const petCode = app.petId ? app.petId.petCode : '';
        console.log(`  ${date} | ${userName} | ${petName} (${petCode}) | ${app.status}`);
      });
    } else {
      console.log(`  No applications found`);
    }
    
    // Pets without applications (potentially stale)
    console.log(`\n⚠️  PETS WITHOUT APPLICATIONS (available > 30 days):`);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const stalePets = await AdoptionPet.find({
      status: 'available',
      isActive: true,
      createdAt: { $lt: thirtyDaysAgo },
      _id: {
        $nin: await AdoptionRequest.distinct('petId', { 
          createdAt: { $gte: thirtyDaysAgo } 
        })
      }
    }).select('_id name petCode createdAt');
    
    if (stalePets.length > 0) {
      stalePets.forEach(pet => {
        const daysOld = Math.floor((new Date() - pet.createdAt) / (1000 * 60 * 60 * 24));
        console.log(`  ${pet.name} (${pet.petCode}) | ${daysOld} days old`);
      });
      console.log(`\n  Consider reviewing these pets for removal or updating.`);
    } else {
      console.log(`  No stale pets found`);
    }
    
    console.log(`\n=== END OF OVERVIEW ===\n`);
    
  } catch (error) {
    console.error('Error generating system overview:', error);
  } finally {
    mongoose.connection.close();
  }
}

systemOverview();