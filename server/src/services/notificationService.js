const cfg = require('../config/env');
const { formatLocal } = require('../utils/dateUtils');

let transporter = null;
if (cfg.smtp.host) {
  try {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: cfg.smtp.host,
      port: cfg.smtp.port,
      auth: cfg.smtp.user ? { user: cfg.smtp.user, pass: cfg.smtp.pass } : undefined,
    });
  } catch (e) {
    console.warn('SMTP configured but nodemailer unavailable; falling back to console reminders');
  }
}

// Sends a 24h reminder. Uses real email if SMTP_* is set, otherwise logs a mock notification.
async function sendReminder({ to, patientName, doctorName, datetime }) {
  const when = formatLocal(datetime);
  const subject = `Reminder: appointment with ${doctorName} on ${when}`;
  const text = `Hi ${patientName},\n\nThis is a reminder of your appointment with ${doctorName} at ${when}.\n\nSmart Health`;

  if (transporter) {
    await transporter.sendMail({ from: cfg.smtp.from, to, subject, text });
    return;
  }
  console.log(`[MOCK REMINDER] to=${to} | ${subject}`);
}

module.exports = { sendReminder };
