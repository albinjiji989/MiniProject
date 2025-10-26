/**
 * Check if existing inventory items pass validation
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

const checkInventoryValidation = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking inventory item validation...');
    
    // Find all inventory items
    const items = await PetInventoryItem.find({});
    console.log(`Found ${items.length} total inventory items`);
    
    let invalidItems = 0;
    
    for (const item of items) {
      let isValid = true;
      const issues = [];
      
      // Check required fields
      if (!item.speciesId) {
        isValid = false;
        issues.push('Missing speciesId');
      }
      
      if (!item.breedId) {
        isValid = false;
        issues.push('Missing breedId');
      }
      
      if (item.price === undefined || item.price === null) {
        isValid = false;
        issues.push('Missing price');
      }
      
      if (item.price < 0) {
        isValid = false;
        issues.push('Negative price');
      }
      
      if (!item.storeId) {
        isValid = false;
        issues.push('Missing storeId');
      }
      
      if (!item.createdBy) {
        isValid = false;
        issues.push('Missing createdBy');
      }
      
      if (!isValid) {
        invalidItems++;
        console.log(`\n❌ Invalid item ${item._id}:`);
        console.log(`  Name: ${item.name}`);
        console.log(`  PetCode: ${item.petCode}`);
        console.log(`  Issues: ${issues.join(', ')}`);
      }
    }
    
    console.log(`\n📊 Validation summary:`);
    console.log(`  Total items: ${items.length}`);
    console.log(`  Invalid items: ${invalidItems}`);
    console.log(`  Valid items: ${items.length - invalidItems}`);
    
    if (invalidItems > 0) {
      console.log(`\n⚠️  Warning: ${invalidItems} items have validation issues that could cause API errors`);
    } else {
      console.log(`\n✅ All items pass validation`);
    }
    
  } catch (error) {
    console.error('❌ Validation check error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  }
};

// Run the validation check
if (require.main === module) {
  checkInventoryValidation();
}

module.exports = { checkInventoryValidation };