// Placeholder SMS utility
module.exports = {
  sendSMS: async ({ to, message }) => {
    console.log(`SMS queued → to:${to} message:${message}`);
    return { success: true };
  }
};


