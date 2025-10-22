const mongoose = require('mongoose');
require('dotenv').config();

// Import all pet-related models
const PetNew = require('../core/models/PetNew');
const Pet = require('../core/models/Pet');
const PetDetails = require('../core/models/PetDetails');
const PetRegistry = require('../core/models/PetRegistry');
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
const PetInventoryItem = require('../modules/petshop/manager/models/PetInventoryItem');
const Image = require('../core/models/Image');
const Document = require('../core/models/Document');
const OwnershipHistory = require('../core/models/OwnershipHistory');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petwelfare');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const deleteAllPets = async () => {
  try {
    console.log('\n🗑️  Starting deletion of ALL pets and related data...\n');

    // Delete all user-added pets (PetNew)
    const petNewResult = await PetNew.deleteMany({});
    console.log(`✅ Deleted ${petNewResult.deletedCount} user-added pets (PetNew)`);

    // Delete all legacy pets (Pet)
    const petResult = await Pet.deleteMany({});
    console.log(`✅ Deleted ${petResult.deletedCount} legacy pets (Pet)`);

    // Delete all adoption pets
    const adoptionPetResult = await AdoptionPet.deleteMany({});
    console.log(`✅ Deleted ${adoptionPetResult.deletedCount} adoption pets (AdoptionPet)`);

    // Delete all petshop inventory items
    const petshopResult = await PetInventoryItem.deleteMany({});
    console.log(`✅ Deleted ${petshopResult.deletedCount} petshop pets (PetInventoryItem)`);

    // Delete all pet details
    const petDetailsResult = await PetDetails.deleteMany({});
    console.log(`✅ Deleted ${petDetailsResult.deletedCount} pet details (PetDetails)`);

    // Delete all pet registry entries
    const registryResult = await PetRegistry.deleteMany({});
    console.log(`✅ Deleted ${registryResult.deletedCount} pet registry entries (PetRegistry)`);

    // Delete all pet-related images
    const imageResult = await Image.deleteMany({
      entityType: { $in: ['Pet', 'PetNew', 'AdoptionPet', 'PetInventoryItem'] }
    });
    console.log(`✅ Deleted ${imageResult.deletedCount} pet images (Image)`);

    // Delete all pet-related documents
    const documentResult = await Document.deleteMany({
      entityType: { $in: ['Pet', 'PetNew', 'AdoptionPet', 'PetInventoryItem'] }
    });
    console.log(`✅ Deleted ${documentResult.deletedCount} pet documents (Document)`);

    // Delete all ownership history records
    const ownershipResult = await OwnershipHistory.deleteMany({});
    console.log(`✅ Deleted ${ownershipResult.deletedCount} ownership history records (OwnershipHistory)`);

    console.log('\n✨ All pets and related data have been successfully deleted from the database!\n');

    // Summary
    const total = 
      petNewResult.deletedCount + 
      petResult.deletedCount + 
      adoptionPetResult.deletedCount + 
      petshopResult.deletedCount + 
      petDetailsResult.deletedCount + 
      registryResult.deletedCount + 
      imageResult.deletedCount + 
      documentResult.deletedCount + 
      ownershipResult.deletedCount;

    console.log(`📊 Total records deleted: ${total}`);
    console.log('\n✅ Database cleanup completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during deletion:', error);
    throw error;
  }
};

const main = async () => {
  try {
    // Connect to database
    await connectDB();

    // Confirm deletion
    console.log('\n⚠️  WARNING: This will DELETE ALL PETS from the database!');
    console.log('   - User-added pets (PetNew)');
    console.log('   - Legacy pets (Pet)');
    console.log('   - Adoption pets (AdoptionPet)');
    console.log('   - Petshop pets (PetInventoryItem)');
    console.log('   - Pet details (PetDetails)');
    console.log('   - Pet registry (PetRegistry)');
    console.log('   - Related images and documents');
    console.log('   - Ownership history\n');

    // Execute deletion
    await deleteAllPets();

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
main();
