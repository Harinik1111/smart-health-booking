const Appointment = require('../models/Appointment');
const ApiError = require('../utils/ApiError');
const { localToUtc, addDaysStr, isValidDateStr } = require('../utils/dateUtils');
const { generateDaySlots, SLOT_MS } = require('../utils/slotUtils');

const ACTIVE = ['booked', 'completed'];
const MAX_RANGE_DAYS = 42;

/**
 * Returns the slots of `doctor` between clinic-local dates `from`..`to` (inclusive).
 * Role-based visibility:
 *   - patient (or a doctor looking at someone else's calendar): ONLY future, available slots
 *   - the doctor themself, and admin: the FULL schedule (booked + available), with patient details
 */
async function getSlots(doctor, from, to, viewer) {
  if (!isValidDateStr(from) || !isValidDateStr(to)) throw new ApiError(400, 'from and to must be YYYY-MM-DD');
  if (to < from) throw new ApiError(400, '"to" must not be before "from"');
  const days = [];
  for (let d = from; d <= to; d = addDaysStr(d, 1)) days.push(d);
  if (days.length > MAX_RANGE_DAYS) throw new ApiError(400, `Range too large (max ${MAX_RANGE_DAYS} days)`);

  const rangeStart = localToUtc(from);
  const rangeEnd = localToUtc(addDaysStr(to, 1));
  const booked = await Appointment.find({
    doctor_id: doctor._id,
    status: { $in: ACTIVE },
    datetime: { $gte: rangeStart, $lt: rangeEnd },
  }).populate('patient_id', 'name phone');
  const bookedByTime = new Map(booked.map((a) => [a.datetime.getTime(), a]));

  const fullView =
    viewer.role === 'admin' ||
    (viewer.role === 'doctor' && viewer.profile && String(viewer.profile._id) === String(doctor._id));
  const now = Date.now();

  const slots = [];
  for (const day of days) {
    for (const start of generateDaySlots(doctor, day)) {
      const appt = bookedByTime.get(start.getTime());
      const past = start.getTime() <= now;
      if (!fullView && (appt || past)) continue; // patients never see occupied or past slots

      const slot = {
        start: start.toISOString(),
        end: new Date(start.getTime() + SLOT_MS).toISOString(),
        status: appt ? 'booked' : 'available',
        past,
      };
      if (fullView && appt) {
        slot.appointment = {
          _id: appt._id,
          status: appt.status,
          reason: appt.reason,
          patient: appt.patient_id ? { name: appt.patient_id.name, phone: appt.patient_id.phone } : null,
        };
      }
      slots.push(slot);
    }
  }
  return slots;
}

module.exports = { getSlots, ACTIVE };
