const mongoose = require('mongoose');
require('dotenv').config();

async function deleteAllAdoptionData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    console.log('⚠️  DELETING ALL ADOPTION DATA...\n');

    // Delete from adoptionpets collection
    const petsResult = await mongoose.connection.db.collection('adoptionpets').deleteMany({});
    console.log(`✅ Deleted ${petsResult.deletedCount} adoption pets`);

    // Delete from images collection (adoption-related)
    const imagesResult = await mongoose.connection.db.collection('images').deleteMany({
      $or: [
        { adoptionPetId: { $exists: true } },
        { entityType: 'adoption_pet' }
      ]
    });
    console.log(`✅ Deleted ${imagesResult.deletedCount} adoption images`);

    // Delete from documents collection (adoption-related)
    const docsResult = await mongoose.connection.db.collection('documents').deleteMany({
      $or: [
        { adoptionPetId: { $exists: true } },
        { entityType: 'adoption_pet' }
      ]
    });
    console.log(`✅ Deleted ${docsResult.deletedCount} adoption documents`);

    // Delete from petregistry (pets linked to adoption)
    const registryResult = await mongoose.connection.db.collection('petregistry').deleteMany({
      $or: [
        { adoptionPetId: { $exists: true } },
        { source: 'adoption' }
      ]
    });
    console.log(`✅ Deleted ${registryResult.deletedCount} pets from registry`);

    // Delete adoption applications
    const appsResult = await mongoose.connection.db.collection('adoptionapplications').deleteMany({});
    console.log(`✅ Deleted ${appsResult.deletedCount} adoption applications`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL ADOPTION DATA DELETED');
    console.log('='.repeat(60));
    console.log('\n📝 Next steps:');
    console.log('1. Go to manager dashboard');
    console.log('2. Add pets manually using the form');
    console.log('3. Fill in temperament tags (Friendly, Gentle, or AGGRESSIVE)');
    console.log('4. Test SmartMatches page\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteAllAdoptionData();
