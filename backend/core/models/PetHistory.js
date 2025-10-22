const mongoose = require('mongoose');

const petHistorySchema = new mongoose.Schema({
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  inventoryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetInventoryItem'
  },
  eventType: {
    type: String,
    enum: [
      'created',
      'reservation_made',
      'reservation_approved',
      'reservation_rejected',
      'reservation_confirmed',
      'reservation_declined',
      'payment_initiated',
      'payment_completed',
      'ownership_transferred',
      'ready_for_pickup',
      'delivered',
      'at_owner',
      'medical_checkup',
      'vaccination',
      'reservation_status_changed',
      'status_changed',
      'price_updated',
      'images_updated',
      'notes_added'
    ],
    required: true
  },
  eventDescription: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByRole: {
    type: String,
    enum: ['user', 'manager', 'admin', 'system']
  },
  relatedDocuments: [{
    documentType: {
      type: String,
      enum: ['reservation', 'payment', 'medical_record', 'ownership_transfer', 'delivery_receipt']
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId
    },
    documentUrl: String
  }],
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  metadata: {
    paymentAmount: Number,
    paymentMethod: String,
    deliveryMethod: String,
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      phone: String
    },
    medicalDetails: {
      checkupType: String,
      veterinarian: String,
      findings: String,
      recommendations: String
    },
    notes: String,
    systemGenerated: {
      type: Boolean,
      default: false
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  storeId: String,
  storeName: String
}, {
  timestamps: true
});

// Indexes for efficient querying
petHistorySchema.index({ petId: 1, timestamp: -1 });
petHistorySchema.index({ performedBy: 1, timestamp: -1 });
petHistorySchema.index({ eventType: 1, timestamp: -1 });
petHistorySchema.index({ storeId: 1, timestamp: -1 });

// Static method to log pet events
petHistorySchema.statics.logEvent = async function(eventData) {
  try {
    const historyEntry = new this(eventData);
    await historyEntry.save();
    return historyEntry;
  } catch (error) {
    console.error('Error logging pet history event:', error);
    throw error;
  }
};

// Static method to get pet timeline
petHistorySchema.statics.getPetTimeline = async function(petId, options = {}) {
  const { limit = 50, skip = 0, eventType } = options;
  
  const query = { petId };
  if (eventType) query.eventType = eventType;
  
  return this.find(query)
    .populate('performedBy', 'name email role')
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model('PetHistory', petHistorySchema);
