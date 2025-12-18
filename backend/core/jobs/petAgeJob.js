const cron = require('node-cron');
const PetAgeService = require('../services/PetAgeService');

/**
 * Pet Age Job
 * Automatically updates pet ages daily
 */

// Schedule daily age updates at 1:00 AM
const scheduleDailyAgeUpdates = () => {
  cron.schedule('0 1 * * *', async () => {
    try {
      console.log('⏰ Starting daily pet age update job...');
      const startTime = Date.now();
      
      const updatedTrackers = await PetAgeService.updateAllAges();
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; // in seconds
      
      console.log(`✅ Daily pet age update completed. Updated ${updatedTrackers.length} pets in ${duration} seconds.`);
    } catch (error) {
      console.error('❌ Error in daily pet age update job:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });
  
  console.log('📅 Pet age update job scheduled for daily execution at 1:00 AM');
};

module.exports = {
  scheduleDailyAgeUpdates
};