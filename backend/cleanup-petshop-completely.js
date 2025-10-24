const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import models
const PetInventoryItem = require('./modules/petshop/manager/models/PetInventoryItem');
const PetReservation = require('./modules/petshop/user/models/PetReservation');
const PetShop = require('./modules/petshop/manager/models/PetShop');
const Wishlist = require('./modules/petshop/user/models/Wishlist');
const Review = require('./modules/petshop/user/models/Review');
const ShopOrder = require('./modules/petshop/user/models/ShopOrder');
const InventoryItem = require('./modules/petshop/manager/models/InventoryItem');
const Promotion = require('./modules/petshop/manager/models/Promotion');
const PurchaseOrder = require('./modules/petshop/manager/models/PurchaseOrder');
const PetShopService = require('./modules/petshop/manager/models/Service');
const Image = require('./core/models/Image');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petcare');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Delete all petshop inventory items
const deleteAllPetInventoryItems = async () => {
  try {
    const result = await PetInventoryItem.deleteMany({});
    console.log(`Deleted ${result.deletedCount} pet inventory items`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting pet inventory items:', error);
    throw error;
  }
};

// Delete all pet shops
const deleteAllPetShops = async () => {
  try {
    const result = await PetShop.deleteMany({});
    console.log(`Deleted ${result.deletedCount} pet shops`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting pet shops:', error);
    throw error;
  }
};

// Delete all pet shop wishlists
const deleteAllWishlists = async () => {
  try {
    const result = await Wishlist.deleteMany({});
    console.log(`Deleted ${result.deletedCount} wishlist items`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting wishlist items:', error);
    throw error;
  }
};

// Delete all pet shop reviews
const deleteAllReviews = async () => {
  try {
    const result = await Review.deleteMany({});
    console.log(`Deleted ${result.deletedCount} reviews`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting reviews:', error);
    throw error;
  }
};

// Delete all shop orders
const deleteAllShopOrders = async () => {
  try {
    const result = await ShopOrder.deleteMany({});
    console.log(`Deleted ${result.deletedCount} shop orders`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting shop orders:', error);
    throw error;
  }
};

// Delete all inventory items
const deleteAllInventoryItems = async () => {
  try {
    const result = await InventoryItem.deleteMany({});
    console.log(`Deleted ${result.deletedCount} inventory items`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting inventory items:', error);
    throw error;
  }
};

// Delete all promotions
const deleteAllPromotions = async () => {
  try {
    const result = await Promotion.deleteMany({});
    console.log(`Deleted ${result.deletedCount} promotions`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting promotions:', error);
    throw error;
  }
};

// Delete all purchase orders
const deleteAllPurchaseOrders = async () => {
  try {
    const result = await PurchaseOrder.deleteMany({});
    console.log(`Deleted ${result.deletedCount} purchase orders`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting purchase orders:', error);
    throw error;
  }
};

// Delete all pet shop services
const deleteAllPetShopServices = async () => {
  try {
    const result = await PetShopService.deleteMany({});
    console.log(`Deleted ${result.deletedCount} pet shop services`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting pet shop services:', error);
    throw error;
  }
};

// Delete all pet reservations
const deleteAllPetReservations = async () => {
  try {
    const result = await PetReservation.deleteMany({});
    console.log(`Deleted ${result.deletedCount} pet reservations`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting pet reservations:', error);
    throw error;
  }
};

// Delete all images associated with petshop items
const deleteAllPetShopImages = async () => {
  try {
    // Find all images associated with petshop entities
    const images = await Image.find({
      $or: [
        { entityType: 'PetInventoryItem' },
        { module: 'petshop' }
      ]
    });
    
    console.log(`Found ${images.length} petshop-related images`);
    
    // Delete image documents from database
    const result = await Image.deleteMany({
      $or: [
        { entityType: 'PetInventoryItem' },
        { module: 'petshop' }
      ]
    });
    
    console.log(`Deleted ${result.deletedCount} petshop-related image documents`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting petshop images:', error);
    throw error;
  }
};

// Delete all files in the petshop uploads directory
const deleteAllPetShopUploads = async (uploadsDir) => {
  try {
    const petshopDir = path.join(uploadsDir, 'petshop');
    
    // Check if directory exists
    try {
      await fs.access(petshopDir);
    } catch (error) {
      console.log('Petshop uploads directory does not exist');
      return 0;
    }
    
    // Read all subdirectories
    const subDirs = await fs.readdir(petshopDir);
    let totalFilesDeleted = 0;
    
    for (const subDir of subDirs) {
      const fullPath = path.join(petshopDir, subDir);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively delete all files in subdirectory
        const files = await fs.readdir(fullPath);
        for (const file of files) {
          const filePath = path.join(fullPath, file);
          try {
            await fs.unlink(filePath);
            console.log(`Deleted file: ${filePath}`);
            totalFilesDeleted++;
          } catch (error) {
            console.error(`Error deleting file ${filePath}:`, error);
          }
        }
        
        // Also delete subdirectories that might exist within these
        try {
          const subSubDirs = await fs.readdir(fullPath);
          for (const subSubDir of subSubDirs) {
            const subSubPath = path.join(fullPath, subSubDir);
            const subStat = await fs.stat(subSubPath);
            if (subStat.isDirectory()) {
              const subFiles = await fs.readdir(subSubPath);
              for (const subFile of subFiles) {
                const subFilePath = path.join(subSubPath, subFile);
                try {
                  await fs.unlink(subFilePath);
                  console.log(`Deleted file: ${subFilePath}`);
                  totalFilesDeleted++;
                } catch (error) {
                  console.error(`Error deleting file ${subFilePath}:`, error);
                }
              }
              
              // Remove empty directory
              try {
                await fs.rmdir(subSubPath);
                console.log(`Deleted directory: ${subSubPath}`);
              } catch (error) {
                console.error(`Error deleting directory ${subSubPath}:`, error);
              }
            }
          }
        } catch (error) {
          // Directory might not exist, continue
        }
      }
    }
    
    console.log(`Deleted ${totalFilesDeleted} files from petshop uploads directory`);
    return totalFilesDeleted;
  } catch (error) {
    console.error('Error deleting petshop uploads:', error);
    throw error;
  }
};

// Main cleanup function
const cleanupPetShopData = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Starting complete petshop data cleanup...');
    
    // 1. Delete all pet inventory items
    await deleteAllPetInventoryItems();
    
    // 2. Delete all pet shops
    await deleteAllPetShops();
    
    // 3. Delete all pet reservations
    await deleteAllPetReservations();
    
    // 4. Delete all wishlists
    await deleteAllWishlists();
    
    // 5. Delete all reviews
    await deleteAllReviews();
    
    // 6. Delete all shop orders
    await deleteAllShopOrders();
    
    // 7. Delete all inventory items
    await deleteAllInventoryItems();
    
    // 8. Delete all promotions
    await deleteAllPromotions();
    
    // 9. Delete all purchase orders
    await deleteAllPurchaseOrders();
    
    // 10. Delete all pet shop services
    await deleteAllPetShopServices();
    
    // 11. Delete all petshop-related images
    await deleteAllPetShopImages();
    
    // 12. Delete all files in petshop uploads directory
    const uploadsDir = path.join(__dirname, 'uploads');
    await deleteAllPetShopUploads(uploadsDir);
    
    console.log('✅ Complete petshop data cleanup finished successfully!');
    
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
  cleanupPetShopData();
}

module.exports = {
  cleanupPetShopData,
  deleteAllPetInventoryItems,
  deleteAllPetShops,
  deleteAllPetReservations,
  deleteAllWishlists,
  deleteAllReviews,
  deleteAllShopOrders,
  deleteAllInventoryItems,
  deleteAllPromotions,
  deleteAllPurchaseOrders,
  deleteAllPetShopServices,
  deleteAllPetShopImages,
  deleteAllPetShopUploads
};