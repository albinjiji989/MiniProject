/**
 * Debug script to simulate the actual inventory API call
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

const debugInventoryAPI = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Debugging inventory API call...');
    
    // Simulate a manager user
    const mockUser = {
      id: '68fcffdb1775377dcf9195b0',
      role: 'petshop_manager',
      storeId: '68fd0b4e55af6d11a8cdadae'
    };
    
    // Simulate API query parameters
    const queryParams = {
      limit: 1,
      status: 'available_for_sale'
    };
    
    console.log('Mock user:', {
      id: mockUser.id,
      role: mockUser.role,
      storeId: mockUser.storeId
    });
    
    console.log('Query params:', queryParams);
    
    // Apply the same logic as in the controller
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

    const filter = { ...getStoreFilter(mockUser), isActive: true };
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

    console.log('\n--- Executing query ---');
    const items = await PetInventoryItem.find(filter)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('imageIds') // Populate the imageIds field
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log(`Found ${items.length} items`);
    
    // Manually populate the virtual 'images' field for each item
    console.log('Populating virtual images field...');
    for (const item of items) {
      await item.populate('images');
    }

    const total = await PetInventoryItem.countDocuments(filter);
    console.log(`Total items: ${total}`);

    console.log('\n🎉 API simulation completed successfully!');
    
  } catch (error) {
    console.error('❌ API simulation error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the debug
if (require.main === module) {
  debugInventoryAPI();
}

module.exports = { debugInventoryAPI };