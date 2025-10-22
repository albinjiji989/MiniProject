#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import models
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');

async function checkPet(petId) {
  if (!petId) {
    console.log('Usage: node checkAdoptionPet.js <petId>');
    console.log('Example: node checkAdoptionPet.js 68f74a849867d88ea26b5b1b');
    process.exit(1);
  }

  try {
    // Connect to database
    const connectDB = require('../core/db');
    await connectDB();

    console.log(`\n🔍 Checking adoption pet with ID: ${petId}\n`);
    
    // Check if pet exists
    const pet = await AdoptionPet.findById(petId)
      .select('_id name species breed age ageUnit gender status isActive petCode createdAt updatedAt');
    
    if (pet) {
      console.log('✅ PET FOUND:');
      console.log(`   ID: ${pet._id}`);
      console.log(`   Name: ${pet.name || 'Not set'}`);
      console.log(`   Species: ${pet.species || 'Not set'}`);
      console.log(`   Breed: ${pet.breed || 'Not set'}`);
      console.log(`   Age: ${pet.age || 0} ${pet.ageUnit || 'months'}`);
      console.log(`   Gender: ${pet.gender || 'Not set'}`);
      console.log(`   Status: ${pet.status}`);
      console.log(`   Active: ${pet.isActive ? 'Yes' : 'No'}`);
      console.log(`   Pet Code: ${pet.petCode || 'Not assigned'}`);
      console.log(`   Created: ${pet.createdAt ? pet.createdAt.toISOString().split('T')[0] : 'Unknown'}`);
      console.log(`   Updated: ${pet.updatedAt ? pet.updatedAt.toISOString().split('T')[0] : 'Never'}`);
      
      // Check for applications
      const AdoptionRequest = require('../modules/adoption/manager/models/AdoptionRequest');
      const appCount = await AdoptionRequest.countDocuments({ petId: pet._id, isActive: true });
      console.log(`   Applications: ${appCount} active`);
      
      if (appCount > 0) {
        const pendingApps = await AdoptionRequest.countDocuments({ 
          petId: pet._id, 
          isActive: true,
          status: 'pending'
        });
        console.log(`   Pending Applications: ${pendingApps}`);
      }
    } else {
      console.log('❌ PET NOT FOUND');
      
      // Show recent pets
      console.log('\n🆕 Recent available pets:');
      const recentPets = await AdoptionPet.find({ status: 'available', isActive: true })
        .select('_id name petCode createdAt')
        .sort({ createdAt: -1 })
        .limit(3);
      
      recentPets.forEach(p => {
        console.log(`   ${p._id} | ${p.name} | ${p.petCode} | ${p.createdAt.toISOString().split('T')[0]}`);
      });
    }
  } catch (error) {
    console.error('Error checking pet:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Get pet ID from command line arguments
const petId = process.argv[2];
checkPet(petId);