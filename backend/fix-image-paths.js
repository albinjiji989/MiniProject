const mongoose = require('mongoose');
const path = require('path');

// Connect to database
const connectDB = require('./core/db');
connectDB();

// Import Image model
const Image = require('./core/models/Image');

// Function to fix image paths
async function fixImagePaths() {
  try {
    console.log('Finding images with incorrect paths...');
    
    // Find images with old path pattern
    const images = await Image.find({
      entityType: 'PetInventoryItem',
      url: /^\/modules\/petshop\/uploads\//
    });
    
    console.log(`Found ${images.length} images with old paths`);
    
    // Update each image path
    for (const image of images) {
      // Replace old path with new path
      const oldUrl = image.url;
      const newUrl = oldUrl.replace('/modules/petshop/uploads/', '/uploads/petshop/manager/pets/');
      
      console.log(`Updating image ${image._id}: ${oldUrl} -> ${newUrl}`);
      
      // Update the image record
      await Image.findByIdAndUpdate(image._id, { url: newUrl });
    }
    
    console.log('Image paths updated successfully!');
    
    // Also check for any images with the wrong relative path
    const wrongPathImages = await Image.find({
      entityType: 'PetInventoryItem',
      url: /^\.\.\/uploads\/petshop\/manager\/pets\//
    });
    
    console.log(`Found ${wrongPathImages.length} images with wrong relative paths`);
    
    for (const image of wrongPathImages) {
      const oldUrl = image.url;
      const newUrl = oldUrl.replace('../uploads/petshop/manager/pets/', '/uploads/petshop/manager/pets/');
      
      console.log(`Updating image ${image._id}: ${oldUrl} -> ${newUrl}`);
      
      // Update the image record
      await Image.findByIdAndUpdate(image._id, { url: newUrl });
    }
    
    console.log('All image paths fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing image paths:', error);
    process.exit(1);
  }
}

// Run the function
fixImagePaths();