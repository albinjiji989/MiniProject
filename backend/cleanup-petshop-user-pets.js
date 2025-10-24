require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Add the backend directory to the module path
const backendDir = path.join(__dirname);
const coreModelsDir = path.join(backendDir, 'core', 'models');
const petshopModelsDir = path.join(backendDir, 'modules', 'petshop', 'manager', 'models');

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petcare');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Import models with correct paths
const Pet = require('./core/models/Pet');
const PetNew = require('./core/models/PetNew');
const PetRegistry = require('./core/models/PetRegistry');

// Delete all pets that were purchased from petshop
const deletePetShopUserPets = async () => {
  try {
    console.log('Starting deletion of petshop user pets...');
    
    // Find all pets in registry that came from petshop
    const petshopRegistryPets = await PetRegistry.find({ source: 'petshop' });
    console.log(`Found ${petshopRegistryPets.length} pets in registry with petshop source`);
    
    let deletedCount = 0;
    
    // For each petshop pet in registry, delete the corresponding user pet
    for (const registryPet of petshopRegistryPets) {
      console.log(`Processing pet with code: ${registryPet.petCode}`);
      
      // Delete from Pet model (if exists)
      const petResult = await Pet.deleteMany({ petCode: registryPet.petCode });
      console.log(`  Deleted ${petResult.deletedCount} pets from Pet model with code ${registryPet.petCode}`);
      
      // Delete from PetNew model (if exists)
      const petNewResult = await PetNew.deleteMany({ petCode: registryPet.petCode });
      console.log(`  Deleted ${petNewResult.deletedCount} pets from PetNew model with code ${registryPet.petCode}`);
      
      deletedCount += petResult.deletedCount + petNewResult.deletedCount;
    }
    
    // Also delete all registry entries for petshop pets
    const registryResult = await PetRegistry.deleteMany({ source: 'petshop' });
    console.log(`Deleted ${registryResult.deletedCount} petshop entries from registry`);
    
    return deletedCount;
  } catch (error) {
    console.error('Error deleting petshop user pets:', error);
    throw error;
  }
};

// Main cleanup function
const cleanupPetShopUserPets = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🚀 Starting petshop user pets cleanup...');
    console.log('====================================');
    
    // Delete all petshop user pets
    const deletedCount = await deletePetShopUserPets();
    
    console.log('====================================');
    console.log(`✅ Petshop user pets cleanup completed. Deleted ${deletedCount} pets.`);
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
};

// Run the cleanup
if (require.main === module) {
  cleanupPetShopUserPets();
}

module.exports = {
  cleanupPetShopUserPets,
  deletePetShopUserPets
};