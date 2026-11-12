const DoctorProfile = require('../models/DoctorProfile');
const PatientProfile = require('../models/PatientProfile');
const Appointment = require('../models/Appointment');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

exports.doctors = asyncHandler(async (req, res) => {
  res.json({ doctors: await DoctorProfile.find().populate('user', 'email createdAt').sort({ name: 1 }) });
});

exports.patients = asyncHandler(async (req, res) => {
  res.json({ patients: await PatientProfile.find().populate('user', 'email createdAt').sort({ name: 1 }) });
});

exports.appointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find()
    .populate('patient_id', 'name')
    .populate('doctor_id', 'name specialization')
    .sort({ datetime: -1 });
  res.json({ appointments });
});

exports.auditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().populate('performedBy', 'email').sort({ timestamp: -1 }).limit(200);
  res.json({ logs });
});
