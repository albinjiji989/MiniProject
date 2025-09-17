const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true }, // store hashed if needed
  expiresAt: { type: Date, required: true, index: true },
  used: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);


