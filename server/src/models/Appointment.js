const mongoose = require('mongoose');

const STATUSES = ['booked', 'cancelled', 'completed'];

const appointmentSchema = new mongoose.Schema(
  {
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', required: true },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientProfile', required: true },

    // Exact slot START time (UTC) on a 30-minute boundary
    datetime: {
      type: Date,
      required: true,
      validate: {
        validator: (d) =>
          d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0 && [0, 30].includes(d.getUTCMinutes()),
        message: 'datetime must be a 30-minute slot start (e.g. 10:00, 10:30)',
      },
    },

    // e.g. "2026-W46" -> makes the "2 per doctor per week" check a fast indexed count
    weekKey: { type: String, required: true },

    status: { type: String, enum: STATUSES, default: 'booked', index: true },
    reason: { type: String, trim: true, maxlength: 500 },

    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancellationReason: { type: String, trim: true, maxlength: 500 },

    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// STRICT double-booking protection. Cancelled rows are excluded, so a cancelled slot can be rebooked.
// (`$in` inside a partial filter needs MongoDB 6.0+, which Atlas free tier satisfies.)
appointmentSchema.index(
  { doctor_id: 1, datetime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['booked', 'completed'] } },
    name: 'uniq_active_doctor_slot',
  }
);

appointmentSchema.index({ patient_id: 1, doctor_id: 1, weekKey: 1, status: 1 });
appointmentSchema.index({ status: 1, reminderSent: 1, datetime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
module.exports.STATUSES = STATUSES;
