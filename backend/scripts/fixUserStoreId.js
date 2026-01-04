#!/usr/bin/env node

/**
 * Script to fix user storeId assignment for PetShop managers
 * Usage: node scripts/fixUserStoreId.js <userId or email> <storeId>
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('../core/models/User');
const connectDB = require('../core/db');

async function fixUserStoreId() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('Usage: node scripts/fixUserStoreId.js <userId or email> <storeId>');
      console.log('\nExample:');
      console.log('  node scripts/fixUserStoreId.js user@example.com 507f1f77bcf86cd799439011');
      console.log('  node scripts/fixUserStoreId.js 507f1f77bcf86cd799439010 507f1f77bcf86cd799439011');
      process.exit(1);
    }

    const userIdentifier = args[0];
    const storeId = args[1];

    // Validate storeId format
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      console.error('❌ Invalid storeId format. Must be a valid MongoDB ObjectId (24 hex characters)');
      console.error(`Received: ${storeId}`);
      process.exit(1);
    }

    // Find user by ID or email
    let user;
    if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
      user = await User.findById(userIdentifier);
    } else {
      user = await User.findOne({ email: userIdentifier });
    }

    if (!user) {
      console.error('❌ User not found');
      console.error(`Searched for: ${userIdentifier}`);
      process.exit(1);
    }

    console.log('\n📋 Current User Info:');
    console.log(`  ID: ${user._id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Current StoreId: ${user.storeId || 'NOT SET'}`);
    console.log(`  Current StoreName: ${user.storeName || 'NOT SET'}`);

    // Update user with new storeId
    user.storeId = new mongoose.Types.ObjectId(storeId);
    // Optionally set storeName if you have it
    // user.storeName = 'Your Store Name';

    await user.save();

    console.log('\n✅ User storeId updated successfully!');
    console.log(`  New StoreId: ${user.storeId}`);
    console.log(`  StoreName: ${user.storeName || 'NOT SET'}`);

    console.log('\n💡 Note: If storeName is not set, you may want to set it as well.');
    console.log('   User can now create pet stocks!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUserStoreId();
