const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const PatientProfile = require('../models/PatientProfile');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { jwtSecret } = require('../config/env');

// Verifies the JWT, then attaches req.user and req.profile (doctor/patient profile; null for admin)
module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, 'User no longer exists');

  req.user = user;
  req.profile =
    user.role === 'doctor'
      ? await DoctorProfile.findOne({ user: user._id })
      : user.role === 'patient'
      ? await PatientProfile.findOne({ user: user._id })
      : null;
  next();
});
