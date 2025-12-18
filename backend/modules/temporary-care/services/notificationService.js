const { sendMail } = require('../../../core/utils/email');
const { sendSMS } = require('../../../core/utils/sms');
const User = require('../../../core/models/User');

// Send notification to user about care activity
const sendCareActivityNotification = async (userId, careActivity, temporaryCare) => {
  try {
    // Get user details
    const user = await User.findById(userId).select('email phone name');
    if (!user) {
      console.warn('User not found for notification');
      return;
    }
    
    const petName = temporaryCare?.pet?.name || 'your pet';
    const activityType = careActivity.activityType;
    const timestamp = new Date(careActivity.timestamp).toLocaleString();
    
    // Create notification message
    let message = `Good news! Your pet ${petName} received ${activityType} care at ${timestamp}.`;
    if (careActivity.notes) {
      message += ` Notes: ${careActivity.notes}`;
    }
    
    // Send email notification
    if (user.email) {
      const subject = `Update on your pet ${petName} in temporary care`;
      const html = `
      <div style="font-family:Arial, sans-serif; max-width:600px; margin:0 auto;">
        <h2 style="color:#5b8cff;">Pet Care Update</h2>
        <p>Hello ${user.name || 'Pet Parent'},</p>
        <p>We wanted to let you know that your pet <strong>${petName}</strong> received some care:</p>
        <ul>
          <li><strong>Activity:</strong> ${activityType}</li>
          <li><strong>Time:</strong> ${timestamp}</li>
          ${careActivity.notes ? `<li><strong>Notes:</strong> ${careActivity.notes}</li>` : ''}
        </ul>
        <p>Your pet is doing well in our care. We'll continue to provide updates throughout the care period.</p>
        <p>Best regards,<br/>The Temporary Care Team</p>
      </div>`;
      
      try {
        await sendMail({ to: user.email, subject, html });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    }
    
    // Send SMS notification
    if (user.phone) {
      try {
        await sendSMS({ to: user.phone, message });
      } catch (smsError) {
        console.error('Failed to send SMS notification:', smsError);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending care activity notification:', error);
    return { success: false, error: error.message };
  }
};

// Send payment notification
const sendPaymentNotification = async (userId, payment, temporaryCare) => {
  try {
    const user = await User.findById(userId).select('email phone name');
    if (!user) {
      console.warn('User not found for payment notification');
      return;
    }
    
    const petName = temporaryCare?.pet?.name || 'your pet';
    const amount = payment.amount;
    const paymentType = payment.paymentType;
    const status = payment.status;
    
    let message = `Payment ${status} for your pet ${petName}. `;
    if (paymentType === 'advance') {
      message += `Advance payment of ₹${amount} has been ${status}.`;
    } else {
      message += `Final payment of ₹${amount} has been ${status}.`;
    }
    
    // Send email notification
    if (user.email) {
      const subject = `Payment ${status} for ${petName} temporary care`;
      const html = `
      <div style="font-family:Arial, sans-serif; max-width:600px; margin:0 auto;">
        <h2 style="color:#5b8cff;">Payment ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>Hello ${user.name || 'Pet Parent'},</p>
        <p>Your payment for ${petName}'s temporary care has been <strong>${status}</strong>:</p>
        <ul>
          <li><strong>Payment Type:</strong> ${paymentType === 'advance' ? 'Advance (50%)' : 'Final (50%)'}</li>
          <li><strong>Amount:</strong> ₹${amount}</li>
          <li><strong>Status:</strong> ${status}</li>
        </ul>
        <p>Thank you for choosing our temporary care services.</p>
        <p>Best regards,<br/>The Temporary Care Team</p>
      </div>`;
      
      try {
        await sendMail({ to: user.email, subject, html });
      } catch (emailError) {
        console.error('Failed to send payment email notification:', emailError);
      }
    }
    
    // Send SMS notification
    if (user.phone) {
      try {
        await sendSMS({ to: user.phone, message });
      } catch (smsError) {
        console.error('Failed to send payment SMS notification:', smsError);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending payment notification:', error);
    return { success: false, error: error.message };
  }
};

// Send status update notification
const sendStatusUpdateNotification = async (userId, temporaryCare, previousStatus) => {
  try {
    const user = await User.findById(userId).select('email phone name');
    if (!user) {
      console.warn('User not found for status update notification');
      return;
    }
    
    const petName = temporaryCare?.pet?.name || 'your pet';
    const newStatus = temporaryCare.status;
    const startDate = new Date(temporaryCare.startDate).toLocaleDateString();
    const endDate = new Date(temporaryCare.endDate).toLocaleDateString();
    
    let message = `Status update for ${petName}: ${previousStatus} → ${newStatus}. `;
    
    // Customize message based on status
    switch (newStatus) {
      case 'active':
        message += `Your pet's temporary care has started on ${startDate}.`;
        break;
      case 'completed':
        message += `Your pet's temporary care has been completed on ${endDate}.`;
        break;
      case 'cancelled':
        message += `Your pet's temporary care has been cancelled.`;
        break;
      default:
        message += `Status changed to ${newStatus}.`;
    }
    
    // Send email notification
    if (user.email) {
      const subject = `Status update for ${petName} temporary care`;
      const html = `
      <div style="font-family:Arial, sans-serif; max-width:600px; margin:0 auto;">
        <h2 style="color:#5b8cff;">Temporary Care Status Update</h2>
        <p>Hello ${user.name || 'Pet Parent'},</p>
        <p>The status for your pet <strong>${petName}</strong> has been updated:</p>
        <ul>
          <li><strong>Previous Status:</strong> ${previousStatus}</li>
          <li><strong>New Status:</strong> ${newStatus}</li>
          <li><strong>Care Period:</strong> ${startDate} to ${endDate}</li>
        </ul>
        ${newStatus === 'active' ? '<p>Your pet is now in our care. We will provide regular updates.</p>' : ''}
        ${newStatus === 'completed' ? '<p>Your pet\'s temporary care is complete. You can now arrange for pickup.</p>' : ''}
        ${newStatus === 'cancelled' ? '<p>We apologize for any inconvenience. Please contact us for more information.</p>' : ''}
        <p>Best regards,<br/>The Temporary Care Team</p>
      </div>`;
      
      try {
        await sendMail({ to: user.email, subject, html });
      } catch (emailError) {
        console.error('Failed to send status update email notification:', emailError);
      }
    }
    
    // Send SMS notification
    if (user.phone) {
      try {
        await sendSMS({ to: user.phone, message });
      } catch (smsError) {
        console.error('Failed to send status update SMS notification:', smsError);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending status update notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendCareActivityNotification,
  sendPaymentNotification,
  sendStatusUpdateNotification
};