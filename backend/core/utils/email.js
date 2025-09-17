const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.EMAIL_USER;

  // Prefer OAuth2 when configured
  const useOAuth2 = (process.env.EMAIL_OAUTH2 === 'true') || (!!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_REFRESH_TOKEN);
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

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user,
        clientId,
        clientSecret,
        refreshToken,
        accessToken,
      },
    });
    return transporter;
  }

  // Fallback to basic SMTP if PASS provided
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT || 587);
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    // Fallback: console log only
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

async function sendMail({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@example.com';
  const tx = getTransporter();
  if (!tx) {
    console.log(`[EMAIL-DRYRUN] No EMAIL_USER/EMAIL_PASS configured. Would send -> to:"${to}" subject:"${subject}"`);
    return { success: true, dryRun: true };
  }
  try {
    const usingOAuth2 = tx.options?.auth?.type === 'OAuth2';
    const via = usingOAuth2 ? 'gmail-oauth2' : `${tx.options.host}:${tx.options.port}`;
    console.log(`[EMAIL] Sending to:"${to}" subject:"${subject}" via ${via}`);
    const info = await tx.sendMail({ from, to, subject, html });
    console.log(`[EMAIL] Success messageId:${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL] Failed to send to:"${to}" subject:"${subject}" error:`, err.message);
    throw err;
  }
}

module.exports = { sendMail };


