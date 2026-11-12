const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendReminder } = require('../services/notificationService');
const { reminderHoursBefore } = require('../config/env');

// Sends a reminder for every booked appointment starting within the next 24h (once each).
async function runReminders() {
  const now = new Date();
  const horizon = new Date(now.getTime() + reminderHoursBefore * 3600000);

  const due = await Appointment.find({
    status: 'booked',
    reminderSent: false,
    datetime: { $gt: now, $lte: horizon },
  }).select('_id');

  for (const { _id } of due) {
    // Atomically "claim" the reminder so two server instances never send it twice.
    const appt = await Appointment.findOneAndUpdate(
      { _id, reminderSent: false, status: 'booked' },
      { reminderSent: true },
      { new: true }
    )
      .populate({ path: 'patient_id', populate: { path: 'user', select: 'email' } })
      .populate('doctor_id', 'name');
    if (!appt) continue;

    try {
      await sendReminder({
        to: appt.patient_id.user.email,
        patientName: appt.patient_id.name,
        doctorName: appt.doctor_id.name,
        datetime: appt.datetime,
      });
    } catch (err) {
      console.error('Reminder failed, will retry next run:', err.message);
      await Appointment.updateOne({ _id }, { reminderSent: false });
    }
  }
}

// Marks booked appointments that ended more than 30 minutes ago as completed.
async function completePastAppointments() {
  await Appointment.updateMany(
    { status: 'booked', datetime: { $lt: new Date(Date.now() - 60 * 60000) } },
    { status: 'completed' }
  );
}

function startJobs() {
  cron.schedule('*/5 * * * *', () => runReminders().catch((e) => console.error('Reminder job error:', e)));
  cron.schedule('0 * * * *', () => completePastAppointments().catch((e) => console.error('Complete job error:', e)));
  runReminders().catch((e) => console.error('Reminder job error:', e)); // also run once on startup
  console.log('Background jobs scheduled (reminders every 5 min)');
}

module.exports = { startJobs, runReminders };
