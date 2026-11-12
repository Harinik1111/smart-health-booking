require('dotenv').config();

['MONGO_URI', 'JWT_SECRET'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
});

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  adminSignupCode: process.env.ADMIN_SIGNUP_CODE || '',
  tzOffsetMinutes: Number(process.env.SLOT_TZ_OFFSET_MINUTES ?? 330),

  // Business rules
  slotMinutes: 30,
  maxWeeklyBookings: 2, // per patient, per doctor, per calendar week
  cancelWindowHours: 6, // cancel at least this many hours before the slot
  reminderHoursBefore: 24,

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Smart Health <no-reply@smarthealth.local>',
  },
};
