const mongoose = require('mongoose');
require('dotenv').config();

// Test script to verify payment system setup
async function testPaymentSystem() {
  try {
    console.log('🧪 Testing Payment System Setup...\n');

    // Test 1: Environment Variables
    console.log('1. Checking Environment Variables:');
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (razorpayKeyId && razorpayKeySecret) {
      console.log('   ✅ Razorpay keys configured');
      console.log(`   📝 Key ID: ${razorpayKeyId.substring(0, 10)}...`);
    } else {
      console.log('   ❌ Razorpay keys missing in .env file');
      return;
    }

    // Test 2: Database Connection
    console.log('\n2. Testing Database Connection:');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pet-welfare');
    console.log('   ✅ Database connected successfully');

    // Test 3: Models Import
    console.log('\n3. Testing Model Imports:');
    try {
      const PetReservation = require('./modules/petshop/models/PetReservation');
      const PetInventoryItem = require('./modules/petshop/models/PetInventoryItem');
      const PetHistory = require('./models/PetHistory');
      console.log('   ✅ All models imported successfully');
    } catch (err) {
      console.log('   ❌ Model import error:', err.message);
    }

    // Test 4: Razorpay SDK
    console.log('\n4. Testing Razorpay SDK:');
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret
      });
      console.log('   ✅ Razorpay SDK initialized successfully');
    } catch (err) {
      console.log('   ❌ Razorpay SDK error:', err.message);
    }

    // Test 5: Sample Data Check
    console.log('\n5. Checking Sample Data:');
    const PetInventoryItem = require('./modules/petshop/models/PetInventoryItem');
    const availablePets = await PetInventoryItem.countDocuments({ 
      isActive: true, 
      status: 'available_for_sale' 
    });
    console.log(`   📊 Available pets for sale: ${availablePets}`);
    
    if (availablePets === 0) {
      console.log('   ⚠️  No pets available for sale. Add some inventory to test payments.');
    }

    // Test 6: Payment History Model
    console.log('\n6. Testing Pet History Model:');
    try {
      const PetHistory = require('./models/PetHistory');
      const historyCount = await PetHistory.countDocuments();
      console.log(`   📊 Total history events: ${historyCount}`);
      console.log('   ✅ Pet History model working');
    } catch (err) {
      console.log('   ❌ Pet History model error:', err.message);
    }

    console.log('\n🎉 Payment System Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start the backend server: node server.js');
    console.log('   2. Start the frontend: npm start');
    console.log('   3. Create a manager account and add inventory');
    console.log('   4. Create a user account and make a reservation');
    console.log('   5. Test the complete payment flow');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
}

// Run the test
testPaymentSystem();
