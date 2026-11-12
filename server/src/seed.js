// Optional: creates demo accounts. Safe to run repeatedly (skips existing emails).
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const DoctorProfile = require('./models/DoctorProfile');
const PatientProfile = require('./models/PatientProfile');

const doctors = [
  ['Dr. Anil Sharma', 'Cardiology', 12, 'Apollo Hospitals', 'Hyderabad', 4.8],
  ['Dr. Priya Reddy', 'Dermatology', 8, 'Care Hospitals', 'Vijayawada', 4.6],
  ['Dr. Rahul Verma', 'Orthopedics', 15, 'KIMS Hospital', 'Guntur', 4.7],
  ['Dr. Sneha Iyer', 'Pediatrics', 6, "Rainbow Children's Hospital", 'Vijayawada', 4.9],
  ['Dr. Karthik Rao', 'General Physician', 10, 'Manipal Hospital', 'Vijayawada', 4.4],
];

async function ensureUser(email, password, role) {
  const existing = await User.findOne({ email });
  if (existing) return { user: existing, created: false };
  const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 12), role });
  return { user, created: true };
}

(async () => {
  await connectDB();

  await ensureUser('admin@demo.com', 'Admin@1234', 'admin');

  for (let i = 0; i < doctors.length; i++) {
    const [name, specialization, experienceYears, hospitalName, hospitalLocation, rating] = doctors[i];
    const { user, created } = await ensureUser(`doctor${i + 1}@demo.com`, 'Demo@1234', 'doctor');
    if (created) {
      await DoctorProfile.create({ user: user._id, name, specialization, experienceYears, hospitalName, hospitalLocation, rating });
    }
  }

  const { user, created } = await ensureUser('patient@demo.com', 'Demo@1234', 'patient');
  if (created) await PatientProfile.create({ user: user._id, name: 'Demo Patient', phone: '9876543210', gender: 'male' });

  console.log('Seed complete.');
  console.log('  admin   : admin@demo.com    / Admin@1234');
  console.log('  doctors : doctor1..5@demo.com / Demo@1234');
  console.log('  patient : patient@demo.com  / Demo@1234');
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
