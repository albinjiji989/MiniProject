const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  diagnosis: { type: String, required: true },
  treatment: { type: String, required: true },
  veterinarian: { type: String, required: true },
  date: { type: Date, default: Date.now },
  storeId: { type: String, index: true },
  storeName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);

