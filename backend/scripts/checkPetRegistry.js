const mongoose = require('mongoose');
require('dotenv').config();

async function checkPetRegistry() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const PetRegistry = require('../core/models/PetRegistry');
  const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
  
  console.log('\n=== ADOPTION PETS CHECK ===');
  const adoptionPets = await AdoptionPet.find({ petCode: { $exists: true, $ne: null } }).select('petCode name');
  console.log('Total adoption pets with petCode:', adoptionPets.length);
  
  let adoptionInRegistry = 0;
  let adoptionMissing = [];
  
  for (const pet of adoptionPets) {
    const inRegistry = await PetRegistry.findOne({ petCode: pet.petCode });
    if (inRegistry) {
      adoptionInRegistry++;
    } else {
      adoptionMissing.push({ petCode: pet.petCode, name: pet.name });
    }
  }
  
  console.log('Found in PetRegistry:', adoptionInRegistry);
  console.log('Missing from Registry:', adoptionMissing.length);
  if (adoptionMissing.length > 0) {
    console.log('Missing:', adoptionMissing.slice(0, 10).map(p => p.petCode).join(', '));
  }

  // Check PetShop items
  console.log('\n=== PETSHOP PETS CHECK ===');
  let PetStock;
  try {
    PetStock = require('../modules/petshop/manager/models/PetStock');
  } catch (e) {
    console.log('Could not find PetStock model:', e.message);
    await mongoose.disconnect();
    return;
  }
  
  const petshopPets = await PetStock.find({ petCode: { $exists: true, $ne: null } }).select('petCode name species breed');
  console.log('Total petshop pets with petCode:', petshopPets.length);
  
  let petshopInRegistry = 0;
  let petshopMissing = [];
  
  for (const pet of petshopPets) {
    const inRegistry = await PetRegistry.findOne({ petCode: pet.petCode });
    if (inRegistry) {
      petshopInRegistry++;
    } else {
      petshopMissing.push({ petCode: pet.petCode, name: pet.name });
    }
  }
  
  console.log('Found in PetRegistry:', petshopInRegistry);
  console.log('Missing from Registry:', petshopMissing.length);
  if (petshopMissing.length > 0) {
    console.log('Missing:', petshopMissing.slice(0, 10).map(p => p.petCode).join(', '));
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  const totalRegistry = await PetRegistry.countDocuments();
  console.log('Total in PetRegistry:', totalRegistry);
  console.log('  - From adoption:', await PetRegistry.countDocuments({ source: 'adoption' }));
  console.log('  - From petshop:', await PetRegistry.countDocuments({ source: 'petshop' }));
  console.log('  - From userpet:', await PetRegistry.countDocuments({ source: 'userpet' }));

  await mongoose.disconnect();
}

checkPetRegistry().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
