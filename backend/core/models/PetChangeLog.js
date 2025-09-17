const mongoose = require('mongoose');

const petChangeLogSchema = new mongoose.Schema({
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
  action: { type: String, enum: ['create', 'update', 'medical_add', 'vaccination_add', 'ownership_add', 'medication_add'], required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changes: { type: Object, default: {} },
  meta: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('PetChangeLog', petChangeLogSchema);


