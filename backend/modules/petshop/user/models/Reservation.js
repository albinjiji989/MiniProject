const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetShop',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'],
    default: 'pending'
  },
  notes: String,
  specialInstructions: String,
  services: [{
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    notes: String
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deposit: {
    amount: {
      type: Number,
      default: 0
    },
    paid: {
      type: Boolean,
      default: false
    },
    paymentMethod: String,
    transactionId: String,
    paidAt: Date
  },
  checkIn: {
    time: Date,
    notes: String,
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  checkOut: {
    time: Date,
    notes: String,
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    refundAmount: Number,
    refundMethod: String,
    refundNotes: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Indexes for better query performance
reservationSchema.index({ user: 1, status: 1 });
reservationSchema.index({ shop: 1, status: 1 });
reservationSchema.index({ startDate: 1, endDate: 1 });

// Virtual for duration in days
reservationSchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for checking if reservation is active
reservationSchema.virtual('isActive').get(function() {
  const now = new Date();
  return (
    ['confirmed', 'checked_in'].includes(this.status) &&
    this.startDate <= now &&
    this.endDate >= now
  );
});

// Pre-save hook to validate dates
reservationSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    throw new Error('End date must be after start date');
  }
  next();
});

// Method to cancel a reservation
reservationSchema.methods.cancel = function(userId, reason = '') {
  if (['cancelled', 'checked_out', 'no_show'].includes(this.status)) {
    throw new Error('Cannot cancel a completed or cancelled reservation');
  }
  
  this.status = 'cancelled';
  this.cancellation = {
    reason,
    cancelledBy: userId,
    cancelledAt: new Date()
  };
  
  return this.save();
};

// Method to check in a pet
reservationSchema.methods.checkInPet = function(userId, notes = '') {
  if (this.status !== 'confirmed') {
    throw new Error('Only confirmed reservations can be checked in');
  }
  
  this.status = 'checked_in';
  this.checkIn = {
    time: new Date(),
    notes,
    checkedBy: userId
  };
  
  return this.save();
};

// Method to check out a pet
reservationSchema.methods.checkOutPet = function(userId, notes = '') {
  if (this.status !== 'checked_in') {
    throw new Error('Only checked-in pets can be checked out');
  }
  
  this.status = 'checked_out';
  this.checkOut = {
    time: new Date(),
    notes,
    checkedBy: userId
  };
  
  return this.save();
};

// Static method to check availability
reservationSchema.statics.checkAvailability = async function(shopId, startDate, endDate, excludeReservationId = null) {
  const query = {
    shop: shopId,
    status: { $in: ['confirmed', 'checked_in'] },
    $or: [
      { startDate: { $lt: endDate, $gte: startDate } },
      { endDate: { $gt: startDate, $lte: endDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
    ]
  };

  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  const conflictingReservations = await this.find(query).lean();
  return conflictingReservations.length === 0;
};

module.exports = mongoose.model('Reservation', reservationSchema);