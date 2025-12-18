const mongoose = require('mongoose');

const veterinaryAppointmentSchema = new mongoose.Schema({
  // Basic appointment information
  petId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pet', 
    required: true,
    index: true
  },
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  storeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Veterinary', 
    required: true,
    index: true
  },
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'VeterinaryService', 
    required: true,
    index: true
  },
  
  // Appointment number (unique identifier for the appointment)
  appointmentNumber: {
    type: String,
    unique: true,
    sparse: true // Allow null values but still enforce uniqueness when not null
  },
  
  // Appointment details
  appointmentDate: { 
    type: Date,
    index: true
  },
  timeSlot: {
    type: String
  },
  reason: { 
    type: String, 
    required: true 
  },
  bookingType: {
    type: String,
    enum: ['routine', 'emergency', 'walkin'],
    required: true,
    index: true
  },
  visitType: {
    type: String,
    enum: ['routine_checkup', 'vaccination', 'follow_up', 'consultation', 'other']
  },
  symptoms: { 
    type: String 
  },
  isExistingCondition: {
    type: Boolean,
    default: false
  },
  existingConditionDetails: {
    type: String
  },
  notes: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'pending_approval'],
    default: 'scheduled',
    index: true
  },
  
  // Payment information
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  // Store information
  storeName: { 
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
  },
  cancelledAt: {
    type: Date
  }
}, { 
  timestamps: true 
});

// Generate appointment number before saving
veterinaryAppointmentSchema.pre('save', async function(next) {
  if (!this.appointmentNumber) {
    // Generate a unique appointment number
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Generate a random 4-digit number
    const random = Math.floor(1000 + Math.random() * 9000);
    
    this.appointmentNumber = `APT-${year}${month}${day}-${random}`;
    
    // Ensure uniqueness by checking if this number already exists
    let existing = await this.constructor.findOne({ appointmentNumber: this.appointmentNumber });
    let attempts = 0;
    while (existing && attempts < 10) {
      const newRandom = Math.floor(1000 + Math.random() * 9000);
      this.appointmentNumber = `APT-${year}${month}${day}-${newRandom}`;
      existing = await this.constructor.findOne({ appointmentNumber: this.appointmentNumber });
      attempts++;
    }
  }
  next();
});

module.exports = mongoose.model('VeterinaryAppointment', veterinaryAppointmentSchema);