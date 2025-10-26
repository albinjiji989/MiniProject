/**
 * Debug script to simulate the full request flow including authentication
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

// Simulate the getStoreFilter function
const getStoreFilter = (user) => {
  // Admin can see all data
  if (user.role === 'admin') {
    return {};
  }

  // Module managers can only see their store's data
  if (user.role && user.role.includes('_manager') && user.storeId) {
    return { storeId: user.storeId };
  }

  // Public users can only see their own data
  if (user.role === 'public_user') {
    return { userId: user.id };
  }

  // Default: no access
  return { _id: null }; // This will return no results
};

const debugFullRequestFlow = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Debugging full request flow...');
    
    // Simulate finding a petshop manager user
    const user = await User.findOne({ role: { $in: ['petshop_manager', 'manager'] } });
    if (!user) {
      console.log('❌ No petshop manager user found in database');
      return;
    }
    
    console.log('Found user:', {
      id: user._id,
      role: user.role,
      storeId: user.storeId,
      storeName: user.storeName
    });
    
    // Simulate the auth middleware processing
    const reqUser = {
      ...user.toObject(),
      id: user._id.toString(),
      role: user.role,
      storeId: user.storeId,
      storeName: user.storeName
    };
    
    console.log('Processed user object:', {
      id: reqUser.id,
      role: reqUser.role,
      storeId: reqUser.storeId,
      storeName: reqUser.storeName,
      hasStoreId: !!reqUser.storeId
    });
    
    // Test the exact API calls that are failing
    const testCases = [
      { limit: 1 },
      { limit: 5 },
      { status: 'available_for_sale', limit: 1 }
    ];
    
    for (const queryParams of testCases) {
      console.log(`\n--- Testing query:`, queryParams, '---');
      
      try {
        const { 
          page = 1, 
          limit = 10, 
          status, 
          search, 
          sortBy = 'createdAt', 
          sortOrder = 'desc',
          speciesId,
          breedId,
          minPrice,
          maxPrice
        } = queryParams;

        const filter = { ...getStoreFilter(reqUser), isActive: true };
        console.log('Base filter:', filter);
        
        // Apply filters
        if (status) filter.status = status;
        if (speciesId) filter.speciesId = speciesId;
        if (breedId) filter.breedId = breedId;
        
        if (minPrice || maxPrice) {
          filter.price = {};
          if (minPrice) filter.price.$gte = Number(minPrice);
          if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { petCode: { $regex: search, $options: 'i' } }
          ];
        }
        
        console.log('Final filter:', filter);

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        console.log('Sort:', sort);

        console.log('Executing query...');
        const items = await PetInventoryItem.find(filter)
          .populate('speciesId', 'name displayName')
          .populate('breedId', 'name')
          .populate('imageIds')
          .sort(sort)
          .limit(limit * 1)
          .skip((page - 1) * limit);

        console.log(`✅ Found ${items.length} items`);
        
        // Check if any items have issues
        for (const item of items) {
          console.log(`  Item: ${item._id} - ${item.name} (${item.petCode})`);
          console.log(`    storeId:`, item.storeId);
          console.log(`    speciesId:`, item.speciesId);
          console.log(`    breedId:`, item.breedId);
          console.log(`    price:`, item.price);
          console.log(`    createdBy:`, item.createdBy);
          
          // Try to validate the item
          try {
            await item.validate();
            console.log(`    ✅ Validation passed`);
          } catch (validationError) {
            console.log(`    ❌ Validation failed:`, validationError.message);
          }
        }

        // Manually populate the virtual 'images' field for each item
        console.log('Populating virtual images field...');
        for (const item of items) {
          try {
            await item.populate('images');
            console.log(`  ✅ Populated images for ${item._id}`);
          } catch (populateError) {
            console.log(`  ❌ Failed to populate images for ${item._id}:`, populateError.message);
          }
        }

        const total = await PetInventoryItem.countDocuments(filter);
        console.log(`Total items: ${total}`);

      } catch (error) {
        console.log(`❌ Error with query:`, error.message);
        console.log('Error stack:', error.stack);
      }
    }
    
    console.log('\n🎉 Full request flow debugging completed!');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the debug
if (require.main === module) {
  debugFullRequestFlow();
}

module.exports = { debugFullRequestFlow };