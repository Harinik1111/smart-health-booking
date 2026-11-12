const { tzOffsetMinutes } = require('../config/env');

const MIN = 60000;
const pad = (n) => String(n).padStart(2, '0');

// Local "YYYY-MM-DD" (+ "HH:mm") in the clinic timezone -> UTC Date
function localToUtc(dateStr, timeStr = '00:00') {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - tzOffsetMinutes * MIN);
}

// UTC Date -> clinic-local parts
function toLocalParts(date) {
  const l = new Date(date.getTime() + tzOffsetMinutes * MIN);
  return { y: l.getUTCFullYear(), m: l.getUTCMonth() + 1, d: l.getUTCDate(), dow: l.getUTCDay() };
}

function localDateStr(date) {
  const { y, m, d } = toLocalParts(date);
  return `${y}-${pad(m)}-${pad(d)}`;
}

// ISO week key (Mon-Sun weeks) computed on the clinic-local date, e.g. "2026-W46"
function isoWeekKey(date) {
  const { y, m, d } = toLocalParts(date);
  const t = new Date(Date.UTC(y, m - 1, d));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${pad(week)}`;
}

function isValidDateStr(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

function addDaysStr(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function formatLocal(date) {
  const l = new Date(date.getTime() + tzOffsetMinutes * MIN);
  const sign = tzOffsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(tzOffsetMinutes);
  return `${l.toISOString().replace('T', ' ').slice(0, 16)} (UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)})`;
}

module.exports = { localToUtc, toLocalParts, localDateStr, isoWeekKey, isValidDateStr, addDaysStr, formatLocal };
