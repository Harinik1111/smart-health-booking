const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { bookAppointment, cancelAppointment } = require('../services/appointmentService');

exports.book = asyncHandler(async (req, res) => {
  if (!req.profile) throw new ApiError(403, 'Patient profile not found');
  const { doctorId, datetime, reason } = req.body;
  const appointment = await bookAppointment({ patient: req.profile, doctorId, datetime, reason });
  res.status(201).json({ appointment });
});

// Appointments of the logged-in patient or doctor
exports.mine = asyncHandler(async (req, res) => {
  if (!req.profile) throw new ApiError(403, 'Profile not found');
  const appointments =
    req.user.role === 'patient'
      ? await Appointment.find({ patient_id: req.profile._id })
          .populate('doctor_id', 'name specialization hospitalName hospitalLocation')
          .sort({ datetime: -1 })
      : await Appointment.find({ doctor_id: req.profile._id })
          .populate('patient_id', 'name phone gender dateOfBirth')
          .sort({ datetime: -1 });
  res.json({ appointments });
});

exports.cancel = asyncHandler(async (req, res) => {
  const appointment = await cancelAppointment({
    user: req.user,
    profile: req.profile,
    appointmentId: req.params.id,
    reason: req.body.reason,
  });
  res.json({ appointment });
});
