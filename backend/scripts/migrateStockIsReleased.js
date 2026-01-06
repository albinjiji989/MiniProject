/**
 * Migration script to set isReleased flag for existing stocks
 * Run this once to update all legacy stocks
 */

require('dotenv').config();
const mongoose = require('mongoose');
const PetStock = require('../modules/petshop/manager/models/PetStock');

const migrateStocks = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all stocks that don't have isReleased field or have it set to false
    const stocksToUpdate = await PetStock.find({
      $or: [
        { isReleased: { $exists: false } },
        { isReleased: false }
      ]
    });

    console.log(`Found ${stocksToUpdate.length} stocks to update`);

    if (stocksToUpdate.length === 0) {
      console.log('✅ No stocks need migration');
      process.exit(0);
    }

    // Update each stock
    let updated = 0;
    for (const stock of stocksToUpdate) {
      stock.isReleased = true;
      stock.releasedAt = stock.releasedAt || stock.createdAt || new Date();
      await stock.save();
      updated++;
      console.log(`✅ Updated stock ${stock._id} - ${stock.name}`);
    }

    console.log(`\n✅ Successfully migrated ${updated} stocks`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateStocks();
