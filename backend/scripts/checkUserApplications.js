const mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petconnect');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

const checkUserApplications = async () => {
  console.log('🔍 CHECKING USER APPLICATIONS');
  console.log('=============================\n');
  
  try {
    const User = require('../core/models/User');
    const TemporaryCareApplication = require('../modules/temporary-care/models/TemporaryCareApplication');
    
    // Find the specific user
    const userEmail = 'albinjiji17@gmail.com';
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found:', userEmail);
      return;
    }
    
    console.log('✅ Found user:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    // Find all applications for this user
    const applications = await TemporaryCareApplication.find({ userId: user._id })
      .sort({ createdAt: -1 });
    
    console.log(`\n📊 Found ${applications.length} applications for this user:\n`);
    
    applications.forEach((app, index) => {
      console.log(`Application ${index + 1}:`);
      console.log(`  ID: ${app._id}`);
      console.log(`  Number: ${app.applicationNumber}`);
      console.log(`  Status: ${app.status}`);
      console.log(`  Center ID: ${app.centerId}`);
      console.log(`  Start Date: ${app.startDate}`);
      console.log(`  End Date: ${app.endDate}`);
      console.log(`  Pets: ${app.pets?.length || 0}`);
      if (app.pets && app.pets.length > 0) {
        app.pets.forEach((pet, petIndex) => {
          console.log(`    Pet ${petIndex + 1}: ${pet.petId}`);
        });
      }
      console.log(`  Payment Status:`);
      console.log(`    Advance: ${app.paymentStatus?.advance?.status || 'pending'}`);
      console.log(`    Final: ${app.paymentStatus?.final?.status || 'pending'}`);
      console.log(`  Handover:`);
      console.log(`    Pickup OTP: ${app.handover?.pickup?.otp || 'none'}`);
      console.log(`    OTP Used: ${app.handover?.pickup?.otpUsed || false}`);
      console.log(`  Created: ${app.createdAt}`);
      console.log(`  Updated: ${app.updatedAt}`);
      console.log('  ---');
    });
    
    // Check what the manager dashboard query would return
    console.log('\n🔍 TESTING MANAGER DASHBOARD QUERIES:\n');
    
    // Test the current query (only active_care)
    const activeOnly = await TemporaryCareApplication.find({
      status: 'active_care'
    });
    console.log(`Query "status: 'active_care'" returns: ${activeOnly.length} applications`);
    
    // Test the improved query (multiple statuses)
    const multipleStatuses = await TemporaryCareApplication.find({
      status: { $in: ['active_care', 'approved', 'advance_paid'] }
    });
    console.log(`Query "status: ['active_care', 'approved', 'advance_paid']" returns: ${multipleStatuses.length} applications`);
    
    // Test today's schedule logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayCheckouts = await TemporaryCareApplication.find({
      status: { $in: ['active_care', 'approved', 'advance_paid'] },
      endDate: { $gte: today, $lt: tomorrow }
    });
    console.log(`Applications ending today: ${todayCheckouts.length}`);
    
    const readyForPickup = await TemporaryCareApplication.find({
      status: { $in: ['active_care', 'approved', 'advance_paid'] },
      'paymentStatus.final.status': 'completed'
    });
    console.log(`Applications with final payment completed: ${readyForPickup.length}`);
    
    if (readyForPickup.length > 0) {
      console.log('\nApplications ready for pickup:');
      readyForPickup.forEach((app, index) => {
        console.log(`  ${index + 1}. ${app.applicationNumber} - ${app.status} - Final: ${app.paymentStatus.final.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📡 Database connection closed');
    }
  }
};

async function main() {
  await connectDB();
  await checkUserApplications();
}

if (require.main === module) {
  main();
}

module.exports = { checkUserApplications };