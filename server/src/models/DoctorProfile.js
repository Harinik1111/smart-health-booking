const mongoose = require('mongoose');

const timeRule = /^([01]\d|2[0-3]):(00|30)$/;

const doctorProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true, index: true },
    experienceYears: { type: Number, required: true, min: 0, max: 70 },
    hospitalName: { type: String, required: true, trim: true },
    hospitalLocation: { type: String, required: true, trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    // Fixed-slot configuration: slots are generated from these (30-minute blocks)
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // 0 = Sunday ... 6 = Saturday
    workingHours: {
      start: { type: String, default: '09:00', match: timeRule },
      end: { type: String, default: '17:00', match: timeRule },
    },
    slotMinutes: { type: Number, default: 30, enum: [30] },
  },
  { timestamps: true }
);

doctorProfileSchema.index({ name: 'text', specialization: 'text' });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
