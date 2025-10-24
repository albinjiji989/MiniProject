require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Import cleanup functions
const { cleanupPetShopData } = require('./cleanup-petshop-completely');
const { cleanupPetShopUserPets } = require('./cleanup-petshop-user-pets');

// Connect to database
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

// Main comprehensive cleanup function
const cleanupAllPetShopData = async () => {
  try {
    console.log('🚀 Starting comprehensive petshop data cleanup...');
    console.log('==============================================');
    
    // 1. Cleanup all petshop module data (inventory, reservations, etc.)
    console.log('\n1. Cleaning up petshop module data...');
    await cleanupPetShopData();
    
    // Reconnect to database as cleanupPetShopData closes the connection
    await connectDB();
    
    // 2. Cleanup user pets created through petshop
    console.log('\n2. Cleaning up user pets created through petshop...');
    await cleanupPetShopUserPets();
    
    console.log('\n==============================================');
    console.log('✅ All petshop data has been successfully removed!');
    console.log('==============================================');
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('❌ Comprehensive cleanup failed:', error);
    process.exit(1);
  }
};

// Run the cleanup
if (require.main === module) {
  cleanupAllPetShopData();
}

module.exports = {
  cleanupAllPetShopData
};