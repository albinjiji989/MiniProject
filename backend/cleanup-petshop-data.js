require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

// Connect to database
const connectDB = require('./core/db');
connectDB();

// Import models
const PetInventoryItem = require('./modules/petshop/manager/models/PetInventoryItem');
const Image = require('./core/models/Image');
const Document = require('./core/models/Document');

// Function to delete all petshop-related data
async function cleanupPetshopData() {
  try {
    console.log('Starting cleanup of petshop data...');
    
    // 1. Delete all PetInventoryItem documents
    const deletedInventoryItems = await PetInventoryItem.deleteMany({});
    console.log(`Deleted ${deletedInventoryItems.deletedCount} PetInventoryItem documents`);
    
    // 2. Delete all Image documents related to PetInventoryItem
    const deletedImages = await Image.deleteMany({ entityType: 'PetInventoryItem' });
    console.log(`Deleted ${deletedImages.deletedCount} Image documents`);
    
    // 3. Delete all Document documents related to PetInventoryItem
    const deletedDocuments = await Document.deleteMany({ entityType: 'PetInventoryItem' });
    console.log(`Deleted ${deletedDocuments.deletedCount} Document documents`);
    
    // 4. Delete image files from the filesystem
    const imagesDir = path.join(__dirname, 'uploads', 'petshop', 'manager', 'pets');
    try {
      const files = await fs.readdir(imagesDir);
      console.log(`Found ${files.length} files in ${imagesDir}`);
      
      for (const file of files) {
        const filePath = path.join(imagesDir, file);
        await fs.unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
      console.log('All image files deleted successfully');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('Images directory does not exist, nothing to delete');
      } else {
        console.error('Error deleting image files:', error);
      }
    }
    
    console.log('Petshop data cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the function
cleanupPetshopData();
