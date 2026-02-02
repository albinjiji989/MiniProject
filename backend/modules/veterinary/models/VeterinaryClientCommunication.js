const mongoose = require('mongoose');

const veterinaryClientCommunicationSchema = new mongoose.Schema({
  // Client reference
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client is required'],
    index: true
  },
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    index: true
  },

  // Communication details
  type: {
    type: String,
    enum: ['email', 'sms', 'call', 'whatsapp', 'in_app', 'other'],
    required: [true, 'Communication type is required'],
    index: true
  },
  purpose: {
    type: String,
    enum: ['appointment_reminder', 'vaccination_reminder', 'follow_up', 'payment_reminder', 'general', 'marketing', 'emergency'],
    required: [true, 'Purpose is required'],
    index: true
  },
  subject: {
    type: String,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
    default: 'pending',
    index: true
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },

  // Reference
  referenceType: {
    type: String,
    enum: ['appointment', 'medical_record', 'vaccination', 'payment', 'other']
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },

  // Response tracking
  responseReceived: {
    type: Boolean,
    default: false
  },
  responseText: {
    type: String,
    trim: true
  },
  responseAt: {
    type: Date
  },

  // Store information
  storeId: {
    type: String,
    required: [true, 'Store ID is required'],
    index: true
  },

  // Audit fields
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true
});

// Indexes
veterinaryClientCommunicationSchema.index({ client: 1, createdAt: -1 });
veterinaryClientCommunicationSchema.index({ storeId: 1, type: 1, status: 1 });
veterinaryClientCommunicationSchema.index({ purpose: 1, status: 1, createdAt: -1 });

veterinaryClientCommunicationSchema.set('toJSON', { virtuals: true });
veterinaryClientCommunicationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VeterinaryClientCommunication', veterinaryClientCommunicationSchema);
