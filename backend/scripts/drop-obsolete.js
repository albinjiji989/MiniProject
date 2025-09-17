/*
  Script: Drop obsolete collections related to removed modules
  Usage: node scripts/drop-obsolete.js
*/
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/petwelfare';

async function dropIfExists(db, name) {
  const exists = (await db.listCollections({ name }).toArray()).length > 0;
  if (exists) {
    await db.dropCollection(name);
    console.log(`Dropped collection: ${name}`);
  } else {
    console.log(`Collection not found (skip): ${name}`);
  }
}

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    const toDrop = [
      // Donation
      'donations', 'campaigns', 'sponsorships',
      // Boarding
      'boardings', 'rooms', 'bookings'
    ];

    for (const name of toDrop) {
      // Mongo stores in lowercase by default with pluralization depending on model; we attempt common names
      await dropIfExists(db, name);
    }

    await mongoose.disconnect();
    console.log('Obsolete collection cleanup completed.');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup error:', err.message);
    process.exit(1);
  }
})();


