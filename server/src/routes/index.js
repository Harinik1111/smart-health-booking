const express = require('express');
const rateLimit = require('express-rate-limit');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const auth = require('../controllers/authController');
const doctors = require('../controllers/doctorController');
const appts = require('../controllers/appointmentController');
const admin = require('../controllers/adminController');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });

// Auth
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', authenticate, auth.me);

// Doctors (any logged-in user)
router.get('/doctors', authenticate, doctors.listDoctors);
router.get('/doctors/:id', authenticate, doctors.getDoctor);
router.get('/doctors/:id/slots', authenticate, doctors.getDoctorSlots);

// Appointments
router.post('/appointments', authenticate, authorize('patient'), appts.book);
router.get('/appointments/me', authenticate, authorize('patient', 'doctor'), appts.mine);
router.patch('/appointments/:id/cancel', authenticate, authorize('patient', 'doctor', 'admin'), appts.cancel);

// Admin
router.get('/admin/doctors', authenticate, authorize('admin'), admin.doctors);
router.get('/admin/patients', authenticate, authorize('admin'), admin.patients);
router.get('/admin/appointments', authenticate, authorize('admin'), admin.appointments);
router.get('/admin/audit-logs', authenticate, authorize('admin'), admin.auditLogs);

module.exports = router;
