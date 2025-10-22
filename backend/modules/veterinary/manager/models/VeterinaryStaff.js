const mongoose = require('mongoose');

const veterinaryStaffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  role: { type: String, enum: ['doctor', 'nurse', 'assistant', 'reception'], default: 'assistant' },
  storeId: { type: String, required: true, index: true },
  storeName: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('VeterinaryStaff', veterinaryStaffSchema);


