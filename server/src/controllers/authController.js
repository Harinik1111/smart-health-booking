const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const PatientProfile = require('../models/PatientProfile');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const cfg = require('../config/env');

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, cfg.jwtSecret, { expiresIn: cfg.jwtExpiresIn });
const publicUser = (user, profile) => ({ id: user._id, email: user.email, role: user.role, profile: profile || null });
const loadProfile = async (user) =>
  user.role === 'doctor'
    ? DoctorProfile.findOne({ user: user._id })
    : user.role === 'patient'
    ? PatientProfile.findOne({ user: user._id })
    : null;

exports.register = asyncHandler(async (req, res) => {
  const { email, password, role, name } = req.body;
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) throw new ApiError(400, 'A valid email is required');
  if (typeof password !== 'string' || password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');
  if (!['doctor', 'patient', 'admin'].includes(role)) throw new ApiError(400, 'Role must be doctor, patient or admin');
  if (role !== 'admin' && (typeof name !== 'string' || !name.trim())) throw new ApiError(400, 'Name is required');
  if (role === 'admin' && (!cfg.adminSignupCode || req.body.adminCode !== cfg.adminSignupCode)) {
    throw new ApiError(403, 'Invalid admin signup code');
  }
  if (await User.exists({ email: email.toLowerCase() })) throw new ApiError(409, 'Email is already registered');

  const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 12), role });

  let profile = null;
  try {
    if (role === 'doctor') {
      const { specialization, experienceYears, hospitalName, hospitalLocation, workingHours, workingDays } = req.body;
      profile = await DoctorProfile.create({
        user: user._id,
        name,
        specialization,
        experienceYears,
        hospitalName,
        hospitalLocation,
        ...(workingHours && { workingHours }),
        ...(workingDays && { workingDays }),
      });
    } else if (role === 'patient') {
      const { phone, dateOfBirth, gender } = req.body;
      profile = await PatientProfile.create({
        user: user._id,
        name,
        ...(phone && { phone }),
        ...(dateOfBirth && { dateOfBirth }),
        ...(gender && { gender }),
      });
    }
  } catch (err) {
    await User.findByIdAndDelete(user._id); // don't leave a half-created account behind
    throw err;
  }

  res.status(201).json({ token: signToken(user), user: publicUser(user, profile) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new ApiError(401, 'Invalid email or password');

  res.json({ token: signToken(user), user: publicUser(user, await loadProfile(user)) });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user, req.profile) });
});
