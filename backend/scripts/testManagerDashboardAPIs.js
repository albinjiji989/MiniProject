const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const CareBooking = require('../modules/temporary-care/models/CareBooking');
const TemporaryCareApplication = require('../modules/temporary-care/models/TemporaryCareApplication');
const TemporaryCareRequest = require('../modules/temporary-care/user/models/TemporaryCareRequest');
const TemporaryCare = require('../modules/temporary-care/models/TemporaryCare');
const TemporaryCarePayment = require('../modules/temporary-care/models/TemporaryCarePayment');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petconnect');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

const testManagerDashboardAPIs = async () => {
  console.log('🧪 TESTING MANAGER DASHBOARD API DATA');
  console.log('=====================================\n');
  
  try {
    // Test what the dashboard APIs would return
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Test CareBooking system (newer)
    const allBookings = await CareBooking.find({});
    console.log(`📊 Total CareBookings in database: ${allBookings.length}`);
    
    if (allBookings.length > 0) {
      console.log('\n🔍 CareBooking System Data:');
      allBookings.forEach((booking, index) => {
        console.log(`  Booking ${index + 1}:`, {
          id: booking._id,
          bookingNumber: booking.bookingNumber,
          petId: booking.petId,
          userId: booking.userId,
          status: booking.status,
          advancePayment: booking.paymentStatus?.advance?.status,
          finalPayment: booking.paymentStatus?.final?.status,
          hasHandover: !!booking.handover,
          hasPickupOTP: !!booking.handover?.pickup?.otp?.code
        });
      });
    }
    
    // Test TemporaryCareApplication system (older)
    const allApplications = await TemporaryCareApplication.find({});
    console.log(`\n📊 Total TemporaryCareApplications in database: ${allApplications.length}`);
    
    if (allApplications.length > 0) {
      console.log('\n🔍 TemporaryCareApplication System Data:');
      allApplications.forEach((app, index) => {
        console.log(`  Application ${index + 1}:`, {
          id: app._id,
          applicationNumber: app.applicationNumber,
          userId: app.userId,
          status: app.status,
          advancePayment: app.paymentStatus?.advance?.status,
          finalPayment: app.paymentStatus?.final?.status,
          pets: app.pets?.length || 0
        });
      });
    }
    
    // Test today's schedule from CareBooking system
    const todayBookings = await CareBooking.find({
      status: { $in: ['confirmed', 'in_progress'] },
      $or: [
        { startDate: { $gte: today, $lt: tomorrow } },
        { endDate: { $gte: today, $lt: tomorrow } },
        { startDate: { $lte: today }, endDate: { $gte: tomorrow } }
      ]
    });
    console.log(`\n📊 Today's CareBookings: ${todayBookings.length}`);
    
    // Test today's schedule from TemporaryCareApplication system
    const activeApplications = await TemporaryCareApplication.find({
      status: 'active_care'
    });
    console.log(`📊 Active TemporaryCareApplications: ${activeApplications.length}`);
    
    console.log('\n🎯 ANALYSIS:');
    console.log('===========');
    if (allBookings.length === 0 && allApplications.length > 0) {
      console.log('⚠️  USER IS USING TEMPORARYCAREAPPLICATION SYSTEM (older)');
      console.log('⚠️  MANAGER DASHBOARD IS CHECKING CAREBOOKING SYSTEM (newer)');
      console.log('⚠️  THIS IS THE MISMATCH CAUSING THE ISSUE!');
    } else if (allBookings.length > 0 && allApplications.length === 0) {
      console.log('✅ USER IS USING CAREBOOKING SYSTEM (newer)');
      console.log('✅ MANAGER DASHBOARD IS CHECKING CAREBOOKING SYSTEM (newer)');
      console.log('✅ SYSTEMS ARE ALIGNED');
    } else if (allBookings.length > 0 && allApplications.length > 0) {
      console.log('⚠️  BOTH SYSTEMS HAVE DATA - NEED TO CHECK WHICH IS ACTIVE');
    } else {
      console.log('❌ NO DATA IN EITHER SYSTEM');
    }
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('📡 Database connection closed');
    }
  }
}

async function main() {
  await connectDB();
  await testManagerDashboardAPIs();
}

if (require.main === module) {
  main();
}

module.exports = { testManagerDashboardAPIs };