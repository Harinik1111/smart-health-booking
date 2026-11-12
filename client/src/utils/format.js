import { format } from 'date-fns';
import { CANCEL_HOURS } from './constants';

const SLOT_MS = 30 * 60000;

export const fmtDate = (iso) => format(new Date(iso), 'EEE, dd MMM yyyy');
export const fmtTime = (iso) => format(new Date(iso), 'hh:mm a');
export const fmtSlot = (iso) =>
  `${fmtDate(iso)} · ${fmtTime(iso)} – ${format(new Date(new Date(iso).getTime() + SLOT_MS), 'hh:mm a')}`;
export const isFuture = (iso) => new Date(iso).getTime() > Date.now();

// Booked, and still at least CANCEL_HOURS away
export const canCancel = (appt) =>
  appt.status === 'booked' && new Date(appt.datetime).getTime() - Date.now() >= CANCEL_HOURS * 3600000;

export const ageFrom = (dob) =>
  dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000)) : null;
