const mongoose = require('mongoose');

const veterinaryServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  duration: { type: Number, required: true, min: 1 }, // in minutes
  category: { 
    type: String, 
    enum: ['consultation', 'vaccination', 'surgery', 'dental', 'grooming', 'emergency', 'other'],
    default: 'consultation'
  },
  isActive: { type: Boolean, default: true },
  storeId: { type: String, index: true },
  storeName: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.models.VeterinaryService || mongoose.model('VeterinaryService', veterinaryServiceSchema);