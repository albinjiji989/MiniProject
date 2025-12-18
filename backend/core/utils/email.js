const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  const user = process.env.EMAIL_USER;

  // Prefer OAuth2 when configured
  const useOAuth2 = process.env.EMAIL_OAUTH2 === 'true';
  if (useOAuth2) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN; // optional; nodemailer can fetch using refresh token

    if (!user || !clientId || !refreshToken) {
      console.warn('[EMAIL] OAuth2 requested but missing one of EMAIL_USER/GOOGLE_CLIENT_ID/GOOGLE_REFRESH_TOKEN');
      return null;
    }

    // For OAuth2, clientSecret is optional if using refresh token
    if (!clientSecret) {
      console.warn('[EMAIL] GOOGLE_CLIENT_SECRET not set, using refresh token only');
    }

    // Create new transporter each time for OAuth2 to allow switching
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user,
        clientId,
        clientSecret,
        refreshToken,
        accessToken,
      },
      // Add timeout and retry settings
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 30000,     // 30 seconds
    });
  }

  // Fallback to basic SMTP if PASS provided
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT || 587);
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    // Fallback: console log only
    return null;
  }

  // Cache SMTP transporter since it doesn't change
  if (transporter) return transporter;
  
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // Add timeout and retry settings
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 30000,     // 30 seconds
  });
  return transporter;
}

// Add retry mechanism for sending emails
async function sendMailWithRetry({ to, subject, html }, maxRetries = 3) {
  // Use the admin email as the sender for all emails if configured
  const fromEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || process.env.SMTP_EMAIL || process.env.EMAIL_USER || 'noreply@example.com';
  const fromName = process.env.FROM_NAME || 'Pet Adoption Center';
  const from = `"${fromName}" <${fromEmail}>`;
  
  const tx = getTransporter();
  if (!tx) {
    console.log(`[EMAIL-DRYRUN] No EMAIL_USER/EMAIL_PASS configured. Would send -> to:"${to}" subject:"${subject}"`);
    return { success: true, dryRun: true };
  }
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const usingOAuth2 = tx.options?.auth?.type === 'OAuth2';
      const via = usingOAuth2 ? 'gmail-oauth2' : `${tx.options.host}:${tx.options.port}`;
      console.log(`[EMAIL] Sending to:"${to}" subject:"${subject}" via ${via} (attempt ${attempt}/${maxRetries})`);
      const info = await tx.sendMail({ from, to, subject, html });
      console.log(`[EMAIL] Success messageId:${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      lastError = err;
      console.error(`[EMAIL] Failed to send to:"${to}" subject:"${subject}" attempt ${attempt}/${maxRetries} error:`, err.message);
      
      // Don't retry on certain errors that won't improve with retries
      if (err.code === 'EAUTH' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2^attempt seconds
        console.log(`[EMAIL] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

async function sendMail({ to, subject, html }) {
  try {
    return await sendMailWithRetry({ to, subject, html });
  } catch (error) {
    // If OAuth2 failed, try falling back to SMTP
    if (error.code === 'EAUTH' && process.env.EMAIL_OAUTH2 === 'true') {
      console.log('[EMAIL] OAuth2 failed, attempting fallback to SMTP...');
      
      // Temporarily disable OAuth2
      const originalOAuth2 = process.env.EMAIL_OAUTH2;
      process.env.EMAIL_OAUTH2 = 'false';
      
      // Clear the cached transporter
      transporter = null;
      
      try {
        // Try sending with SMTP
        const result = await sendMailWithRetry({ to, subject, html });
        
        // Restore original setting
        process.env.EMAIL_OAUTH2 = originalOAuth2;
        transporter = null; // Clear transporter to avoid caching issues
        return result;
      } catch (smtpError) {
        // Restore original setting
        process.env.EMAIL_OAUTH2 = originalOAuth2;
        transporter = null; // Clear transporter to avoid caching issues
        
        // Throw the SMTP error instead of the OAuth2 error
        throw smtpError;
      }
    }
    
    // For all other errors, rethrow
    throw error;
  }
}

module.exports = { sendMail };