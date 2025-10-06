const mongoose = require('mongoose');

const adoptionInterviewSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdoptionRequest', required: true, index: true },
  scheduledDate: { type: Date, required: true },
  mode: { type: String, enum: ['online', 'offline'], required: true },
  notes: { type: String },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('AdoptionInterview', adoptionInterviewSchema);
