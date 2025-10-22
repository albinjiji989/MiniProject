const mongoose = require('mongoose');

const veterinaryStaffInviteSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  storeId: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

veterinaryStaffInviteSchema.index({ email: 1, storeId: 1, verified: 1 });

module.exports = mongoose.model('VeterinaryStaffInvite', veterinaryStaffInviteSchema);


