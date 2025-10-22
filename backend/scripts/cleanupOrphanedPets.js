const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Connect to database
const connectDB = require('../core/db');
connectDB();

// Import models
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
const Image = require('../core/models/Image');
const Document = require('../core/models/Document');

async function cleanupOrphanedPets() {
  console.log('\n🧹 CLEANING UP ORPHANED PETS\n');
  
  try {
    // Find all inactive pets
    const inactivePets = await AdoptionPet.find({ isActive: false })
      .select('_id name status petCode createdAt');
    
    console.log(`Found ${inactivePets.length} inactive pets:`);
    inactivePets.forEach(pet => {
      console.log(`  - ${pet.name} (${pet.petCode}) - ${pet.status} - Created: ${pet.createdAt.toISOString()}`);
    });
    
    if (inactivePets.length === 0) {
      console.log('No inactive pets found. Database is clean.');
      return;
    }
    
    // Ask user if they want to delete these pets
    console.log('\nWould you like to permanently delete these inactive pets? (y/N)');
    
    // For now, we'll just show what would be deleted
    console.log('\n📋 DRY RUN - These pets would be permanently deleted:');
    
    for (const pet of inactivePets) {
      console.log(`\n🗑️  Deleting pet: ${pet.name} (${pet.petCode})`);
      
      // Show associated media
      const images = await Image.find({ entityId: pet._id });
      const documents = await Document.find({ entityId: pet._id });
      
      console.log(`   Images: ${images.length}`);
      console.log(`   Documents: ${documents.length}`);
      
      // In a real implementation, we would call our delete function here
      // await petController.deletePet({ params: { id: pet._id } }, res);
    }
    
    console.log('\n✅ Cleanup analysis complete. No changes were made to the database.');
    console.log('To actually delete these pets, you would need to:');
    console.log('1. Implement a confirmation mechanism');
    console.log('2. Call the deletePet function for each pet');
    console.log('3. Or use the adoption manager UI to delete them');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
}

cleanupOrphanedPets();