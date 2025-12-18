const mongoose = require('mongoose');

const veterinaryAppointmentSchema = new mongoose.Schema({
  appointmentNumber: {
    type: String,
    required: true,
    unique: true
  },
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VeterinaryClinic'
  },
  storeId: {
    type: String,
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VeterinaryService'
  },
  serviceName: {
    type: String,
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  veterinarianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  symptoms: {
    type: String
  },
  diagnosis: {
    type: String
  },
  treatment: {
    type: String
  },
  prescription: [{
    medicine: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  notes: {
    type: String
  },
  fee: {
    type: Number,
    default: 0
  },
  paid: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'online']
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  }
}, {
  timestamps: true
});

// Generate appointment number
veterinaryAppointmentSchema.pre('save', async function(next) {
  if (!this.appointmentNumber) {
    const count = await this.constructor.countDocuments();
    this.appointmentNumber = `VET-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
veterinaryAppointmentSchema.index({ appointmentNumber: 1 });
veterinaryAppointmentSchema.index({ petId: 1 });
veterinaryAppointmentSchema.index({ ownerId: 1 });
veterinaryAppointmentSchema.index({ clinicId: 1 });
veterinaryAppointmentSchema.index({ storeId: 1 });
veterinaryAppointmentSchema.index({ serviceId: 1 });
veterinaryAppointmentSchema.index({ appointmentDate: 1 });
veterinaryAppointmentSchema.index({ status: 1 });
veterinaryAppointmentSchema.index({ veterinarianId: 1 });

module.exports = mongoose.model('ManagerVeterinaryAppointment', veterinaryAppointmentSchema);