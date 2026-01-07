const mongoose = require('mongoose');

/**
 * Care Staff Model
 * Manages staff members who provide temporary care services
 */
const careStaffSchema = new mongoose.Schema({
  // Link to User account
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Staff Details
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Professional Information
  qualifications: [{
    title: String,
    institution: String,
    year: Number,
    certificate: String // URL to certificate
  }],
  
  experience: {
    years: {
      type: Number,
      default: 0,
      min: 0
    },
    specializations: [{
      type: String,
      enum: ['dog_care', 'cat_care', 'bird_care', 'exotic_pets', 'medical_care', 'behavioral_training']
    }]
  },
  
  // Skills and Certifications
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'beginner'
    },
    certified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Availability
  availability: {
    status: {
      type: String,
      enum: ['available', 'busy', 'on_leave', 'inactive'],
      default: 'available',
      index: true
    },
    workingHours: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String, // "09:00"
      endTime: String,   // "18:00"
      isAvailable: {
        type: Boolean,
        default: true
      }
    }],
    maxBookingsPerDay: {
      type: Number,
      default: 5,
      min: 1
    }
  },
  
  // Performance Metrics
  performance: {
    totalBookings: {
      type: Number,
      default: 0
    },
    completedBookings: {
      type: Number,
      default: 0
    },
    cancelledBookings: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  
  // Service Preferences
  servicePreferences: {
    preferredServices: [{
      type: String,
      enum: ['boarding', 'in-home', 'daycare', 'overnight']
    }],
    maxDistanceForInHome: {
      type: Number,
      default: 10 // km
    },
    acceptsEmergencyBookings: {
      type: Boolean,
      default: false
    }
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['id_proof', 'address_proof', 'certificate', 'police_verification', 'other']
    },
    name: String,
    url: String,
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  
  // Employment Details
  employment: {
    joinDate: {
      type: Date,
      default: Date.now
    },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'freelance'],
      default: 'full_time'
    },
    department: String,
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Store Assignment
  storeId: {
    type: String,
    index: true
  },
  storeName: String,
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Profile
  bio: {
    type: String,
    maxlength: 500
  },
  profileImage: String,
  
  // Notes
  internalNotes: {
    type: String,
    default: ''
  },
  
  metadata: {
    type: Object,
    default: {}
  }
}, { 
  timestamps: true 
});

// Indexes
careStaffSchema.index({ 'availability.status': 1, isActive: 1 });
careStaffSchema.index({ storeId: 1, isActive: 1 });
careStaffSchema.index({ 'performance.averageRating': -1 });

// Generate employee ID
careStaffSchema.pre('save', async function(next) {
  if (this.isNew && !this.employeeId) {
    const count = await this.constructor.countDocuments();
    this.employeeId = `CS${Date.now().toString().slice(-6)}${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Method to update performance metrics
careStaffSchema.methods.updatePerformance = async function(bookingStatus, rating = null) {
  if (bookingStatus === 'completed') {
    this.performance.completedBookings += 1;
  } else if (bookingStatus === 'cancelled') {
    this.performance.cancelledBookings += 1;
  }
  this.performance.totalBookings += 1;
  
  if (rating !== null) {
    const totalRating = (this.performance.averageRating * this.performance.totalReviews) + rating;
    this.performance.totalReviews += 1;
    this.performance.averageRating = totalRating / this.performance.totalReviews;
  }
  
  await this.save();
};

module.exports = mongoose.model('CareStaff', careStaffSchema);
