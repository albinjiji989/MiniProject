const mongoose = require('mongoose');
require('dotenv').config();

// Import all models that might contain pet data (with error handling)
const Pet = require('./core/models/Pet');
const PetRegistry = require('./core/models/PetRegistry');
const PetDetails = require('./core/models/PetDetails');
const PetHistory = require('./core/models/PetHistory');
const PetChangeLog = require('./core/models/PetChangeLog');
const PetCode = require('./core/models/PetCode');
const PetAgeTracker = require('./core/models/PetAgeTracker');
const Image = require('./core/models/Image');
const Document = require('./core/models/Document');
const BlockchainBlock = require('./core/models/BlockchainBlock');
const OwnershipHistory = require('./core/models/OwnershipHistory');
const MedicalRecord = require('./core/models/MedicalRecord');
const Activity = require('./core/models/Activity');

// Import module-specific models (with error handling)
let AdoptionPet, PetInventoryItem, PetBatch, VeterinaryAppointment, VeterinaryMedicalRecord;

try {
  AdoptionPet = require('./modules/adoption/manager/models/AdoptionPet');
} catch (e) {
  console.warn('⚠️ AdoptionPet model not found, skipping...');
}

try {
  PetInventoryItem = require('./modules/petshop/manager/models/PetInventoryItem');
} catch (e) {
  console.warn('⚠️ PetInventoryItem model not found, skipping...');
}

try {
  PetBatch = require('./modules/petshop/manager/models/PetBatch');
} catch (e) {
  console.warn('⚠️ PetBatch model not found, skipping...');
}

try {
  VeterinaryAppointment = require('./modules/veterinary/models/VeterinaryAppointment');
} catch (e) {
  console.warn('⚠️ VeterinaryAppointment model not found, skipping...');
}

try {
  VeterinaryMedicalRecord = require('./modules/veterinary/models/VeterinaryMedicalRecord');
} catch (e) {
  console.warn('⚠️ VeterinaryMedicalRecord model not found, skipping...');
}

const PET_CODE_TO_DELETE = 'TGV34152';

async function deletePetByCode(petCode) {
  try {
    console.log(`🗑️ Starting deletion process for pet with code: ${petCode}`);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petcare');
    console.log('✅ Connected to MongoDB');

    let deletionResults = {
      petRegistry: 0,
      pets: 0,
      petDetails: 0,
      petHistory: 0,
      petChangeLog: 0,
      petCodes: 0,
      petAgeTracker: 0,
      images: 0,
      documents: 0,
      blockchainBlocks: 0,
      ownershipHistory: 0,
      medicalRecords: 0,
      veterinaryMedicalRecords: 0,
      activities: 0,
      adoptionPets: 0,
      petInventoryItems: 0,
      petBatches: 0,
      veterinaryAppointments: 0
    };

    // 1. Find the pet in PetRegistry first to get all related IDs
    console.log('\n📋 Step 1: Finding pet in PetRegistry...');
    const registryEntry = await PetRegistry.findOne({ petCode });
    if (registryEntry) {
      console.log(`✅ Found pet in registry: ${registryEntry.name} (ID: ${registryEntry._id})`);
      console.log(`   Owner: ${registryEntry.currentOwnerId}`);
      console.log(`   Source: ${registryEntry.source}`);
      console.log(`   Image IDs: ${registryEntry.imageIds?.length || 0}`);
    } else {
      console.log('⚠️ Pet not found in PetRegistry');
    }
    // 2. Delete from Images collection (using imageIds from registry)
    console.log('\n🖼️ Step 2: Deleting images...');
    if (registryEntry?.imageIds?.length > 0) {
      const imageDeleteResult = await Image.deleteMany({ 
        _id: { $in: registryEntry.imageIds } 
      });
      deletionResults.images = imageDeleteResult.deletedCount;
      console.log(`✅ Deleted ${imageDeleteResult.deletedCount} images`);
    }

    // Also delete images that might reference this pet by petCode
    const imagesByPetCode = await Image.deleteMany({ 
      $or: [
        { 'metadata.petCode': petCode },
        { 'relatedTo.petCode': petCode },
        { caption: { $regex: petCode, $options: 'i' } }
      ]
    });
    deletionResults.images += imagesByPetCode.deletedCount;
    console.log(`✅ Deleted ${imagesByPetCode.deletedCount} additional images by petCode reference`);

    // 3. Delete from Documents collection
    console.log('\n📄 Step 3: Deleting documents...');
    const documentDeleteResult = await Document.deleteMany({
      $or: [
        { petId: registryEntry?._id },
        { 'metadata.petCode': petCode },
        { 'relatedTo.petCode': petCode }
      ]
    });
    deletionResults.documents = documentDeleteResult.deletedCount;
    console.log(`✅ Deleted ${documentDeleteResult.deletedCount} documents`);

    // 4. Delete from Blockchain blocks
    console.log('\n⛓️ Step 4: Deleting blockchain records...');
    const blockchainDeleteResult = await BlockchainBlock.deleteMany({
      $or: [
        { 'data.petId': registryEntry?._id },
        { 'data.petCode': petCode },
        { 'transactionData.petCode': petCode },
        { 'blockData.petCode': petCode }
      ]
    });
    deletionResults.blockchainBlocks = blockchainDeleteResult.deletedCount;
    console.log(`✅ Deleted ${blockchainDeleteResult.deletedCount} blockchain blocks`);

    // 5. Delete from OwnershipHistory
    console.log('\n👥 Step 5: Deleting ownership history...');
    const ownershipDeleteResult = await OwnershipHistory.deleteMany({
      $or: [
        { petId: registryEntry?._id },
        { petCode: petCode }
      ]
    });
    deletionResults.ownershipHistory = ownershipDeleteResult.deletedCount;
    console.log(`✅ Deleted ${ownershipDeleteResult.deletedCount} ownership history records`);

    // 6. Delete from MedicalRecords
    console.log('\n🏥 Step 6: Deleting medical records...');
    const medicalDeleteResult = await MedicalRecord.deleteMany({
      $or: [
        { petId: registryEntry?._id },
        { petCode: petCode }
      ]
    });
    deletionResults.medicalRecords = medicalDeleteResult.deletedCount;
    console.log(`✅ Deleted ${medicalDeleteResult.deletedCount} medical records`);

    // Delete from VeterinaryMedicalRecord if available
    if (VeterinaryMedicalRecord) {
      const vetMedicalDeleteResult = await VeterinaryMedicalRecord.deleteMany({
        $or: [
          { petId: registryEntry?._id },
          { petCode: petCode }
        ]
      });
      deletionResults.veterinaryMedicalRecords = vetMedicalDeleteResult.deletedCount;
      console.log(`✅ Deleted ${vetMedicalDeleteResult.deletedCount} veterinary medical records`);
    }

    // 7. Delete from Activities
    console.log('\n📊 Step 7: Deleting activities...');
    const activityDeleteResult = await Activity.deleteMany({
      $or: [
        { 'relatedTo.petId': registryEntry?._id },
        { 'relatedTo.petCode': petCode },
        { 'metadata.petCode': petCode },
        { description: { $regex: petCode, $options: 'i' } }
      ]
    });
    deletionResults.activities = activityDeleteResult.deletedCount;
    console.log(`✅ Deleted ${activityDeleteResult.deletedCount} activity records`);
    // 8. Delete from Veterinary Appointments
    console.log('\n🩺 Step 8: Deleting veterinary appointments...');
    if (VeterinaryAppointment) {
      const vetAppointmentDeleteResult = await VeterinaryAppointment.deleteMany({
        $or: [
          { petId: registryEntry?._id },
          { petCode: petCode },
          { 'petDetails.petCode': petCode }
        ]
      });
      deletionResults.veterinaryAppointments = vetAppointmentDeleteResult.deletedCount;
      console.log(`✅ Deleted ${vetAppointmentDeleteResult.deletedCount} veterinary appointments`);
    } else {
      console.log('⚠️ VeterinaryAppointment model not available, skipping...');
    }

    // 9. Delete from Core Pet models
    console.log('\n🐾 Step 9: Deleting from core pet models...');
    
    // Pet model
    const petDeleteResult = await Pet.deleteMany({ petCode });
    deletionResults.pets = petDeleteResult.deletedCount;
    console.log(`✅ Deleted ${petDeleteResult.deletedCount} pets from Pet collection`);

    // PetDetails
    const petDetailsDeleteResult = await PetDetails.deleteMany({
      $or: [
        { petId: registryEntry?._id },
        { petCode: petCode }
      ]
    });
    deletionResults.petDetails = petDetailsDeleteResult.deletedCount;
    console.log(`✅ Deleted ${petDetailsDeleteResult.deletedCount} pet details`);

    // PetHistory
    const petHistoryDeleteResult = await PetHistory.deleteMany({
      $or: [
        { petId: registryEntry?._id },
        { petCode: petCode }
      ]
    });
    deletionResults.petHistory = petHistoryDeleteResult.deletedCount;
    console.log(`✅ Deleted ${petHistoryDeleteResult.deletedCount} pet history records`);

    // PetChangeLog
    const petChangeLogDeleteResult = await PetChangeLog.deleteMany({
      $or: [
        { petId: registryEntry?._id },
        { petCode: petCode },
        { 'changes.petCode': petCode }
      ]
    });
    deletionResults.petChangeLog = petChangeLogDeleteResult.deletedCount;
    console.log(`✅ Deleted ${petChangeLogDeleteResult.deletedCount} pet change log entries`);

    // PetCode
    const petCodeDeleteResult = await PetCode.deleteMany({ code: petCode });
    deletionResults.petCodes = petCodeDeleteResult.deletedCount;
    console.log(`✅ Deleted ${petCodeDeleteResult.deletedCount} pet code entries`);

    // PetAgeTracker
    const petAgeTrackerDeleteResult = await PetAgeTracker.deleteMany({
      $or: [
        { petId: registryEntry?._id },
        { petCode: petCode }
      ]
    });
    deletionResults.petAgeTracker = petAgeTrackerDeleteResult.deletedCount;
    console.log(`✅ Deleted ${petAgeTrackerDeleteResult.deletedCount} pet age tracker entries`);
    // 10. Delete from Module-specific models
    console.log('\n📦 Step 10: Deleting from module-specific models...');

    // AdoptionPet
    if (AdoptionPet) {
      const adoptionPetDeleteResult = await AdoptionPet.deleteMany({ petCode });
      deletionResults.adoptionPets = adoptionPetDeleteResult.deletedCount;
      console.log(`✅ Deleted ${adoptionPetDeleteResult.deletedCount} adoption pets`);
    } else {
      console.log('⚠️ AdoptionPet model not available, skipping...');
    }

    // PetInventoryItem
    if (PetInventoryItem) {
      const petInventoryDeleteResult = await PetInventoryItem.deleteMany({ petCode });
      deletionResults.petInventoryItems = petInventoryDeleteResult.deletedCount;
      console.log(`✅ Deleted ${petInventoryDeleteResult.deletedCount} pet inventory items`);
    } else {
      console.log('⚠️ PetInventoryItem model not available, skipping...');
    }

    // Remove from PetBatch samplePets array
    if (PetBatch) {
      const petBatchUpdateResult = await PetBatch.updateMany(
        { 'samplePets.petCode': petCode },
        { $pull: { samplePets: { petCode: petCode } } }
      );
      console.log(`✅ Removed pet from ${petBatchUpdateResult.modifiedCount} pet batches`);

      // Delete empty batches if this was the only pet
      const emptyBatchDeleteResult = await PetBatch.deleteMany({ 
        samplePets: { $size: 0 } 
      });
      deletionResults.petBatches = emptyBatchDeleteResult.deletedCount;
      console.log(`✅ Deleted ${emptyBatchDeleteResult.deletedCount} empty pet batches`);
    } else {
      console.log('⚠️ PetBatch model not available, skipping...');
    }

    // 11. Finally, delete from PetRegistry (this should be last)
    console.log('\n📋 Step 11: Deleting from PetRegistry...');
    const registryDeleteResult = await PetRegistry.deleteMany({ petCode });
    deletionResults.petRegistry = registryDeleteResult.deletedCount;
    console.log(`✅ Deleted ${registryDeleteResult.deletedCount} pet registry entries`);

    // 12. Summary
    console.log('\n📊 DELETION SUMMARY:');
    console.log('='.repeat(50));
    Object.entries(deletionResults).forEach(([collection, count]) => {
      if (count > 0) {
        console.log(`✅ ${collection}: ${count} records deleted`);
      }
    });

    const totalDeleted = Object.values(deletionResults).reduce((sum, count) => sum + count, 0);
    console.log('='.repeat(50));
    console.log(`🗑️ TOTAL RECORDS DELETED: ${totalDeleted}`);
    console.log(`✅ Pet with code "${petCode}" has been completely removed from the system`);

    return deletionResults;

  } catch (error) {
    console.error('❌ Error during deletion process:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Execute the deletion
if (require.main === module) {
  deletePetByCode(PET_CODE_TO_DELETE)
    .then((results) => {
      console.log('\n🎉 Deletion process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Deletion process failed:', error);
      process.exit(1);
    });
}

module.exports = { deletePetByCode };