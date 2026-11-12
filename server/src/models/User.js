const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['doctor', 'patient', 'admin'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
