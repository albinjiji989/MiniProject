const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const PetInventoryItem = require('./modules/petshop/manager/models/PetInventoryItem');
const PetShop = require('./modules/petshop/manager/models/PetShop');
const PetReservation = require('./modules/petshop/user/models/PetReservation');
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
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const verifyCleanup = async () => {
  try {
    await connectDB();
    
    // Check pet inventory items
    const petCount = await PetInventoryItem.countDocuments();
    console.log(`Pet inventory items remaining: ${petCount}`);
    
    // Check pet shops
    const petShopCount = await PetShop.countDocuments();
    console.log(`Pet shops remaining: ${petShopCount}`);
    
    // Check pet reservations
    const reservationCount = await PetReservation.countDocuments();
    console.log(`Pet reservations remaining: ${reservationCount}`);
    
    // Check wishlists
    const wishlistCount = await Wishlist.countDocuments();
    console.log(`Wishlist items remaining: ${wishlistCount}`);
    
    // Check reviews
    const reviewCount = await Review.countDocuments();
    console.log(`Reviews remaining: ${reviewCount}`);
    
    // Check shop orders
    const orderCount = await ShopOrder.countDocuments();
    console.log(`Shop orders remaining: ${orderCount}`);
    
    // Check inventory items
    const inventoryItemCount = await InventoryItem.countDocuments();
    console.log(`Inventory items remaining: ${inventoryItemCount}`);
    
    // Check promotions
    const promotionCount = await Promotion.countDocuments();
    console.log(`Promotions remaining: ${promotionCount}`);
    
    // Check purchase orders
    const purchaseOrderCount = await PurchaseOrder.countDocuments();
    console.log(`Purchase orders remaining: ${purchaseOrderCount}`);
    
    // Check pet shop services
    const serviceCount = await PetShopService.countDocuments();
    console.log(`Pet shop services remaining: ${serviceCount}`);
    
    // Check petshop-related images
    const imageCount = await Image.countDocuments({
      $or: [
        { entityType: 'PetInventoryItem' },
        { module: 'petshop' }
      ]
    });
    console.log(`Petshop-related images remaining: ${imageCount}`);
    
    const totalCount = petCount + petShopCount + reservationCount + wishlistCount + reviewCount + 
                      orderCount + inventoryItemCount + promotionCount + purchaseOrderCount + serviceCount + imageCount;
    
    if (totalCount === 0) {
      console.log('✅ All petshop data has been successfully removed!');
    } else {
      console.log('❌ Some petshop data still remains');
    }
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  verifyCleanup();
}