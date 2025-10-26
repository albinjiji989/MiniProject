const mongoose = require('mongoose');

const veterinaryStaffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['veterinarian', 'veterinary_technician', 'receptionist', 'assistant'],
    default: 'assistant'
  },
  specialization: { type: String },
  licenseNumber: { type: String },
  isActive: { type: Boolean, default: true },
  storeId: { type: String, index: true },
  storeName: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.models.VeterinaryStaff || mongoose.model('VeterinaryStaff', veterinaryStaffSchema);