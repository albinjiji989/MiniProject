const mongoose = require('mongoose');

const managerInviteSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  module: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

managerInviteSchema.index({ email: 1, module: 1, verified: 1 });

module.exports = mongoose.model('ManagerInvite', managerInviteSchema);


