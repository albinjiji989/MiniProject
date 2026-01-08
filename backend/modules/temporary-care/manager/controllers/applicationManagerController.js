const TemporaryCareApplication = require('../../models/TemporaryCareApplication');
const TemporaryCareCenter = require('../../manager/models/TemporaryCareCenter');
const CenterPricing = require('../../models/CenterPricing');
const Pet = require('../../../../core/models/Pet');
const AdoptionPet = require('../../../adoption/manager/models/AdoptionPet');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

/**
 * Get all applications for manager's center
 */
const getApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get manager's center
    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const filter = { centerId: center._id };
    if (status) {
      filter.status = status;
    }

    const applications = await TemporaryCareApplication.find(filter)
      .populate('userId', 'name email phone address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Manually fetch pet details since petId is now petCode (string)
    for (let application of applications) {
      for (let pet of application.pets) {
        // Try to find in Pet collection first
        let petDetails = await Pet.findOne({ petCode: pet.petId });
        
        // If not found, try AdoptionPet collection
        if (!petDetails) {
          petDetails = await AdoptionPet.findOne({ petCode: pet.petId });
          
          // Manually populate species and breed if they exist
          if (petDetails) {
            if (petDetails.speciesId) {
              const Species = require('../../../../core/models/Species');
              const species = await Species.findById(petDetails.speciesId);
              petDetails = petDetails.toObject();
              petDetails.speciesId = species;
            }
            if (petDetails.breedId) {
              const Breed = require('../../../../core/models/Breed');
              const breed = await Breed.findById(petDetails.breedId);
              petDetails.breedId = breed;
            }
          }
        }
        
        if (petDetails) {
          pet.petDetails = petDetails;
        }
      }
    }

    const total = await TemporaryCareApplication.countDocuments(filter);

    res.json({
      success: true,
      data: { applications, pagination: { total, page: parseInt(page), limit: parseInt(limit) } }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get application details
 */
const getApplicationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const application = await TemporaryCareApplication.findOne({
      _id: id,
      centerId: center._id
    })
      .populate('userId', 'name email phone address')
      .populate('kennelAssignments.caretakerId', 'name email phone')
      .populate('dailyCareLogs.activities.performedBy', 'name');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Manually fetch pet details for each pet
    for (let pet of application.pets) {
      // Try to find in Pet collection first
      let petDetails = await Pet.findOne({ petCode: pet.petId });
      
      // If not found, try AdoptionPet collection
      if (!petDetails) {
        petDetails = await AdoptionPet.findOne({ petCode: pet.petId });
        
        // Manually populate species and breed if they exist
        if (petDetails) {
          if (petDetails.speciesId) {
            const Species = require('../../../../core/models/Species');
            const species = await Species.findById(petDetails.speciesId);
            petDetails = petDetails.toObject();
            petDetails.speciesId = species;
          }
          if (petDetails.breedId) {
            const Breed = require('../../../../core/models/Breed');
            const breed = await Breed.findById(petDetails.breedId);
            petDetails.breedId = breed;
          }
        }
      }
      
      if (petDetails) {
        pet.petDetails = petDetails;
      }
    }

    res.json({
      success: true,
      data: { application }
    });
  } catch (error) {
    console.error('Get application details error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Set pricing for application (Price Determined status)
 */
const setPricing = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { id } = req.params;
    const { petPricing, additionalCharges = [], discount = { amount: 0 }, tax = { percentage: 18 } } = req.body;

    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const application = await TemporaryCareApplication.findOne({
      _id: id,
      centerId: center._id,
      status: 'submitted'
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or cannot set pricing' });
    }

    // Calculate subtotal from pet pricing
    const subtotal = petPricing.reduce((sum, pet) => sum + pet.totalAmount, 0);

    // Add additional charges
    const additionalChargesAmount = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);

    // Calculate after discount
    const afterDiscount = subtotal + additionalChargesAmount - (discount.amount || 0);

    // Calculate tax
    const taxPercentage = tax.percentage || 18;
    const taxAmount = (afterDiscount * taxPercentage) / 100;

    // Calculate total
    const totalAmount = afterDiscount + taxAmount;

    // Calculate advance (50%)
    const advanceAmount = (totalAmount * 0.5);
    const remainingAmount = totalAmount - advanceAmount;

    // Update pricing
    application.pricing = {
      petPricing,
      subtotal,
      additionalCharges,
      discount,
      tax: { percentage: taxPercentage, amount: taxAmount },
      totalAmount,
      advanceAmount,
      remainingAmount,
      pricingLocked: false, // Will lock after approval
      pricingDeterminedAt: new Date(),
      pricingDeterminedBy: req.user._id
    };

    application.status = 'price_determined';
    await application.save();

    res.json({
      success: true,
      message: 'Pricing determined successfully',
      data: { application }
    });
  } catch (error) {
    console.error('Set pricing error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Verify capacity before approval
 */
const verifyCapacity = async (req, res) => {
  try {
    const { id } = req.params;

    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const application = await TemporaryCareApplication.findById(id);
    if (!application || application.centerId.toString() !== center._id.toString()) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Count active applications for the same date range
    const overlappingApplications = await TemporaryCareApplication.countDocuments({
      centerId: center._id,
      _id: { $ne: id },
      $or: [
        { startDate: { $lte: application.startDate }, endDate: { $gte: application.startDate } },
        { startDate: { $lte: application.endDate }, endDate: { $gte: application.endDate } },
        { startDate: { $gte: application.startDate }, endDate: { $lte: application.endDate } }
      ],
      status: { $in: ['approved', 'active_care'] }
    });

    // Count pets in overlapping applications
    const overlappingApps = await TemporaryCareApplication.find({
      centerId: center._id,
      _id: { $ne: id },
      $or: [
        { startDate: { $lte: application.startDate }, endDate: { $gte: application.startDate } },
        { startDate: { $lte: application.endDate }, endDate: { $gte: application.endDate } },
        { startDate: { $gte: application.startDate }, endDate: { $lte: application.endDate } }
      ],
      status: { $in: ['approved', 'active_care'] }
    });

    const petsInOverlapping = overlappingApps.reduce((count, app) => count + app.pets.length, 0);
    const requestedPets = application.pets.length;

    const available = center.capacity.total - petsInOverlapping;
    const willBeAvailable = available - requestedPets;

    res.json({
      success: true,
      data: {
        totalCapacity: center.capacity.total,
        currentOccupancy: petsInOverlapping,
        available,
        requestedPets,
        willBeAvailable,
        hasCapacity: willBeAvailable >= 0
      }
    });
  } catch (error) {
    console.error('Verify capacity error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Approve or reject application
 */
const approveOrRejectApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve' or 'reject'

    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    // For reject/cancel, allow any status except completed, already cancelled, or already rejected
    const statusFilter = action === 'reject' 
      ? { $nin: ['completed', 'cancelled', 'rejected', 'active_care'] }
      : { $in: ['advance_paid'] }; // Approve only when advance is paid

    const application = await TemporaryCareApplication.findOne({
      _id: id,
      centerId: center._id,
      status: statusFilter
    });

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: action === 'approve' 
          ? 'Application not found or advance payment not completed' 
          : 'Application not found or cannot be processed' 
      });
    }

    if (action === 'reject') {
      application.status = 'rejected';
      application.rejectedReason = reason || 'Application rejected by manager';
      await application.save();

      return res.json({
        success: true,
        message: 'Application rejected',
        data: { application }
      });
    }

    if (action === 'approve') {
      // Verify advance payment is completed
      if (application.status !== 'advance_paid') {
        return res.status(400).json({ 
          success: false, 
          message: 'Advance payment must be completed before approval' 
        });
      }

      // Lock pricing
      application.pricing.pricingLocked = true;
      application.status = 'approved';
      application.approvedAt = new Date();
      application.approvedBy = req.user._id;
      await application.save();

      // Generate check-in OTP
      const checkInOtp = crypto.randomInt(100000, 999999).toString();
      application.checkIn = {
        otp: checkInOtp,
        otpGeneratedAt: new Date(),
        otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        otpUsed: false
      };
      await application.save();

      return res.json({
        success: true,
        message: 'Application approved. Check-in OTP generated.',
        data: { application }
      });
    }

    res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (error) {
    console.error('Approve/reject error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Assign pets to kennels
 */
const assignKennels = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { id } = req.params;
    const { assignments } = req.body; // [{ petId, kennelId, kennelLabel, caretakerId }]

    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const application = await TemporaryCareApplication.findOne({
      _id: id,
      centerId: center._id,
      status: { $in: ['approved', 'active_care'] }
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or cannot assign kennels' });
    }

    // Update or create kennel assignments
    for (const assignment of assignments) {
      const existingIndex = application.kennelAssignments.findIndex(
        ka => ka.petId.toString() === assignment.petId
      );

      if (existingIndex >= 0) {
        // Update existing
        application.kennelAssignments[existingIndex] = {
          ...application.kennelAssignments[existingIndex].toObject(),
          ...assignment,
          assignedAt: new Date()
        };
      } else {
        // Create new
        application.kennelAssignments.push({
          petId: assignment.petId,
          kennelId: assignment.kennelId,
          kennelLabel: assignment.kennelLabel,
          caretakerId: assignment.caretakerId,
          assignedAt: new Date()
        });
      }
    }

    await application.save();

    res.json({
      success: true,
      message: 'Kennels assigned successfully',
      data: { application }
    });
  } catch (error) {
    console.error('Assign kennels error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Record pet check-in condition
 */
const recordCheckInCondition = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { id } = req.params;
    const { petId, condition, otp } = req.body;

    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const application = await TemporaryCareApplication.findOne({
      _id: id,
      centerId: center._id,
      status: 'approved'
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Verify OTP
    if (!application.checkIn.otp || application.checkIn.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid check-in OTP' });
    }

    if (application.checkIn.otpUsed) {
      return res.status(400).json({ success: false, message: 'Check-in OTP already used' });
    }

    // Find and update kennel assignment
    const kennelAssignment = application.kennelAssignments.find(
      ka => ka.petId.toString() === petId
    );

    if (!kennelAssignment) {
      return res.status(404).json({ success: false, message: 'Kennel assignment not found for this pet' });
    }

    kennelAssignment.checkInCondition = {
      description: condition.description,
      photos: condition.photos || [],
      healthStatus: condition.healthStatus || 'healthy',
      recordedAt: new Date(),
      recordedBy: req.user._id
    };

    // Mark OTP as used and set check-in time
    application.checkIn.otpUsed = true;
    application.checkIn.actualCheckInTime = new Date();
    application.checkIn.checkedInBy = req.user._id;
    application.status = 'active_care';

    await application.save();

    res.json({
      success: true,
      message: 'Check-in recorded successfully',
      data: { application }
    });
  } catch (error) {
    console.error('Record check-in error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Add daily care log
 */
const addDailyCareLog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { id } = req.params;
    const { date, petId, activities, notes } = req.body;

    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const application = await TemporaryCareApplication.findOne({
      _id: id,
      centerId: center._id,
      status: 'active_care'
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or not in active care' });
    }

    // Find existing log for this date and pet
    const existingLogIndex = application.dailyCareLogs.findIndex(
      log => log.date.toDateString() === new Date(date).toDateString() && 
             log.petId.toString() === petId
    );

    const logData = {
      date: new Date(date),
      petId,
      activities: activities.map(act => ({
        ...act,
        performedBy: req.user._id
      })),
      notes
    };

    if (existingLogIndex >= 0) {
      // Update existing
      application.dailyCareLogs[existingLogIndex] = logData;
    } else {
      // Add new
      application.dailyCareLogs.push(logData);
    }

    await application.save();

    res.json({
      success: true,
      message: 'Daily care log added successfully',
      data: { application }
    });
  } catch (error) {
    console.error('Add care log error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Record emergency
 */
const recordEmergency = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { id } = req.params;
    const { severity, description, petId, actionsTaken, ownerNotified, vetContacted } = req.body;

    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const application = await TemporaryCareApplication.findOne({
      _id: id,
      centerId: center._id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.emergencyRecords.push({
      severity,
      description,
      petId: petId || null,
      actionsTaken,
      ownerNotified: ownerNotified || false,
      ownerNotifiedAt: ownerNotified ? new Date() : null,
      vetContacted: vetContacted || false,
      vetContactedAt: vetContacted ? new Date() : null,
      resolved: false
    });

    await application.save();

    // TODO: Send notification to owner

    res.json({
      success: true,
      message: 'Emergency recorded successfully',
      data: { application }
    });
  } catch (error) {
    console.error('Record emergency error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Generate final bill
 */
const generateFinalBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { extraDays = 0, extraDaysAmount = 0, additionalServices = [], adjustments = [] } = req.body;

    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const application = await TemporaryCareApplication.findOne({
      _id: id,
      centerId: center._id,
      status: { $in: ['active_care', 'completed'] }
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const originalTotal = application.pricing.totalAmount;
    const additionalServicesAmount = additionalServices.reduce((sum, s) => sum + s.amount, 0);
    const adjustmentsAmount = adjustments.reduce((sum, a) => sum + a.amount, 0);

    const finalTotal = originalTotal + extraDaysAmount + additionalServicesAmount + adjustmentsAmount;
    const advanceAlreadyPaid = application.pricing.advanceAmount;
    const finalAmountDue = finalTotal - advanceAlreadyPaid;

    application.finalBill = {
      originalTotal,
      extraDays,
      extraDaysAmount,
      additionalServices,
      adjustments,
      finalTotal,
      advanceAlreadyPaid,
      finalAmountDue,
      generatedAt: new Date(),
      generatedBy: req.user._id
    };

    application.finalBillGenerated = true;
    application.finalBillGeneratedAt = new Date();

    await application.save();

    res.json({
      success: true,
      message: 'Final bill generated successfully',
      data: { application }
    });
  } catch (error) {
    console.error('Generate final bill error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Record check-out
 */
const recordCheckOut = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { id } = req.params;
    const { petId, condition, otp } = req.body;

    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const application = await TemporaryCareApplication.findOne({
      _id: id,
      centerId: center._id,
      status: 'active_care'
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or not in active care' });
    }

    // Verify final payment if bill generated
    if (application.finalBill && application.finalBill.finalAmountDue > 0) {
      if (application.paymentStatus.final.status !== 'completed') {
        return res.status(400).json({ 
          success: false, 
          message: 'Final payment must be completed before check-out' 
        });
      }
    }

    // Find and update kennel assignment
    const kennelAssignment = application.kennelAssignments.find(
      ka => ka.petId.toString() === petId
    );

    if (kennelAssignment) {
      kennelAssignment.checkOutCondition = {
        description: condition.description,
        photos: condition.photos || [],
        healthStatus: condition.healthStatus || 'healthy',
        recordedAt: new Date(),
        recordedBy: req.user._id
      };
    }

    // Generate check-out OTP if not provided
    if (!otp) {
      const checkOutOtp = crypto.randomInt(100000, 999999).toString();
      application.checkOut = {
        otp: checkOutOtp,
        otpGeneratedAt: new Date(),
        otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        otpUsed: false
      };
      await application.save();

      return res.json({
        success: true,
        message: 'Check-out OTP generated',
        data: { application, checkOutOtp }
      });
    }

    // Verify OTP if provided
    if (application.checkOut.otp && application.checkOut.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid check-out OTP' });
    }

    // Mark as completed
    application.checkOut.otpUsed = true;
    application.checkOut.actualCheckOutTime = new Date();
    application.checkOut.checkedOutBy = req.user._id;
    application.status = 'completed';

    await application.save();

    res.json({
      success: true,
      message: 'Check-out recorded successfully',
      data: { application }
    });
  } catch (error) {
    console.error('Record check-out error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get analytics/dashboard stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Current occupancy
    const activeApplications = await TemporaryCareApplication.find({
      centerId: center._id,
      status: 'active_care',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    const currentOccupancy = activeApplications.reduce((count, app) => count + app.pets.length, 0);

    // Monthly revenue
    const monthlyApplications = await TemporaryCareApplication.find({
      centerId: center._id,
      status: 'completed',
      createdAt: { $gte: startOfMonth }
    });

    const monthlyRevenue = monthlyApplications.reduce((sum, app) => {
      return sum + (app.finalBill?.finalTotal || app.pricing.totalAmount || 0);
    }, 0);

    // Yearly revenue
    const yearlyApplications = await TemporaryCareApplication.find({
      centerId: center._id,
      status: 'completed',
      createdAt: { $gte: startOfYear }
    });

    const yearlyRevenue = yearlyApplications.reduce((sum, app) => {
      return sum + (app.finalBill?.finalTotal || app.pricing.totalAmount || 0);
    }, 0);

    // Pending applications
    const pendingCount = await TemporaryCareApplication.countDocuments({
      centerId: center._id,
      status: { $in: ['submitted', 'price_determined', 'advance_paid'] }
    });

    res.json({
      success: true,
      data: {
        occupancy: {
          total: center.capacity.total,
          current: currentOccupancy,
          available: center.capacity.total - currentOccupancy,
          percentage: center.capacity.total > 0 ? ((currentOccupancy / center.capacity.total) * 100).toFixed(2) : 0
        },
        revenue: {
          monthly: monthlyRevenue,
          yearly: yearlyRevenue
        },
        applications: {
          pending: pendingCount,
          active: activeApplications.length,
          totalThisMonth: monthlyApplications.length
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getApplications,
  getApplicationDetails,
  setPricing,
  verifyCapacity,
  approveOrRejectApplication,
  assignKennels,
  recordCheckInCondition,
  addDailyCareLog,
  recordEmergency,
  generateFinalBill,
  recordCheckOut,
  getDashboardStats
};
