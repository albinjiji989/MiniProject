const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to database
const connectDB = require('../core/db');

async function finalVerification() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Import all models to register them
    const PetRegistry = require('../core/models/PetRegistry');
    const Pet = require('../core/models/Pet');
    const PetInventoryItem = require('../modules/petshop/manager/models/PetInventoryItem');
    const Species = require('../core/models/Species');
    const Breed = require('../core/models/Breed');
    const Image = require('../core/models/Image');

    console.log('=== FINAL VERIFICATION ===');
    
    // Test the specific pet
    const petId = '68fd3a70550bd93bc40666c8';
    console.log(`Testing pet ID: ${petId}`);
    
    // 1. Check Pet object
    let pet = await Pet.findById(petId)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('imageIds');

    if (pet) {
      await pet.populate('images');
    }
    
    console.log('\n1. Pet Object Status:');
    console.log(`   Name: ${pet?.name || 'Not found'}`);
    console.log(`   Pet Code: ${pet?.petCode || 'N/A'}`);
    console.log(`   Images: ${pet?.images?.length || 0}`);
    console.log(`   ImageIds: ${pet?.imageIds?.length || 0}`);
    
    // 2. Check Registry
    const registryEntry = pet?.petCode ? await PetRegistry.findOne({ petCode: pet.petCode }).populate('imageIds') : null;
    if (registryEntry) {
      await registryEntry.populate('images');
    }
    
    console.log('\n2. Registry Entry Status:');
    console.log(`   Found: ${!!registryEntry}`);
    console.log(`   Images: ${registryEntry?.images?.length || 0}`);
    console.log(`   ImageIds: ${registryEntry?.imageIds?.length || 0}`);
    
    // 3. Check Inventory Item
    const inventoryItem = registryEntry?.petShopItemId ? 
      await PetInventoryItem.findById(registryEntry.petShopItemId).populate('imageIds') : null;
    if (inventoryItem) {
      await inventoryItem.populate('images');
    }
    
    console.log('\n3. Inventory Item Status:');
    console.log(`   Found: ${!!inventoryItem}`);
    console.log(`   Images: ${inventoryItem?.images?.length || 0}`);
    console.log(`   ImageIds: ${inventoryItem?.imageIds?.length || 0}`);
    
    // 4. Apply the fix logic
    console.log('\n4. Applying Fix Logic:');
    if (pet && (!pet.images || pet.images.length === 0) && pet.petCode) {
      console.log('   ✅ Pet needs image fix');
      if (registryEntry && registryEntry.images && registryEntry.images.length > 0) {
        console.log('   ✅ Registry has images, applying fix');
        pet.images = registryEntry.images;
        pet.imageIds = registryEntry.imageIds;
        console.log(`   ✅ After fix - Pet images: ${pet.images.length}`);
      } else {
        console.log('   ❌ Registry has no images');
      }
    } else {
      console.log('   ℹ️  Pet does not need image fix');
    }
    
    // 5. Final status
    console.log('\n5. Final Status:');
    console.log(`   Pet has images: ${pet?.images?.length > 0 ? 'YES' : 'NO'}`);
    if (pet?.images?.length > 0) {
      console.log(`   First image URL: ${pet.images[0].url}`);
    }
    
    console.log('\n=== VERIFICATION COMPLETE ===');
    
    // Summary
    const issues = [];
    if (!pet) issues.push('Pet not found in Pet collection');
    if (!registryEntry) issues.push('Registry entry not found');
    if (!inventoryItem) issues.push('Inventory item not found');
    if (pet && pet.images?.length === 0) issues.push('Pet has no images after fix');
    
    if (issues.length === 0) {
      console.log('🎉 ALL CHECKS PASSED - System should work correctly');
    } else {
      console.log('❌ ISSUES FOUND:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from database');
  }
}

// Run the verification
finalVerification();