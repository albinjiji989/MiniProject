const mongoose = require('mongoose');

const veterinarySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Veterinary clinic name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  storeName: { 
    type: String,
    trim: true,
    maxlength: [200, 'Store name cannot exceed 200 characters']
  },
  storeId: { 
    type: String, 
    required: [true, 'Store ID is required'],
    index: true,
    unique: true
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { 
      type: [Number], 
      default: [0, 0],
      validate: {
        validator: function(v) {
          return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
        },
        message: 'Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90'
      }
    }
  },
  contact: {
    phone: { type: String, default: '' },
    email: { 
      type: String, 
      default: '',
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    website: { type: String, default: '' }
  },
  services: [{ type: String }],
  operatingHours: {
    monday: { open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' }, closed: { type: Boolean, default: false } },
    tuesday: { open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' }, closed: { type: Boolean, default: false } },
    wednesday: { open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' }, closed: { type: Boolean, default: false } },
    thursday: { open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' }, closed: { type: Boolean, default: false } },
    friday: { open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' }, closed: { type: Boolean, default: false } },
    saturday: { open: { type: String, default: '09:00' }, close: { type: String, default: '13:00' }, closed: { type: Boolean, default: false } },
    sunday: { open: { type: String, default: '09:00' }, close: { type: String, default: '13:00' }, closed: { type: Boolean, default: true } }
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Creator is required']
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  }
}, { 
  timestamps: true 
});

// Indexes for performance
veterinarySchema.index({ location: '2dsphere' });
veterinarySchema.index({ storeId: 1, isActive: 1 });
veterinarySchema.index({ name: 'text', storeName: 'text' });

// Virtual for full address
veterinarySchema.virtual('fullAddress').get(function() {
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.zipCode,
    this.address.country
  ].filter(Boolean);
  return parts.join(', ');
});

// Ensure virtuals are included in JSON
veterinarySchema.set('toJSON', { virtuals: true });
veterinarySchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Veterinary || mongoose.model('Veterinary', veterinarySchema);