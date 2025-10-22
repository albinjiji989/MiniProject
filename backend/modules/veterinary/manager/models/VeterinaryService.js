const mongoose = require('mongoose');

const veterinaryServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['checkup', 'vaccination', 'surgery', 'dental', 'grooming', 'emergency', 'consultation', 'diagnostic', 'other'],
    default: 'other'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number, // in minutes
    required: true,
    default: 30
  },
  storeId: {
    type: String,
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VeterinaryService', veterinaryServiceSchema);
