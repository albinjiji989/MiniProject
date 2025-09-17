const mongoose = require('mongoose');

const userDetailsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  assignedModule: {
    type: String,
    enum: ['adoption', 'shelter', 'rescue', 'ecommerce', 'pharmacy', 'boarding', 'temporary-care', 'veterinary', 'donation'],
    required: false
  },
  // Store/Location information for module-specific users (Multi-tenant support)
  storeId: {
    type: String,
    required: false,
    unique: false // Multiple users can be in same store
  },
  storeName: {
    type: String,
    required: false
  },
  storeLocation: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: String,
    latitude: Number,
    longitude: Number
  },
  // Store-specific information
  storeDetails: {
    phone: String,
    email: String,
    website: String,
    operatingHours: {
      monday: { open: String, close: String, closed: Boolean },
      tuesday: { open: String, close: String, closed: Boolean },
      wednesday: { open: String, close: String, closed: Boolean },
      thursday: { open: String, close: String, closed: Boolean },
      friday: { open: String, close: String, closed: Boolean },
      saturday: { open: String, close: String, closed: Boolean },
      sunday: { open: String, close: String, closed: Boolean }
    },
    capacity: Number, // For boarding/shelter
    services: [String], // Available services at this location
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance', 'closed'],
      default: 'active'
    }
  },
  // Address information
  address: {
    street: String,
    city: String,
    state: String,
    country: String
  },
  // Additional profile information
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  // Professional information
  department: String,
  position: String,
  employeeId: String,
  hireDate: Date,
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Volunteer/Partner specific fields
  volunteerSkills: [{
    type: String,
    enum: ['animal_care', 'medical_assistance', 'rescue_operations', 'adoption_support', 
           'fundraising', 'event_management', 'transportation', 'fostering']
  }],
  partnerType: {
    type: String,
    enum: ['veterinary_clinic', 'pet_store', 'transportation', 'foster_network', 'corporate_sponsor']
  },
  partnerDetails: {
    organizationName: String,
    website: String,
    contactPerson: String,
    partnershipLevel: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum']
    }
  },
  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' }
  },
  // Additional metadata
  assignedModules: [{
    type: String,
    enum: ['adoption', 'shelter', 'rescue', 'ecommerce', 'pharmacy', 'boarding', 'temporary_care', 'veterinary']
  }],
  permissions: [{
    module: String,
    actions: [String] // ['read', 'write', 'delete', 'admin']
  }]
}, {
  timestamps: true
});

// Index for efficient queries
userDetailsSchema.index({ assignedModule: 1 });
userDetailsSchema.index({ storeId: 1 });
userDetailsSchema.index({ assignedModule: 1, storeId: 1 }); // Compound index for module + store queries

module.exports = mongoose.model('UserDetails', userDetailsSchema);
