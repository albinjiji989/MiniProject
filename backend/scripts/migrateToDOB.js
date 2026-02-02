/**
 * Migration Script: Convert old age/ageUnit data to dateOfBirth
 * 
 * This script handles migration of existing pet records that use age/ageUnit
 * to the new dateOfBirth-based system with IST timezone support.
 * 
 * Usage: node backend/scripts/migrateToDOB.js
 */

const mongoose = require('mongoose');
const { convertAgeToDOB, getISTDate } = require('../core/utils/ageCalculator');

// Database configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petshop';

// Models to migrate
const MODELS_TO_MIGRATE = [
  { name: 'AdoptionPet', path: '../modules/adoption/models/AdoptionPet' },
  { name: 'PetRegistry', path: '../modules/petshop/models/PetRegistry' },
  { name: 'PetInventoryItem', path: '../modules/petshop/models/PetInventoryItem' },
  { name: 'PetStock', path: '../modules/petshop/manager/models/PetStock' }
];

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function migrateModel(modelInfo) {
  console.log(`\n📦 Migrating ${modelInfo.name}...`);
  
  try {
    const Model = require(modelInfo.path);
    
    // Find documents with age/ageUnit but no dateOfBirth
    const docsToMigrate = await Model.find({
      $or: [
        { dateOfBirth: { $exists: false } },
        { dateOfBirth: null }
      ],
      age: { $exists: true, $ne: null }
    });

    if (docsToMigrate.length === 0) {
      console.log(`   ℹ️  No documents to migrate for ${modelInfo.name}`);
      return { migrated: 0, failed: 0 };
    }

    console.log(`   Found ${docsToMigrate.length} documents to migrate`);

    let migrated = 0;
    let failed = 0;
    const errors = [];

    for (const doc of docsToMigrate) {
      try {
        // Convert age to DOB
        const dateOfBirth = convertAgeToDOB(doc.age, doc.ageUnit || 'months');
        
        if (!dateOfBirth) {
          throw new Error(`Failed to convert age=${doc.age} ageUnit=${doc.ageUnit}`);
        }

        // Update document
        doc.dateOfBirth = dateOfBirth;
        doc.dobAccuracy = 'estimated'; // Mark as estimated since converted from age
        
        // Remove old fields (they'll be virtual now)
        doc.age = undefined;
        doc.ageUnit = undefined;

        await doc.save();
        migrated++;
        
        if (migrated % 10 === 0) {
          process.stdout.write(`   Migrated ${migrated}/${docsToMigrate.length}...\r`);
        }
      } catch (error) {
        failed++;
        errors.push({
          id: doc._id,
          name: doc.name || 'unknown',
          error: error.message
        });
      }
    }

    console.log(`   ✅ Migrated: ${migrated}, ❌ Failed: ${failed}`);
    
    if (errors.length > 0 && errors.length <= 10) {
      console.log('   Errors:');
      errors.forEach(err => {
        console.log(`     - ${err.name} (${err.id}): ${err.error}`);
      });
    } else if (errors.length > 10) {
      console.log(`   First 10 errors:`);
      errors.slice(0, 10).forEach(err => {
        console.log(`     - ${err.name} (${err.id}): ${err.error}`);
      });
    }

    return { migrated, failed };
  } catch (error) {
    console.error(`   ❌ Error migrating ${modelInfo.name}:`, error.message);
    return { migrated: 0, failed: 0 };
  }
}

async function verifyMigration(modelInfo) {
  try {
    const Model = require(modelInfo.path);
    
    const withDOB = await Model.countDocuments({ dateOfBirth: { $exists: true, $ne: null } });
    const total = await Model.countDocuments();
    
    console.log(`   ${modelInfo.name}: ${withDOB}/${total} have dateOfBirth`);
    
    return { withDOB, total };
  } catch (error) {
    console.error(`   Error verifying ${modelInfo.name}:`, error.message);
    return { withDOB: 0, total: 0 };
  }
}

async function main() {
  console.log('🚀 Starting DOB Migration...');
  console.log(`   Timezone: IST (UTC+5:30)`);
  console.log(`   Current IST Time: ${getISTDate().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  
  await connectDB();

  let totalMigrated = 0;
  let totalFailed = 0;

  // Migrate each model
  for (const modelInfo of MODELS_TO_MIGRATE) {
    const result = await migrateModel(modelInfo);
    totalMigrated += result.migrated;
    totalFailed += result.failed;
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Total Migrated: ${totalMigrated}`);
  console.log(`   Total Failed: ${totalFailed}`);

  // Verify migration
  console.log('\n🔍 Verification:');
  for (const modelInfo of MODELS_TO_MIGRATE) {
    await verifyMigration(modelInfo);
  }

  console.log('\n✅ Migration complete!');
  
  await mongoose.connection.close();
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run migration
main();
