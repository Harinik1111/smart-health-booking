const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, match: [/^[0-9+\-\s]{7,15}$/, 'Invalid phone number'] },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
