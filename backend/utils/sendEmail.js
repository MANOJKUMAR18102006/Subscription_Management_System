const nodemailer = require('nodemailer');

/**
 * Send email utility
 * If SMTP credentials are provided, attempts SMTP delivery.
 * In development or when SMTP is unconfigured, uses nodemailer stream/json transport
 * and logs the full simulated email to console for instantaneous response without network delays.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    let transporter;
    const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS;

    if (hasSmtpConfig) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000
      });
    } else {
      // Local dev / test JSON transporter: ultra-fast, zero external network dependency
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }

    const message = {
      from: `"${process.env.FROM_NAME || 'Subscription Management'}" <${process.env.FROM_EMAIL || 'noreply@subscriptionms.com'}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(message);

    console.log(`[Email Service] Notification generated for ${to} | Subject: "${subject}"`);
    if (info.message) {
      console.log(`[Email Service Content Preview]:`, info.message.toString().substring(0, 150) + '...');
    }

    return {
      success: true,
      messageId: info.messageId || `msg_${Date.now()}`
    };
  } catch (error) {
    console.error(`[Email Error]: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = sendEmail;
