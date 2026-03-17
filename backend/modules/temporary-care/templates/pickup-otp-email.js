const generatePickupOTPEmail = (data) => {
  const { 
    userName, 
    petName, 
    otp, 
    expiresAt, 
    bookingNumber, 
    storeName,
    storeAddress,
    storePhone 
  } = data;

  const expiryTime = new Date(expiresAt).toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pet Pickup Ready - OTP Required</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: #fff; border: 3px solid #4CAF50; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 36px; font-weight: bold; color: #4CAF50; letter-spacing: 8px; margin: 10px 0; font-family: monospace; }
        .info-box { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
        .warning-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        .pet-icon { font-size: 48px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="pet-icon">🐾</div>
          <h1>Your Pet is Ready for Pickup!</h1>
          <p>Final payment completed successfully</p>
        </div>
        
        <div class="content">
          <h2>Hello ${userName}!</h2>
          
          <p>Great news! Your final payment has been processed and <strong>${petName}</strong> is ready to come home. Please visit our facility to collect your beloved pet.</p>
          
          <div class="info-box">
            <h3>📋 Booking Details</h3>
            <p><strong>Booking Number:</strong> ${bookingNumber}</p>
            <p><strong>Pet Name:</strong> ${petName}</p>
            <p><strong>Care Center:</strong> ${storeName}</p>
          </div>
          
          <div class="otp-box">
            <h3>🔐 Your Pickup OTP</h3>
            <p>Please provide this OTP to our staff when collecting your pet:</p>
            <div class="otp-code">${otp}</div>
            <p><small>This OTP expires on ${expiryTime}</small></p>
          </div>
          
          <div class="warning-box">
            <h3>⚠️ Important Instructions</h3>
            <ul>
              <li>Bring a valid photo ID for verification</li>
              <li>The OTP is valid for 30 minutes only</li>
              <li>Only the registered pet owner can collect the pet</li>
              <li>If you're unable to collect within the time limit, please contact us for a new OTP</li>
            </ul>
          </div>
          
          <div class="info-box">
            <h3>📍 Pickup Location</h3>
            <p><strong>${storeName}</strong></p>
            <p>${storeAddress || 'Please contact for address details'}</p>
            <p><strong>Phone:</strong> ${storePhone || 'Contact through app'}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p>Questions? Need a new OTP?</p>
            <p>Contact our support team or use the app to request a new OTP.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for trusting us with ${petName}'s care!</p>
          <p><small>This is an automated message. Please do not reply to this email.</small></p>
          <p><small>© ${new Date().getFullYear()} PetConnect - Temporary Care Services</small></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { generatePickupOTPEmail };