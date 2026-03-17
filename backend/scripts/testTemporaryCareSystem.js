const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const TemporaryCareApplication = require('../modules/temporary-care/models/TemporaryCareApplication');
const Pet = require('../core/models/Pet');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petconnect');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

const testTemporaryCareSystem = async () => {
  console.log('🧪 TESTING TEMPORARY CARE SYSTEM');
  console.log('=================================\n');
  
  try {
    // Find applications for the specific user
    const userEmail = 'albinjiji17@gmail.com';
    console.log(`🔍 Looking for applications for user: ${userEmail}`);
    
    // First, find the user ID
    const User = require('../core/models/User');
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (ID: ${user._id})`);
    
    // Find applications for this user
    const applications = await TemporaryCareApplication.find({ userId: user._id })
      .sort({ createdAt: -1 });
    
    console.log(`\n📊 Found ${applications.length} applications for this user:`);
    
    applications.forEach((app, index) => {
      console.log(`\n  Application ${index + 1}:`);
      console.log(`    ID: ${app._id}`);
      console.log(`    Number: ${app.applicationNumber}`);
      console.log(`    Status: ${app.status}`);
      console.log(`    Pets: ${app.pets?.length || 0}`);
      console.log(`    Start Date: ${app.startDate}`);
      console.log(`    End Date: ${app.endDate}`);
      console.log(`    Advance Payment: ${app.paymentStatus?.advance?.status || 'pending'}`);
      console.log(`    Final Payment: ${app.paymentStatus?.final?.status || 'pending'}`);
      console.log(`    Has Pickup OTP: ${!!app.handover?.pickup?.otp}`);
      console.log(`    OTP Used: ${app.handover?.pickup?.otpUsed || false}`);
      
      if (app.pets && app.pets.length > 0) {
        console.log(`    Pet IDs: ${app.pets.map(p => p.petId).join(', ')}`);
      }
    });
    
    // Check pets with temporary care status
    console.log(`\n🐾 CHECKING PETS WITH TEMPORARY CARE STATUS:`);
    
    const petsInTempCare = await Pet.find({
      'temporaryCareStatus.inCare': true
    });
    
    console.log(`📊 Found ${petsInTempCare.length} pets currently in temporary care:`);
    
    petsInTempCare.forEach((pet, index) => {
      console.log(`\n  Pet ${index + 1}:`);
      console.log(`    Name: ${pet.name}`);
      console.log(`    Code: ${pet.petCode}`);
      console.log(`    Owner ID: ${pet.ownerId}`);
      console.log(`    Current Location: ${pet.currentLocation}`);
      console.log(`    Temp Care Application ID: ${pet.temporaryCareStatus?.applicationId}`);
      console.log(`    Temp Care Start: ${pet.temporaryCareStatus?.startDate}`);
      console.log(`    Temp Care Expected End: ${pet.temporaryCareStatus?.expectedEndDate}`);
    });
    
    // Test the getTodaySchedule logic
    console.log(`\n📅 TESTING TODAY'S SCHEDULE LOGIC:`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const activeApplications = await TemporaryCareApplication.find({
      status: 'active_care'
    }).populate('userId', 'name email phone');
    
    console.log(`📊 Found ${activeApplications.length} active applications:`);
    
    for (const app of activeApplications) {
      console.log(`\n  Active Application:`);
      console.log(`    ID: ${app._id}`);
      console.log(`    Number: ${app.applicationNumber}`);
      console.log(`    User: ${app.userId?.name} (${app.userId?.email})`);
      console.log(`    Status: ${app.status}`);
      console.log(`    Final Payment: ${app.paymentStatus?.final?.status}`);
      console.log(`    Ready for Pickup: ${app.paymentStatus?.final?.status === 'completed' ? 'YES' : 'NO'}`);
      
      // Check if this would appear in today's schedule
      const endDate = new Date(app.endDate);
      const isCheckoutToday = endDate >= today && endDate < tomorrow;
      console.log(`    Checkout Today: ${isCheckoutToday ? 'YES' : 'NO'}`);
    }
    
    console.log(`\n✅ SYSTEM TEST COMPLETED`);
    
  } catch (error) {
    console.error('❌ Error testing system:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('📡 Database connection closed');
    }
  }
}

async function main() {
  await connectDB();
  await testTemporaryCareSystem();
}

if (require.main === module) {
  main();
}

module.exports = { testTemporaryCareSystem };