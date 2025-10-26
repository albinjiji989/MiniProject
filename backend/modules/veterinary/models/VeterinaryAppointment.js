const mongoose = require('mongoose');

const veterinaryAppointmentSchema = new mongoose.Schema({
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  veterinary: { type: mongoose.Schema.Types.ObjectId, ref: 'Veterinary', required: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'VeterinaryStaff' },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'VeterinaryService' },
  appointmentDate: { type: Date },
  timeSlot: { type: String }, // e.g., "09:00-09:30"
  reason: { type: String, required: true },
  bookingType: { 
    type: String, 
    enum: ['routine', 'emergency', 'walkin'],
    default: 'routine'
  },
  visitType: { 
    type: String, 
    enum: ['routine_checkup', 'vaccination', 'follow_up', 'consultation', 'other'],
    default: 'routine_checkup'
  },
  emergencyReason: { type: String }, // For emergency bookings, detailed reason
  emergencyApproved: { type: Boolean, default: false }, // Manager approval for emergency bookings
  emergencyDeclined: { type: Boolean, default: false }, // Manager can decline emergency bookings
  emergencyDeclineReason: { type: String }, // Reason for declining emergency booking
  symptoms: { type: String }, // Symptoms for all booking types
  isExistingCondition: { type: Boolean, default: false }, // Existing medical condition
  existingConditionDetails: { type: String }, // Details of existing condition
  status: { 
    type: String, 
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'pending_approval', 'declined'],
    default: 'scheduled'
  },
  notes: { type: String },
  diagnosis: { type: String },
  treatment: { type: String },
  followUpDate: { type: Date },
  cost: { type: Number, min: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'partial', 'cancelled'],
    default: 'pending'
  },
  storeId: { type: String, index: true },
  storeName: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes
veterinaryAppointmentSchema.index({ appointmentDate: 1, timeSlot: 1 });
veterinaryAppointmentSchema.index({ pet: 1 });
veterinaryAppointmentSchema.index({ owner: 1 });
veterinaryAppointmentSchema.index({ veterinary: 1 });
veterinaryAppointmentSchema.index({ staff: 1 });
veterinaryAppointmentSchema.index({ status: 1 });
veterinaryAppointmentSchema.index({ bookingType: 1 });

module.exports = mongoose.models.VeterinaryAppointment || mongoose.model('VeterinaryAppointment', veterinaryAppointmentSchema);