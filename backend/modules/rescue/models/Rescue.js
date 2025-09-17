const mongoose = require('mongoose');

const rescueSchema = new mongoose.Schema({
  rescueId: { type: String, required: true, unique: true },
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  situation: { type: String, required: true },
  urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  description: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rescueTeam: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  storeId: { type: String, index: true },
  storeName: { type: String }
}, { timestamps: true });

rescueSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Rescue', rescueSchema);

