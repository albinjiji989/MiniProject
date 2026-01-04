/**
 * Migration Script: Convert PetStock + PetInventoryItems into PetBatches
 * 
 * This script groups existing inventory items by their stockId or batch characteristics
 * and creates corresponding PetBatch documents with aggregated data.
 * 
 * Usage: node migrateToPetBatches.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Models
const PetBatch = require('../modules/petshop/manager/models/PetBatch');
const PetStock = require('../modules/petshop/manager/models/PetStock');
const PetInventoryItem = require('../modules/petshop/manager/models/PetInventoryItem');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pet_management');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

/**
 * Create batches from PetStock with generated pets
 */
async function createBatchesFromStock() {
  console.log('\n📦 Processing PetStock items...');
  
  try {
    const stocks = await PetStock.find({ isActive: true })
      .populate('speciesId')
      .populate('breedId')
      .populate('createdBy');
    
    let batchesCreated = 0;
    
    for (const stock of stocks) {
      try {
        // Find all inventory items generated from this stock
        const inventoryItems = await PetInventoryItem.find({ stockId: stock._id });
        
        if (inventoryItems.length === 0) {
          console.log(`⏭️  Stock "${stock.name}" has no generated items, skipping...`);
          continue;
        }
        
        // Count by gender
        const maleCount = inventoryItems.filter(item => item.gender === 'Male').length;
        const femaleCount = inventoryItems.filter(item => item.gender === 'Female').length;
        const unknownCount = inventoryItems.filter(item => item.gender === 'Unknown').length;
        
        // Get sample pets (first 3 or fewer)
        const samplePets = inventoryItems.slice(0, 3).map(item => ({
          petId: item._id,
          name: item.name,
          petCode: item.petCode,
          gender: item.gender,
          age: item.age,
          ageUnit: item.ageUnit,
          imageIds: item.imageIds || []
        }));
        
        // Create batch
        const batch = new PetBatch({
          shopId: stock.storeId,
          stockId: stock._id,
          category: stock.tags?.[0] || 'general',
          speciesId: stock.speciesId._id,
          breedId: stock.breedId._id,
          ageRange: {
            min: stock.age || 0,
            max: stock.age || 12,
            unit: stock.ageUnit || 'months'
          },
          counts: {
            total: inventoryItems.length,
            male: maleCount,
            female: femaleCount,
            unknown: unknownCount
          },
          samplePets,
          price: {
            min: stock.discountPrice || stock.price,
            max: stock.price,
            basePrice: stock.price
          },
          images: stock.maleImageIds?.concat(stock.femaleImageIds || []) || [],
          status: stock.isReleased ? 'published' : 'draft',
          description: `Batch of ${inventoryItems.length} ${stock.breedId.name} from stock`,
          createdBy: stock.createdBy._id,
          managerId: stock.createdBy._id,
          publishedAt: stock.isReleased ? stock.releasedAt : null,
          attributes: {
            color: stock.color,
            size: stock.size,
            originalStockName: stock.name
          },
          tags: stock.tags || []
        });
        
        const savedBatch = await batch.save();
        
        // Link batch ID back to inventory items
        await PetInventoryItem.updateMany(
          { stockId: stock._id },
          { batchId: savedBatch._id }
        );
        
        batchesCreated++;
        console.log(`✅ Created batch for stock "${stock.name}" (${inventoryItems.length} items)`);
        
      } catch (error) {
        console.error(`❌ Error processing stock "${stock.name}":`, error.message);
      }
    }
    
    return batchesCreated;
  } catch (error) {
    console.error('❌ Error creating batches from stock:', error.message);
    return 0;
  }
}

/**
 * Create batches for orphaned inventory items (not linked to stock)
 */
async function createBatchesForOrphanedItems() {
  console.log('\n🔍 Processing orphaned inventory items...');
  
  try {
    // Find items without stockId and without batchId
    const orphanedItems = await PetInventoryItem.find({
      stockId: { $exists: false },
      batchId: { $exists: false }
    })
      .populate('speciesId')
      .populate('breedId')
      .populate('createdBy');
    
    if (orphanedItems.length === 0) {
      console.log('ℹ️  No orphaned items found');
      return 0;
    }
    
    // Group by speciesId, breedId, shop, and age range
    const groupMap = new Map();
    
    for (const item of orphanedItems) {
      const key = `${item.speciesId._id}-${item.breedId._id}-${item.createdBy._id}`;
      
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key).push(item);
    }
    
    let batchesCreated = 0;
    
    for (const [key, items] of groupMap) {
      try {
        // Count by gender
        const maleCount = items.filter(item => item.gender === 'Male').length;
        const femaleCount = items.filter(item => item.gender === 'Female').length;
        const unknownCount = items.filter(item => item.gender === 'Unknown').length;
        
        // Get sample pets
        const samplePets = items.slice(0, 3).map(item => ({
          petId: item._id,
          name: item.name,
          petCode: item.petCode,
          gender: item.gender,
          age: item.age,
          ageUnit: item.ageUnit,
          imageIds: item.imageIds || []
        }));
        
        const firstItem = items[0];
        
        // Create batch
        const batch = new PetBatch({
          shopId: firstItem.shopId || firstItem.createdBy._id,
          speciesId: firstItem.speciesId._id,
          breedId: firstItem.breedId._id,
          ageRange: {
            min: firstItem.age || 0,
            max: firstItem.age || 12,
            unit: firstItem.ageUnit || 'months'
          },
          counts: {
            total: items.length,
            male: maleCount,
            female: femaleCount,
            unknown: unknownCount
          },
          samplePets,
          price: {
            min: firstItem.price * 0.9,
            max: firstItem.price,
            basePrice: firstItem.price
          },
          images: firstItem.imageIds || [],
          status: 'published',
          description: `Batch of ${items.length} ${firstItem.breedId.name}`,
          createdBy: firstItem.createdBy._id,
          publishedAt: new Date(),
          attributes: {
            color: firstItem.color,
            size: firstItem.size
          }
        });
        
        const savedBatch = await batch.save();
        
        // Link batch ID to items
        await PetInventoryItem.updateMany(
          { _id: { $in: items.map(i => i._id) } },
          { batchId: savedBatch._id }
        );
        
        batchesCreated++;
        console.log(`✅ Created batch for ${items.length} orphaned items (${firstItem.breedId.name})`);
        
      } catch (error) {
        console.error('❌ Error creating batch for orphaned group:', error.message);
      }
    }
    
    return batchesCreated;
  } catch (error) {
    console.error('❌ Error processing orphaned items:', error.message);
    return 0;
  }
}

/**
 * Validate migration results
 */
async function validateMigration() {
  console.log('\n🔍 Validating migration...');
  
  try {
    const totalItems = await PetInventoryItem.countDocuments();
    const itemsWithBatch = await PetInventoryItem.countDocuments({ batchId: { $exists: true } });
    const totalBatches = await PetBatch.countDocuments();
    
    console.log(`\n📊 Migration Statistics:`);
    console.log(`   Total inventory items: ${totalItems}`);
    console.log(`   Items linked to batches: ${itemsWithBatch}`);
    console.log(`   Batches created: ${totalBatches}`);
    console.log(`   Coverage: ${totalItems > 0 ? ((itemsWithBatch / totalItems) * 100).toFixed(2) : 0}%`);
    
    if (totalBatches === 0) {
      console.warn('⚠️  No batches were created! Check if inventory items exist.');
    } else {
      console.log('✅ Migration completed successfully');
    }
  } catch (error) {
    console.error('❌ Validation error:', error.message);
  }
}

/**
 * Main migration runner
 */
async function runMigration() {
  console.log('🚀 Starting PetBatch Migration...');
  console.log('=' .repeat(50));
  
  try {
    await connectDB();
    
    const stockBatches = await createBatchesFromStock();
    const orphanBatches = await createBatchesForOrphanedItems();
    
    console.log(`\n📈 Summary:`);
    console.log(`   Batches from stock: ${stockBatches}`);
    console.log(`   Batches from orphaned items: ${orphanBatches}`);
    console.log(`   Total batches created: ${stockBatches + orphanBatches}`);
    
    await validateMigration();
    
    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration if executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { createBatchesFromStock, createBatchesForOrphanedItems };
