#!/usr/bin/env node

/**
 * Diagnostic script to check user and store assignments
 * Shows which users are managers and whether they have valid store assignments
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('../core/models/User');
const connectDB = require('../core/db');

async function checkUserStores() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Find all manager users
    const managers = await User.find({
      role: { $in: ['petshop_manager', 'adoption_manager', 'veterinary_manager'] }
    }).select('_id email name role storeId storeName isActive');

    if (managers.length === 0) {
      console.log('❌ No managers found in the database');
      process.exit(0);
    }

    console.log(`📊 Found ${managers.length} manager(s):\n`);
    console.log('─'.repeat(100));

    let needsFixCount = 0;

    managers.forEach((user, index) => {
      const hasStoreId = user.storeId && mongoose.Types.ObjectId.isValid(user.storeId);
      const status = hasStoreId ? '✅' : '⚠️';
      
      if (!hasStoreId) needsFixCount++;

      console.log(`${index + 1}. ${status} ${user.email}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   StoreId: ${user.storeId || 'NOT SET (⚠️ needs assignment)'}`);
      console.log(`   StoreName: ${user.storeName || 'NOT SET'}`);
      console.log('');
    });

    console.log('─'.repeat(100));
    console.log(`\n📈 Summary:`);
    console.log(`   Total Managers: ${managers.length}`);
    console.log(`   With Store: ${managers.length - needsFixCount}`);
    console.log(`   Need Store Assignment: ${needsFixCount}`);

    if (needsFixCount > 0) {
      console.log('\n💡 To fix a user\'s store assignment, use:');
      console.log('   node scripts/fixUserStoreId.js <userId or email> <storeId>');
      console.log('\n   Example:');
      console.log(`   node scripts/fixUserStoreId.js ${managers[0].email} 507f1f77bcf86cd799439011`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUserStores();
