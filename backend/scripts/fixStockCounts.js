/**
 * Fix Stock Counts Migration
 * 
 * Purpose: Update stock counts to match actual inventory items
 * This fixes stocks that have maleCount/femaleCount = 0 but have inventory items
 */

const mongoose = require('mongoose');
const PetStock = require('../modules/petshop/manager/models/PetStock');
const PetInventoryItem = require('../modules/petshop/manager/models/PetInventoryItem');

async function fixStockCounts() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/pet_connect', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find all stocks with isReleased = true
    const stocks = await PetStock.find({ isReleased: true });
    console.log(`\n📊 Found ${stocks.length} released stocks\n`);

    let fixed = 0;
    let alreadyCorrect = 0;

    for (const stock of stocks) {
      // Count actual inventory items for this stock
      const maleCount = await PetInventoryItem.countDocuments({
        stockId: stock._id,
        gender: 'Male',
        status: 'available_for_sale'
      });

      const femaleCount = await PetInventoryItem.countDocuments({
        stockId: stock._id,
        gender: 'Female',
        status: 'available_for_sale'
      });

      const needsUpdate = stock.maleCount !== maleCount || stock.femaleCount !== femaleCount;

      if (needsUpdate) {
        console.log(`🔧 Fixing: ${stock.name}`);
        console.log(`   Current: ${stock.maleCount} male, ${stock.femaleCount} female`);
        console.log(`   Actual:  ${maleCount} male, ${femaleCount} female`);

        stock.maleCount = maleCount;
        stock.femaleCount = femaleCount;
        await stock.save();

        console.log(`   ✅ Updated to match inventory\n`);
        fixed++;
      } else {
        console.log(`✓ ${stock.name} - counts already correct (${maleCount}M, ${femaleCount}F)`);
        alreadyCorrect++;
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   Fixed: ${fixed} stocks`);
    console.log(`   Already correct: ${alreadyCorrect} stocks`);
    console.log(`   Total processed: ${stocks.length} stocks\n`);

    mongoose.connection.close();
    console.log('✅ Migration complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

fixStockCounts();
