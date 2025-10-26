/**
 * Fix script to create missing PetShop document and fix store references
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import all required models to register schemas
require('../core/models/Species');
require('../core/models/Breed');
require('../core/models/Image');
require('../core/models/User');
require('../core/models/Pet');
require('../core/models/PetNew');

// Import models we need to work with
const PetInventoryItem = require('../modules/petshop/manager/models/PetInventoryItem');
const User = require('../core/models/User');
const PetShop = require('../modules/petshop/manager/models/PetShop');

// Connect to database with proper error handling
const connectDB = async () => {
  try {
    // Load environment variables
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pet_management_system';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const fixStoreReference = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Fixing store references...');
    
    // Find the petshop manager user
    const user = await User.findOne({ role: 'petshop_manager' });
    if (!user) {
      console.log('❌ No petshop manager user found');
      return;
    }
    
    console.log(`User storeId:`, user.storeId);
    console.log(`User storeName:`, user.storeName);
    
    // Check if the referenced PetShop exists
    let petShop = null;

    // First, try to find an existing PetShop
    const existingPetShops = await PetShop.find({});
    if (existingPetShops.length > 0) {
      petShop = existingPetShops[0];
      console.log(`✅ Found existing PetShop: ${petShop._id} - ${petShop.name}`);
    } else {
      console.log('❌ No PetShop documents exist. Creating one...');
      
      // Create a PetShop document directly to bypass validation
      const petShopDoc = {
        name: user.storeName || 'Paws Shop',
        description: 'Pet shop managed by ' + (user.name || 'manager'),
        operatingHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '09:00', close: '18:00' },
          sunday: { open: '09:00', close: '18:00' }
        },
        owner: user._id,
        createdBy: user._id,
        updatedBy: user._id,
        isActive: true,
        location: {
          type: 'Point',
          coordinates: [0, 0],
          formattedAddress: 'Default Address',
          street: '123 Pet Street',
          city: 'Pet City',
          state: 'Pet State',
          zipcode: '123456',
          country: 'India'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert directly into the collection to bypass validation
      const result = await PetShop.collection.insertOne(petShopDoc);
      petShop = await PetShop.findById(result.insertedId);
      console.log(`✅ Created PetShop: ${petShop._id} - ${petShop.name}`);
    }

    // Update the user's storeId to reference the PetShop ObjectId
    if (user.storeId !== petShop._id.toString()) {
      console.log(`Updating user storeId from ${user.storeId} to ${petShop._id}`);
      user.storeId = petShop._id;
      user.storeName = petShop.name;
      await user.save();
      console.log('✅ Updated user storeId reference');
    }

    // Update inventory items to reference the correct PetShop instead of the User
    const inventoryItems = await PetInventoryItem.find({
      storeId: user._id  // Find items referencing the user instead of a PetShop
    });

    console.log(`Found ${inventoryItems.length} inventory items referencing user instead of PetShop`);

    for (const item of inventoryItems) {
      console.log(`  Updating ${item.petCode} from ${item.storeId} to ${petShop._id}`);
      item.storeId = petShop._id;
      item.storeName = petShop.name;
      await item.save();
    }

    console.log(`✅ Updated ${inventoryItems.length} inventory items`);

    console.log('\n🎉 Store reference fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Fix error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the fix
if (require.main === module) {
  fixStoreReference();
}

module.exports = { fixStoreReference };