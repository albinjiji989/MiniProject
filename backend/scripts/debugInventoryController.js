/**
 * Debug script to simulate the exact inventory controller operations
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

const debugInventoryController = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Debugging inventory controller operations...');
    
    // Simulate a manager user
    const mockUser = {
      id: '68fcffdb1775377dcf9195b0',
      role: 'petshop_manager',
      storeId: '68fd0b4e55af6d11a8cdadae'
    };
    
    console.log('Mock user:', {
      id: mockUser.id,
      role: mockUser.role,
      storeId: mockUser.storeId
    });
    
    // Test the exact operations from the controller
    const reqQuery = { limit: 1 };
    
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
    } = reqQuery;

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

    console.log('Executing find query...');
    const items = await PetInventoryItem.find(filter)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('imageIds') // Populate the imageIds field
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log(`Found ${items.length} items before virtual population`);
    
    // Check items before virtual population
    for (const item of items) {
      console.log(`\nItem: ${item._id} - ${item.name} (${item.petCode})`);
      console.log(`  imageIds:`, item.imageIds);
      console.log(`  images virtual field exists:`, 'images' in item);
      if (item.images) {
        console.log(`  images virtual field:`, Array.isArray(item.images) ? `${item.images.length} items` : item.images);
      }
    }

    console.log('\nManually populating virtual images field...');
    // Manually populate the virtual 'images' field for each item
    for (const item of items) {
      try {
        console.log(`Populating images for item ${item._id}...`);
        await item.populate('images');
        console.log(`  ✅ Populated images for ${item._id}`);
        if (item.images) {
          console.log(`    Images count:`, Array.isArray(item.images) ? item.images.length : 'Not an array');
        }
      } catch (populateError) {
        console.log(`  ❌ Failed to populate images for ${item._id}:`, populateError.message);
      }
    }

    const total = await PetInventoryItem.countDocuments(filter);
    console.log(`Total items: ${total}`);

    console.log('\nPreparing response data...');
    const responseData = {
      success: true,
      data: {
        items,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    };
    
    console.log('✅ Controller simulation completed successfully!');
    
  } catch (error) {
    console.error('❌ Controller simulation error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the debug
if (require.main === module) {
  debugInventoryController();
}

module.exports = { debugInventoryController };