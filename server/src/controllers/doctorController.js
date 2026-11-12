const mongoose = require('mongoose');
const DoctorProfile = require('../models/DoctorProfile');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getSlots } = require('../services/slotService');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.listDoctors = asyncHandler(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const filter = search
    ? { $or: [{ name: new RegExp(escapeRegex(search), 'i') }, { specialization: new RegExp(escapeRegex(search), 'i') }] }
    : {};
  const doctors = await DoctorProfile.find(filter).sort({ rating: -1, name: 1 });
  res.json({ doctors });
});

exports.getDoctor = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid doctor id');
  const doctor = await DoctorProfile.findById(req.params.id);
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  res.json({ doctor });
});

exports.getDoctorSlots = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid doctor id');
  const doctor = await DoctorProfile.findById(req.params.id);
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  const slots = await getSlots(doctor, req.query.from, req.query.to, { role: req.user.role, profile: req.profile });
  res.json({ slots });
});
