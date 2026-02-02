const mongoose = require('mongoose');

const veterinaryStaffSchema = new mongoose.Schema({
  // Basic staff information
  name: { 
    type: String, 
    required: [true, 'Staff name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    index: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  phone: { 
    type: String,
    trim: true,
    match: [/^[\d\s\-\+\(\)]+$/, 'Please provide a valid phone number']
  },
  
  // Role and permissions
  role: { 
    type: String,
    enum: ['veterinarian', 'nurse', 'assistant', 'receptionist', 'manager', 'doctor'],
    default: 'assistant',
    index: true
  },
  specialization: {
    type: String,
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  qualifications: [{
    degree: { type: String, trim: true },
    institution: { type: String, trim: true },
    year: { type: Number }
  }],
  permissions: [{
    type: String,
    enum: ['view_records', 'edit_records', 'delete_records', 'manage_appointments', 'manage_staff', 'manage_services', 'view_reports', 'manage_billing']
  }],
  
  // Authentication
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  
  // Store information
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  storeId: { 
    type: String,
    required: [true, 'Store ID is required'],
    index: true
  },
  storeName: {
    type: String,
    trim: true
  },
  
  // Employment details
  joinDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern'],
    default: 'full-time'
  },
  
  // Audit fields
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

// Compound indexes for common queries
veterinaryStaffSchema.index({ email: 1, storeId: 1 }, { unique: true });
veterinaryStaffSchema.index({ storeId: 1, isActive: 1, role: 1 });
veterinaryStaffSchema.index({ userId: 1, storeId: 1 });

// Virtual for full name with role
veterinaryStaffSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.role})`;
});

// Ensure virtuals are included in JSON
veterinaryStaffSchema.set('toJSON', { virtuals: true });
veterinaryStaffSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VeterinaryStaff', veterinaryStaffSchema);