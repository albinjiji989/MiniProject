const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  veterinary: { type: mongoose.Schema.Types.ObjectId, ref: 'Veterinary', required: true },
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  date: { type: Date, required: true },
  reason: { type: String, required: true },
  notes: { type: String, default: '' },
  storeId: { type: String, index: true },
  storeName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

