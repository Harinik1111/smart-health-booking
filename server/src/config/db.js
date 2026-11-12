const mongoose = require('mongoose');
const { mongoUri } = require('./env');

// Load every model so their indexes are registered before we build them.
require('../models/User');
require('../models/DoctorProfile');
require('../models/PatientProfile');
require('../models/Appointment');
require('../models/AuditLog');

module.exports = async function connectDB() {
  await mongoose.connect(mongoUri);
  // Make sure all indexes (esp. the partial unique slot index) exist BEFORE serving requests.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  console.log('MongoDB connected, indexes ready');
};
