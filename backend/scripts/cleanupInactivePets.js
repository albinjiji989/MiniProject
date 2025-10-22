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

async function cleanupInactivePets() {
  console.log('\n🧹 CLEANING UP INACTIVE PETS\n');
  
  try {
    // Find all inactive pets
    const inactivePets = await AdoptionPet.find({ isActive: false })
      .select('_id name status petCode createdAt');
    
    console.log(`Found ${inactivePets.length} inactive pets:`);
    inactivePets.forEach((pet, index) => {
      console.log(`${index + 1}. ${pet.name} (${pet.petCode}) - ${pet.status} - Created: ${pet.createdAt.toISOString().split('T')[0]}`);
    });
    
    if (inactivePets.length === 0) {
      console.log('No inactive pets found. Database is already clean.');
      return;
    }
    
    console.log(`\n🗑️  PERMANENTLY DELETING ${inactivePets.length} INACTIVE PETS...\n`);
    
    let deletedCount = 0;
    
    // Delete each inactive pet completely
    for (const pet of inactivePets) {
      try {
        console.log(`Deleting pet: ${pet.name} (${pet.petCode})`);
        
        // Find the full pet document to get media references
        const fullPet = await AdoptionPet.findById(pet._id);
        if (!fullPet) {
          console.log(`  Pet not found, skipping...`);
          continue;
        }
        
        // Delete associated images from filesystem and database
        if (fullPet.imageIds && fullPet.imageIds.length > 0) {
          const images = await Image.find({ _id: { $in: fullPet.imageIds } });
          console.log(`  Deleting ${images.length} images...`);
          
          for (const image of images) {
            // Try to delete file from filesystem
            if (image.url) {
              try {
                const fs = require('fs').promises;
                const filePath = path.join(__dirname, '..', '..', image.url);
                await fs.unlink(filePath);
                console.log(`    Deleted file: ${image.url}`);
              } catch (fileErr) {
                console.log(`    File not found or already deleted: ${image.url}`);
              }
            }
          }
          
          // Delete image records from database
          await Image.deleteMany({ _id: { $in: fullPet.imageIds } });
        }
        
        // Delete associated documents from filesystem and database
        if (fullPet.documentIds && fullPet.documentIds.length > 0) {
          const documents = await Document.find({ _id: { $in: fullPet.documentIds } });
          console.log(`  Deleting ${documents.length} documents...`);
          
          for (const document of documents) {
            // Try to delete file from filesystem
            if (document.url) {
              try {
                const fs = require('fs').promises;
                const filePath = path.join(__dirname, '..', '..', document.url);
                await fs.unlink(filePath);
                console.log(`    Deleted file: ${document.url}`);
              } catch (fileErr) {
                console.log(`    File not found or already deleted: ${document.url}`);
              }
            }
          }
          
          // Delete document records from database
          await Document.deleteMany({ _id: { $in: fullPet.documentIds } });
        }
        
        // Delete the pet from database
        await AdoptionPet.findByIdAndDelete(pet._id);
        console.log(`  ✅ Pet deleted successfully\n`);
        deletedCount++;
      } catch (error) {
        console.error(`  ❌ Error deleting pet ${pet.name}:`, error.message);
      }
    }
    
    console.log(`\n✅ CLEANUP COMPLETE: ${deletedCount} of ${inactivePets.length} inactive pets permanently deleted`);
    console.log('These pets will no longer appear in adoption listings or cause confusion.');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the cleanup
cleanupInactivePets();