const CareBooking = require('../../models/CareBooking');
const ServiceType = require('../../models/ServiceType');
const Pet = require('../../../../core/models/Pet');
const CareStaff = require('../../models/CareStaff');
const CareReview = require('../../models/CareReview');

/**
 * User Booking Controllers
 */

// Get all service types available for booking
exports.getAvailableServices = async (req, res) => {
  try {
    const { category } = req.query;
    
    const query = { isActive: true };
    if (category) query.category = category;
    
    const services = await ServiceType.find(query).sort({ 'pricing.basePrice': 1 });
    
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error fetching available services:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get user's pets (only owned pets can be booked)
exports.getUserPets = async (req, res) => {
  try {
    // Find pets owned by the user
    const pets = await Pet.find({
      $or: [
        { ownerId: req.user.id },
        { 'owner.userId': req.user.id }
      ],
      status: { $in: ['available', 'adopted', 'owned'] }
    })
    .select('name species breed age gender profileImage healthStatus vaccinationStatus')
    .lean();
    
    res.json({
      success: true,
      data: pets
    });
  } catch (error) {
    console.error('Error fetching user pets:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Calculate booking price
exports.calculatePrice = async (req, res) => {
  try {
    const { serviceTypeId, startDate, endDate, duration } = req.body;
    
    const service = await ServiceType.findById(serviceTypeId);
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not available' });
    }
    
    let durationValue = duration?.value;
    if (!durationValue && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      durationValue = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // days
    }
    
    // Calculate base amount
    let baseAmount = 0;
    if (service.pricing.priceUnit === 'per_day') {
      baseAmount = service.pricing.basePrice * durationValue;
    } else if (service.pricing.priceUnit === 'per_hour') {
      baseAmount = service.pricing.basePrice * (durationValue * 24);
    } else {
      baseAmount = service.pricing.basePrice;
    }
    
    // Add additional charges
    let additionalCharges = 0;
    if (service.pricing.additionalCharges) {
      service.pricing.additionalCharges.forEach(charge => {
        if (charge.isPercentage) {
          additionalCharges += (baseAmount * charge.amount) / 100;
        } else {
          additionalCharges += charge.amount;
        }
      });
    }
    
    // Calculate tax (assuming 18% GST)
    const taxPercentage = 18;
    const subtotal = baseAmount + additionalCharges;
    const taxAmount = (subtotal * taxPercentage) / 100;
    
    const totalAmount = subtotal + taxAmount;
    const advanceAmount = (totalAmount * service.pricing.advancePercentage) / 100;
    const remainingAmount = totalAmount - advanceAmount;
    
    res.json({
      success: true,
      data: {
        baseAmount,
        additionalCharges,
        subtotal,
        tax: {
          percentage: taxPercentage,
          amount: taxAmount
        },
        totalAmount,
        advanceAmount,
        remainingAmount,
        advancePercentage: service.pricing.advancePercentage
      }
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      petId,
      serviceTypeId,
      startDate,
      endDate,
      duration,
      locationType,
      address,
      specialRequirements
    } = req.body;
    
    // Validate pet ownership
    const pet = await Pet.findOne({
      _id: petId,
      $or: [
        { ownerId: req.user.id },
        { 'owner.userId': req.user.id }
      ]
    });
    
    if (!pet) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only book temporary care for your own pets' 
      });
    }
    
    // Validate service type
    const service = await ServiceType.findById(serviceTypeId);
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not available' });
    }
    
    // Check for booking conflicts
    const conflictingBooking = await CareBooking.findOne({
      petId,
      status: { $in: ['confirmed', 'in_progress'] },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ]
    });
    
    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Your pet already has a booking during this period'
      });
    }
    
    // Calculate pricing
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const durationInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let baseAmount = 0;
    if (service.pricing.priceUnit === 'per_day') {
      baseAmount = service.pricing.basePrice * durationInDays;
    } else if (service.pricing.priceUnit === 'per_hour') {
      baseAmount = service.pricing.basePrice * (durationInDays * 24);
    } else {
      baseAmount = service.pricing.basePrice;
    }
    
    let additionalChargesAmount = 0;
    const additionalCharges = [];
    if (service.pricing.additionalCharges) {
      service.pricing.additionalCharges.forEach(charge => {
        let chargeAmount = 0;
        if (charge.isPercentage) {
          chargeAmount = (baseAmount * charge.amount) / 100;
        } else {
          chargeAmount = charge.amount;
        }
        additionalChargesAmount += chargeAmount;
        additionalCharges.push({
          name: charge.name,
          amount: chargeAmount
        });
      });
    }
    
    const subtotal = baseAmount + additionalChargesAmount;
    const taxPercentage = 18;
    const taxAmount = (subtotal * taxPercentage) / 100;
    const totalAmount = subtotal + taxAmount;
    const advanceAmount = (totalAmount * service.pricing.advancePercentage) / 100;
    const remainingAmount = totalAmount - advanceAmount;
    
    // Create location object
    const location = {
      type: locationType || 'facility',
      address: locationType === 'customer_home' ? address : undefined
    };
    
    // Create booking
    const booking = await CareBooking.create({
      userId: req.user.id,
      petId,
      serviceType: serviceTypeId,
      serviceCategory: service.category,
      startDate,
      endDate,
      duration: duration || {
        value: durationInDays,
        unit: 'days'
      },
      location,
      specialRequirements: specialRequirements || {},
      pricing: {
        baseAmount,
        additionalCharges,
        tax: {
          amount: taxAmount,
          percentage: taxPercentage
        },
        totalAmount,
        advanceAmount,
        remainingAmount
      },
      status: 'pending_payment',
      storeId: req.user.storeId
    });
    
    const populatedBooking = await CareBooking.findById(booking._id)
      .populate('petId', 'name species breed profileImage')
      .populate('serviceType');
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Please proceed with payment.',
      data: populatedBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { userId: req.user.id };
    if (status) query.status = status;
    
    const bookings = await CareBooking.find(query)
      .populate('petId', 'name species breed profileImage')
      .populate('serviceType', 'name category')
      .populate('assignedCaregivers.caregiver', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await CareBooking.countDocuments(query);
    
    res.json({
      success: true,
      data: bookings,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get single booking details
exports.getBookingDetails = async (req, res) => {
  try {
    const booking = await CareBooking.findOne({
      _id: req.params.id,
      userId: req.user.id
    })
    .populate('petId')
    .populate('serviceType')
    .populate('assignedCaregivers.caregiver', 'name email phone profilePicture')
    .populate('activityLog.performedBy', 'name');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const booking = await CareBooking.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (!booking.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled. It must be at least 24 hours before the start date.'
      });
    }
    
    // Calculate refund amount based on cancellation policy
    let refundAmount = 0;
    if (booking.paymentStatus.advance.status === 'completed') {
      const hoursUntilStart = (new Date(booking.startDate) - new Date()) / (1000 * 60 * 60);
      if (hoursUntilStart > 48) {
        refundAmount = booking.pricing.advanceAmount; // Full refund
      } else if (hoursUntilStart > 24) {
        refundAmount = booking.pricing.advanceAmount * 0.5; // 50% refund
      }
    }
    
    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: req.user.id,
      reason,
      refundAmount,
      refundStatus: refundAmount > 0 ? 'pending' : undefined
    };
    
    await booking.save();
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking,
        refundAmount
      }
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Submit review for completed booking
exports.submitReview = async (req, res) => {
  try {
    const { ratings, title, comment, pros, cons, wouldRecommend, staffRatings, images } = req.body;
    
    const booking = await CareBooking.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: 'completed'
    });
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found or not completed yet' 
      });
    }
    
    // Check if review already exists
    const existingReview = await CareReview.findOne({ bookingId: booking._id });
    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: 'Review already submitted for this booking' 
      });
    }
    
    const review = await CareReview.create({
      bookingId: booking._id,
      userId: req.user.id,
      petId: booking.petId,
      ratings,
      title,
      comment,
      pros: pros || [],
      cons: cons || [],
      wouldRecommend,
      staffRatings: staffRatings || [],
      images: images || [],
      status: 'approved', // Auto-approve for verified bookings
      storeId: booking.storeId
    });
    
    // Update booking with review
    booking.review = {
      rating: ratings.overall,
      comment,
      reviewedAt: new Date()
    };
    await booking.save();
    
    // Update staff performance if staff ratings provided
    if (staffRatings && staffRatings.length > 0) {
      for (const sr of staffRatings) {
        const staff = await CareStaff.findOne({ userId: sr.staffId });
        if (staff) {
          await staff.updatePerformance('completed', sr.rating);
        }
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Verify handover OTP
exports.verifyHandoverOTP = async (req, res) => {
  try {
    const { type, otp } = req.body; // type: 'dropOff' or 'pickup'
    
    const booking = await CareBooking.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    let handoverType;
    if (type === 'dropOff') {
      handoverType = booking.handover.dropOff;
    } else if (type === 'pickup') {
      handoverType = booking.handover.pickup;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid handover type' });
    }
    
    if (!handoverType.otp || !handoverType.otp.code) {
      return res.status(400).json({ success: false, message: 'OTP not generated' });
    }
    
    if (handoverType.otp.verified) {
      return res.status(400).json({ success: false, message: 'OTP already verified' });
    }
    
    if (new Date() > new Date(handoverType.otp.expiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    
    if (handoverType.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    // Verify OTP
    handoverType.otp.verified = true;
    handoverType.otp.verifiedAt = new Date();
    handoverType.actualTime = new Date();
    handoverType.completedBy = req.user.id;
    
    // Update booking status
    if (type === 'dropOff' && booking.status === 'confirmed') {
      booking.status = 'in_progress';
    } else if (type === 'pickup' && booking.status === 'in_progress') {
      booking.status = 'completed';
      
      // Update staff availability
      for (const ac of booking.assignedCaregivers) {
        const staff = await CareStaff.findOne({ userId: ac.caregiver });
        if (staff) {
          staff.availability.status = 'available';
          await staff.save();
        }
      }
    }
    
    await booking.save();
    
    res.json({
      success: true,
      message: `${type === 'dropOff' ? 'Drop-off' : 'Pickup'} verified successfully`,
      data: booking
    });
  } catch (error) {
    console.error('Error verifying handover OTP:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get booking activity timeline
exports.getBookingTimeline = async (req, res) => {
  try {
    const booking = await CareBooking.findOne({
      _id: req.params.id,
      userId: req.user.id
    })
    .populate('activityLog.performedBy', 'name profilePicture')
    .select('activityLog status createdAt handover');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({
      success: true,
      data: {
        activities: booking.activityLog.sort((a, b) => b.timestamp - a.timestamp),
        status: booking.status,
        handover: booking.handover
      }
    });
  } catch (error) {
    console.error('Error fetching booking timeline:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
