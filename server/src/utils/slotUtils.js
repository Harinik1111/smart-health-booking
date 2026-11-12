// Pure slot-generation helpers (no DB access)
const { localToUtc, localDateStr } = require('./dateUtils');
const { slotMinutes } = require('../config/env');

const SLOT_MS = slotMinutes * 60000;

// All slot start times (UTC Dates) for one clinic-local day
function generateDaySlots(doctor, dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (!doctor.workingDays.includes(dow)) return [];
  const start = localToUtc(dateStr, doctor.workingHours.start).getTime();
  const end = localToUtc(dateStr, doctor.workingHours.end).getTime();
  const slots = [];
  for (let t = start; t + SLOT_MS <= end; t += SLOT_MS) slots.push(new Date(t));
  return slots;
}

// Is `date` exactly the start of one of this doctor's real slots?
function isValidSlot(doctor, date) {
  return generateDaySlots(doctor, localDateStr(date)).some((s) => s.getTime() === date.getTime());
}

module.exports = { generateDaySlots, isValidSlot, SLOT_MS };
