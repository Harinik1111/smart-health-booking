const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const { isoWeekKey } = require('../utils/dateUtils');
const { isValidSlot } = require('../utils/slotUtils');
const { ACTIVE } = require('./slotService');
const { maxWeeklyBookings, cancelWindowHours } = require('../config/env');

async function bookAppointment({ patient, doctorId, datetime, reason }) {
  if (!mongoose.isValidObjectId(doctorId)) throw new ApiError(400, 'Invalid doctor id');
  const doctor = await DoctorProfile.findById(doctorId);
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const date = new Date(datetime);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, 'Invalid datetime');
  if (date.getTime() <= Date.now()) throw new ApiError(400, 'Cannot book a slot in the past');
  if (!isValidSlot(doctor, date)) {
    throw new ApiError(400, "That is not a valid 30-minute slot within the doctor's working hours");
  }

  const weekKey = isoWeekKey(date);
  const weeklyFilter = { patient_id: patient._id, doctor_id: doctor._id, weekKey, status: { $in: ACTIVE } };

  if ((await Appointment.countDocuments(weeklyFilter)) >= maxWeeklyBookings) {
    throw new ApiError(400, `You can book at most ${maxWeeklyBookings} appointments per doctor per week`);
  }

  let appt;
  try {
    appt = await Appointment.create({
      doctor_id: doctor._id,
      patient_id: patient._id,
      datetime: date,
      weekKey,
      reason,
    });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'Sorry, that slot has just been booked by someone else');
    throw err;
  }

  // Concurrency guard for the weekly limit: if parallel requests slipped past the first check, undo.
  if ((await Appointment.countDocuments(weeklyFilter)) > maxWeeklyBookings) {
    await Appointment.deleteOne({ _id: appt._id });
    throw new ApiError(400, `You can book at most ${maxWeeklyBookings} appointments per doctor per week`);
  }
  return appt;
}

const noTxnSupport = (e) => e.codeName === 'IllegalOperation' || /replica set|Transaction numbers/i.test(e.message || '');

async function cancelAppointment({ user, profile, appointmentId, reason }) {
  if (!mongoose.isValidObjectId(appointmentId)) throw new ApiError(400, 'Invalid appointment id');
  const appt = await Appointment.findById(appointmentId);
  if (!appt) throw new ApiError(404, 'Appointment not found');

  // Ownership: patient owns it, the doctor it is with, or admin
  const owns =
    user.role === 'admin' ||
    (user.role === 'patient' && profile && String(appt.patient_id) === String(profile._id)) ||
    (user.role === 'doctor' && profile && String(appt.doctor_id) === String(profile._id));
  if (!owns) throw new ApiError(403, 'You cannot cancel this appointment');

  if (appt.status !== 'booked') throw new ApiError(400, 'Only booked appointments can be cancelled');

  const hoursLeft = (appt.datetime.getTime() - Date.now()) / 3600000;
  if (hoursLeft < cancelWindowHours) {
    throw new ApiError(400, `Appointments can only be cancelled at least ${cancelWindowHours} hours in advance`);
  }

  const cleanReason = (reason || '').trim().slice(0, 500) || 'No reason provided';

  // Cancel + audit-log atomically (transaction). Falls back gracefully on a standalone local MongoDB.
  const write = async (session) => {
    const opts = session ? { session } : {};
    const updated = await Appointment.findOneAndUpdate(
      { _id: appt._id, status: 'booked' },
      { status: 'cancelled', cancelledAt: new Date(), cancelledBy: user._id, cancellationReason: cleanReason },
      { new: true, ...opts }
    );
    if (!updated) throw new ApiError(409, 'Appointment was already cancelled');
    await AuditLog.create(
      [
        {
          action: 'APPOINTMENT_CANCELLED',
          appointment_id: appt._id,
          performedBy: user._id,
          performedByRole: user.role,
          reason: cleanReason,
          appointmentDatetime: appt.datetime,
        },
      ],
      opts
    );
    return updated;
  };

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await write(session);
    });
    return result;
  } catch (err) {
    if (noTxnSupport(err)) return write(null);
    throw err;
  } finally {
    session.endSession();
  }
}

module.exports = { bookAppointment, cancelAppointment };
