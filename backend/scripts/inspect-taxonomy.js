/* Diagnostic script: prints Pet Categories, Species, and Breeds summary */
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../core/config/db');
const PetCategory = require('../core/models/PetCategory');
const Species = require('../core/models/Species');
const Breed = require('../core/models/Breed');

(async () => {
  try {
    await connectDB();
    const categories = await PetCategory.find({}).lean();
    const species = await Species.find({}).lean();
    const breeds = await Breed.find({}).lean();

    const pick = (obj, keys) => keys.reduce((a, k) => { if (obj[k] !== undefined) a[k] = obj[k]; return a; }, {});

    console.log('=== Pet Categories ===');
    console.log('count:', categories.length);
    console.log(categories.slice(0, 5).map(c => pick(c, ['_id','name','displayName','isActive'])));

    console.log('\n=== Species ===');
    console.log('count:', species.length);
    console.log(species.slice(0, 5).map(s => pick(s, ['_id','name','displayName','category','isActive'])));

    console.log('\n=== Breeds ===');
    console.log('count:', breeds.length);
    console.log(breeds.slice(0, 5).map(b => pick(b, ['_id','name','speciesId','isActive'])));

    // Cross-check mapping by category name
    const catNameSet = new Set(categories.map(c => String(c.name).toLowerCase()));
    const speciesWithUnknownCategory = species.filter(s => !catNameSet.has(String(s.category || '').toLowerCase()));
    if (speciesWithUnknownCategory.length) {
      console.log('\nWARNING: Species with category name not matching any PetCategory.name:',
        speciesWithUnknownCategory.map(s => pick(s, ['_id','name','displayName','category'])));
    } else {
      console.log('\nCategory mapping looks consistent.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Inspection failed:', err);
    try { await mongoose.connection.close(); } catch (_) {}
    process.exit(1);
  }
})();


