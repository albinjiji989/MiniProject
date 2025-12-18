const mongoose = require('mongoose');

const veterinaryStaffSchema = new mongoose.Schema({
  // Basic staff information
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String 
  },
  
  // Role and permissions
  role: { 
    type: String,
    enum: ['veterinarian', 'nurse', 'assistant', 'manager'],
    default: 'assistant'
  },
  permissions: [{
    type: String,
    enum: ['view_records', 'edit_records', 'manage_staff', 'manage_services']
  }],
  
  // Authentication
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // Store information
  isActive: { 
    type: Boolean, 
    default: true 
  },
  storeId: { 
    type: String
  },
  
  // Audit fields
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true 
});

// Indexes
veterinaryStaffSchema.index({ email: 1 });
veterinaryStaffSchema.index({ storeId: 1 });
veterinaryStaffSchema.index({ role: 1 });

module.exports = mongoose.model('VeterinaryStaff', veterinaryStaffSchema);