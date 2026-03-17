const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Pet = require('../core/models/Pet');
const User = require('../core/models/User');
const CareBooking = require('../modules/temporary-care/models/CareBooking');
const TemporaryCare = require('../modules/temporary-care/models/TemporaryCare');
const TemporaryCarePayment = require('../modules/temporary-care/models/TemporaryCarePayment');
const TemporaryCareApplication = require('../modules/temporary-care/models/TemporaryCareApplication');
const TemporaryCareRequest = require('../modules/temporary-care/user/models/TemporaryCareRequest');

// Import adoption models
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');

// Import petshop models (if they exist)
let PetshopPet;
try {
  PetshopPet = require('../modules/petshop/models/Pet');
} catch (e) {
  console.log('PetshopPet model not found, skipping...');
}

/**
 * Comprehensive Temporary Care Reset Script
 * 
 * This script will:
 * 1. Find all pets currently in temporary care
 * 2. Return pets to their original owners
 * 3. Restore original pet tags (adopted/purchased)
 * 4. Remove temporary care banners
 * 5. Reset pet locations to 'at_owner'
 * 6. Clean up temporary care applications and bookings
 * 7. Handle specific user email: albinjiji17@gmail.com
 */

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petconnect');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function findPetsInTemporaryCare() {
  console.log('\n🔍 STEP 1: Finding pets in temporary care...\n');
  
  // Find pets with temporary care status
  const petsInCare = await Pet.find({ 
    'temporaryCareStatus.inCare': true 
  }).populate('ownerId', 'name email');
  
  const adoptionPetsInCare = await AdoptionPet.find({ 
    'temporaryCareStatus.inCare': true 
  }).populate('adopterUserId', 'name email');
  
  // Find petshop pets if model exists
  let petshopPetsInCare = [];
  if (PetshopPet) {
    petshopPetsInCare = await PetshopPet.find({ 
      'temporaryCareStatus.inCare': true 
    }).populate('ownerId', 'name email');
  }
  
  console.log(`📊 Found ${petsInCare.length} regular pets in temporary care`);
  console.log(`📊 Found ${adoptionPetsInCare.length} adoption pets in temporary care`);
  console.log(`📊 Found ${petshopPetsInCare.length} petshop pets in temporary care`);
  
  // Display details
  if (petsInCare.length > 0) {
    console.log('\n📋 Regular Pets in Temporary Care:');
    petsInCare.forEach(pet => {
      console.log(`  • ${pet.name} (${pet.petCode}) - Owner: ${pet.ownerId?.name} (${pet.ownerId?.email})`);
    });
  }
  
  if (adoptionPetsInCare.length > 0) {
    console.log('\n📋 Adoption Pets in Temporary Care:');
    adoptionPetsInCare.forEach(pet => {
      console.log(`  • ${pet.name} (${pet.petCode}) - Owner: ${pet.adopterUserId?.name} (${pet.adopterUserId?.email})`);
    });
  }
  
  if (petshopPetsInCare.length > 0) {
    console.log('\n📋 Petshop Pets in Temporary Care:');
    petshopPetsInCare.forEach(pet => {
      console.log(`  • ${pet.name} (${pet.petCode}) - Owner: ${pet.ownerId?.name} (${pet.ownerId?.email})`);
    });
  }
  
  return { petsInCare, adoptionPetsInCare, petshopPetsInCare };
}

async function restorePetOwnership() {
  console.log('\n🔄 STEP 2: Restoring pet ownership and removing temporary care status...\n');
  
  const { petsInCare, adoptionPetsInCare, petshopPetsInCare } = await findPetsInTemporaryCare();
  let restoredCount = 0;
  
  // Restore regular pets
  for (const pet of petsInCare) {
    try {
      // Remove temporary care status
      pet.temporaryCareStatus = {
        inCare: false,
        applicationId: null,
        centerId: null,
        startDate: null,
        expectedEndDate: null
      };
      
      // Set location back to owner
      pet.currentLocation = 'at_owner';
      
      await pet.save();
      console.log(`✅ Restored regular pet: ${pet.name} (${pet.petCode})`);
      restoredCount++;
    } catch (error) {
      console.error(`❌ Failed to restore regular pet ${pet.name}:`, error.message);
    }
  }
  
  // Restore adoption pets
  for (const pet of adoptionPetsInCare) {
    try {
      // Remove temporary care status
      pet.temporaryCareStatus = {
        inCare: false,
        applicationId: null,
        centerId: null,
        startDate: null,
        expectedEndDate: null
      };
      
      await pet.save();
      console.log(`✅ Restored adoption pet: ${pet.name} (${pet.petCode})`);
      restoredCount++;
    } catch (error) {
      console.error(`❌ Failed to restore adoption pet ${pet.name}:`, error.message);
    }
  }
  
  // Restore petshop pets
  for (const pet of petshopPetsInCare) {
    try {
      // Remove temporary care status
      pet.temporaryCareStatus = {
        inCare: false,
        applicationId: null,
        centerId: null,
        startDate: null,
        expectedEndDate: null
      };
      
      // Set location back to owner
      pet.currentLocation = 'at_owner';
      
      await pet.save();
      console.log(`✅ Restored petshop pet: ${pet.name} (${pet.petCode})`);
      restoredCount++;
    } catch (error) {
      console.error(`❌ Failed to restore petshop pet ${pet.name}:`, error.message);
    }
  }
  
  console.log(`\n📊 Total pets restored: ${restoredCount}`);
  return restoredCount;
}

async function cleanupTemporaryCareData() {
  console.log('\n🧹 STEP 3: Cleaning up temporary care applications and bookings...\n');
  
  let cleanupCount = 0;
  
  try {
    // Clean up TemporaryCareRequests
    const requestsResult = await TemporaryCareRequest.deleteMany({});
    console.log(`✅ Deleted ${requestsResult.deletedCount} temporary care requests`);
    cleanupCount += requestsResult.deletedCount;
    
    // Clean up TemporaryCareApplications
    const applicationsResult = await TemporaryCareApplication.deleteMany({});
    console.log(`✅ Deleted ${applicationsResult.deletedCount} temporary care applications`);
    cleanupCount += applicationsResult.deletedCount;
    
    // Clean up CareBookings
    const bookingsResult = await CareBooking.deleteMany({});
    console.log(`✅ Deleted ${bookingsResult.deletedCount} care bookings`);
    cleanupCount += bookingsResult.deletedCount;
    
    // Clean up TemporaryCare records
    const tempCareResult = await TemporaryCare.deleteMany({});
    console.log(`✅ Deleted ${tempCareResult.deletedCount} temporary care records`);
    cleanupCount += tempCareResult.deletedCount;
    
    // Clean up TemporaryCarePayments
    const paymentsResult = await TemporaryCarePayment.deleteMany({});
    console.log(`✅ Deleted ${paymentsResult.deletedCount} temporary care payments`);
    cleanupCount += paymentsResult.deletedCount;
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
  
  console.log(`\n📊 Total records cleaned up: ${cleanupCount}`);
  return cleanupCount;
}

async function handleSpecificUser(email) {
  console.log(`\n👤 STEP 4: Handling specific user: ${email}...\n`);
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return 0;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    
    // Find all pets owned by this user
    const userPets = await Pet.find({ ownerId: user._id });
    const userAdoptionPets = await AdoptionPet.find({ adopterUserId: user._id });
    
    // Also check for petshop pets if the model exists
    let userPetshopPets = [];
    if (PetshopPet) {
      userPetshopPets = await PetshopPet.find({ ownerId: user._id });
    }
    
    console.log(`📊 User has ${userPets.length} regular pets, ${userAdoptionPets.length} adoption pets, and ${userPetshopPets.length} petshop pets`);
    
    let processedCount = 0;
    
    // Process regular pets
    for (const pet of userPets) {
      if (pet.temporaryCareStatus?.inCare) {
        pet.temporaryCareStatus = {
          inCare: false,
          applicationId: null,
          centerId: null,
          startDate: null,
          expectedEndDate: null
        };
        pet.currentLocation = 'at_owner';
        await pet.save();
        console.log(`✅ Reset regular pet: ${pet.name} (${pet.petCode})`);
        processedCount++;
      }
    }
    
    // Process adoption pets
    for (const pet of userAdoptionPets) {
      if (pet.temporaryCareStatus?.inCare) {
        pet.temporaryCareStatus = {
          inCare: false,
          applicationId: null,
          centerId: null,
          startDate: null,
          expectedEndDate: null
        };
        await pet.save();
        console.log(`✅ Reset adoption pet: ${pet.name} (${pet.petCode})`);
        processedCount++;
      }
    }
    
    // Process petshop pets
    for (const pet of userPetshopPets) {
      if (pet.temporaryCareStatus?.inCare) {
        pet.temporaryCareStatus = {
          inCare: false,
          applicationId: null,
          centerId: null,
          startDate: null,
          expectedEndDate: null
        };
        pet.currentLocation = 'at_owner';
        await pet.save();
        console.log(`✅ Reset petshop pet: ${pet.name} (${pet.petCode})`);
        processedCount++;
      }
    }
    
    // Clean up any temporary care requests for this user
    const userRequests = await TemporaryCareRequest.deleteMany({ userId: user._id });
    console.log(`✅ Deleted ${userRequests.deletedCount} requests for user`);
    
    // Clean up any temporary care applications for this user
    const userApplications = await TemporaryCareApplication.deleteMany({ userId: user._id });
    console.log(`✅ Deleted ${userApplications.deletedCount} applications for user`);
    
    // Clean up any bookings for this user
    const userBookings = await CareBooking.deleteMany({ userId: user._id });
    console.log(`✅ Deleted ${userBookings.deletedCount} bookings for user`);
    
    // Clean up any payments for this user
    const userPayments = await TemporaryCarePayment.deleteMany({ userId: user._id });
    console.log(`✅ Deleted ${userPayments.deletedCount} payments for user`);
    
    // Clean up any temporary care records for this user
    const userTempCare = await TemporaryCare.deleteMany({ 'owner.userId': user._id });
    console.log(`✅ Deleted ${userTempCare.deletedCount} temporary care records for user`);
    
    console.log(`\n📊 Processed ${processedCount} pets for user ${email}`);
    return processedCount;
    
  } catch (error) {
    console.error(`❌ Error handling user ${email}:`, error.message);
    return 0;
  }
}

async function generateReport() {
  console.log('\n📊 STEP 5: Generating final report...\n');
  
  // Check remaining pets in temporary care
  const remainingPets = await Pet.countDocuments({ 'temporaryCareStatus.inCare': true });
  const remainingAdoptionPets = await AdoptionPet.countDocuments({ 'temporaryCareStatus.inCare': true });
  
  let remainingPetshopPets = 0;
  if (PetshopPet) {
    remainingPetshopPets = await PetshopPet.countDocuments({ 'temporaryCareStatus.inCare': true });
  }
  
  // Check remaining temporary care data
  const remainingRequests = await TemporaryCareRequest.countDocuments();
  const remainingApplications = await TemporaryCareApplication.countDocuments();
  const remainingBookings = await CareBooking.countDocuments();
  const remainingTempCare = await TemporaryCare.countDocuments();
  const remainingPayments = await TemporaryCarePayment.countDocuments();
  
  console.log('🎯 RESET SUMMARY:');
  console.log('================');
  console.log(`Remaining regular pets in temporary care: ${remainingPets}`);
  console.log(`Remaining adoption pets in temporary care: ${remainingAdoptionPets}`);
  console.log(`Remaining petshop pets in temporary care: ${remainingPetshopPets}`);
  console.log(`Remaining temporary care requests: ${remainingRequests}`);
  console.log(`Remaining temporary care applications: ${remainingApplications}`);
  console.log(`Remaining care bookings: ${remainingBookings}`);
  console.log(`Remaining temporary care records: ${remainingTempCare}`);
  console.log(`Remaining payments: ${remainingPayments}`);
  
  const isComplete = (
    remainingPets === 0 && 
    remainingAdoptionPets === 0 && 
    remainingPetshopPets === 0 &&
    remainingRequests === 0 &&
    remainingApplications === 0 &&
    remainingBookings === 0 && 
    remainingTempCare === 0 && 
    remainingPayments === 0
  );
  
  if (isComplete) {
    console.log('\n🎉 TEMPORARY CARE MODULE RESET COMPLETE!');
    console.log('All pets have been returned to their owners.');
    console.log('All temporary care data has been cleaned up.');
    console.log('Pet banners will now show their original status (Adopted/Purchased).');
  } else {
    console.log('\n⚠️  RESET INCOMPLETE - Some data remains');
    console.log('Please check the remaining items above.');
  }
  
  return isComplete;
}

async function main() {
  console.log('🚀 TEMPORARY CARE MODULE RESET SCRIPT');
  console.log('=====================================');
  console.log('This script will:');
  console.log('• Find all pets currently in temporary care (regular, adoption, petshop)');
  console.log('• Return pets to their original owners');
  console.log('• Remove temporary care banners and "in care" status');
  console.log('• Restore pet location to "at_owner"');
  console.log('• Clean up all temporary care applications and bookings');
  console.log('• Remove all temporary care payments');
  console.log('• Handle specific user: albinjiji17@gmail.com');
  console.log('• Reset the entire temporary care module');
  console.log('• Restore original pet tags (Adopted/Purchased)');
  console.log('=====================================\n');
  
  try {
    await connectDB();
    
    // Step 1: Find pets in temporary care
    await findPetsInTemporaryCare();
    
    // Step 2: Restore pet ownership
    await restorePetOwnership();
    
    // Step 3: Clean up temporary care data
    await cleanupTemporaryCareData();
    
    // Step 4: Handle specific user
    await handleSpecificUser('albinjiji17@gmail.com');
    
    // Step 5: Generate final report
    const isComplete = await generateReport();
    
    if (isComplete) {
      console.log('\n✅ Script completed successfully!');
      console.log('🏠 All pets are now back with their owners');
      console.log('🏷️  Pet cards will show original tags (Adopted/Purchased)');
      console.log('📍 Pet location is set to "at_owner"');
      process.exit(0);
    } else {
      console.log('\n⚠️  Script completed with warnings. Please review the report above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Script failed with error:', error);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('📡 Database connection closed');
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  connectDB,
  findPetsInTemporaryCare,
  restorePetOwnership,
  cleanupTemporaryCareData,
  handleSpecificUser,
  generateReport,
  main
};