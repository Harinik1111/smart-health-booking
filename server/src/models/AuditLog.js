const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, enum: ['APPOINTMENT_CANCELLED'], required: true },
    appointment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    performedByRole: { type: String, enum: ['doctor', 'patient', 'admin'], required: true },
    reason: { type: String, trim: true, maxlength: 500, default: 'No reason provided' },
    appointmentDatetime: { type: Date, required: true }, // snapshot of the cancelled slot
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } } // append-only
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
