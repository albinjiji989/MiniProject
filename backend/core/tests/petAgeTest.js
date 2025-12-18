const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/petwelfare', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models and services
const PetAgeService = require('../services/PetAgeService');
const PetAgeTracker = require('../models/PetAgeTracker');

async function runTest() {
  try {
    console.log('🧪 Starting Pet Age Tracking Test...');
    
    // Test 1: Create age tracker
    console.log('\n📝 Test 1: Creating age tracker...');
    const tracker = await PetAgeService.createAgeTracker({
      petCode: 'TEST001',
      initialAgeValue: 6,
      initialAgeUnit: 'months',
      birthDate: null
    });
    console.log('✅ Age tracker created:', tracker.petCode);
    
    // Test 2: Get current age
    console.log('\n🔍 Test 2: Getting current age...');
    const currentAge = await PetAgeService.getCurrentAge('TEST001');
    console.log('✅ Current age:', currentAge.currentAge);
    
    // Test 3: Update age tracker with birth date
    console.log('\n✏️ Test 3: Updating with birth date...');
    const birthDate = new Date();
    birthDate.setDate(birthDate.getDate() - 180); // 6 months ago
    
    const updatedTracker = await PetAgeService.updateAgeTracker('TEST001', {
      birthDate: birthDate
    });
    console.log('✅ Updated with birth date:', updatedTracker.birthDate);
    
    // Test 4: Get updated current age
    console.log('\n🔍 Test 4: Getting updated current age...');
    const updatedAge = await PetAgeService.getCurrentAge('TEST001');
    console.log('✅ Updated current age:', updatedAge.currentAge);
    
    // Test 5: Get age statistics
    console.log('\n📊 Test 5: Getting age statistics...');
    const stats = await PetAgeService.getAgeStatistics();
    console.log('✅ Age statistics:', stats);
    
    // Test 6: Delete age tracker
    console.log('\n🗑️ Test 6: Deleting age tracker...');
    const deleted = await PetAgeService.deleteAgeTracker('TEST001');
    console.log('✅ Age tracker deleted:', deleted);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
runTest();