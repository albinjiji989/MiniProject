const TemporaryCareApplication = require('../../models/TemporaryCareApplication');
const TemporaryCareCenter = require('../../manager/models/TemporaryCareCenter');
const CenterPricing = require('../../models/CenterPricing');
const Pet = require('../../../../core/models/Pet');
const AdoptionPet = require('../../../adoption/manager/models/AdoptionPet');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

/**
 * Submit Temporary Care Application (Multiple Pets Supported)
 */
const submitApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { pets, centerId, startDate, endDate, specialInstructions } = req.body;

    // Validate pets array
    if (!pets || !Array.isArray(pets) || pets.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one pet is required' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }
    if (start < new Date()) {
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
    }

    // Verify center exists and is active
    const center = await TemporaryCareCenter.findById(centerId);
    if (!center || !center.isActive) {
      return res.status(404).json({ success: false, message: 'Care center not found or not active' });
    }

    // Verify all pets belong to user (support both _id and petCode)
    const petIds = pets.map(p => p.petId);
    
    console.log('=== DEBUGGING PET LOOKUP ===');
    console.log('User ID:', req.user._id);
    console.log('Looking for pets with IDs:', petIds);
    
    // First, let's see what pets this user actually has in Pet registry
    const userPets = await Pet.find({ owner: req.user._id, isActive: true }).select('petCode _id name');
    console.log('User has these pets in Pet registry:', userPets.map(p => ({ petCode: p.petCode, _id: p._id, name: p.name })));
    
    // Also check AdoptionPet collection
    const userAdoptionPets = await AdoptionPet.find({ petCode: { $exists: true } }).select('petCode _id name');
    console.log('AdoptionPets with petCode:', userAdoptionPets.map(p => ({ petCode: p.petCode, _id: p._id, name: p.name })));
    
    // Try finding by petCode in Pet collection first
    let petDocs = await Pet.find({ 
      petCode: { $in: petIds }, 
      owner: req.user._id, 
      isActive: true 
    });
    
    console.log('Found by petCode in Pet:', petDocs.length, petDocs.map(p => ({ petCode: p.petCode, owner: p.owner })));
    
    // If not found in Pet, try AdoptionPet collection
    if (petDocs.length < petIds.length) {
      const foundPetCodes = petDocs.map(p => p.petCode);
      const remainingIds = petIds.filter(id => !foundPetCodes.includes(id));
      
      console.log('Searching AdoptionPet for remaining IDs:', remainingIds);
      
      const adoptionPets = await AdoptionPet.find({ 
        petCode: { $in: remainingIds }
      });
      
      console.log('Found in AdoptionPet:', adoptionPets.length);
      
      // Convert AdoptionPets to Pet-like objects for validation
      petDocs = [...petDocs, ...adoptionPets];
    }
    
    // If not all found by petCode, try finding remaining by _id
    if (petDocs.length < petIds.length) {
      const foundPetCodes = petDocs.map(p => p.petCode);
      const remainingIds = petIds.filter(id => !foundPetCodes.includes(id));
      
      console.log('Remaining IDs to search:', remainingIds);
      
      // Only query _id if the remaining IDs look like ObjectIds (24 hex chars)
      const objectIdPattern = /^[a-f\d]{24}$/i;
      const possibleObjectIds = remainingIds.filter(id => objectIdPattern.test(id));
      
      console.log('IDs that match ObjectId pattern:', possibleObjectIds);
      
      if (possibleObjectIds.length > 0) {
        const petsByObjectId = await Pet.find({ 
          _id: { $in: possibleObjectIds }, 
          owner: req.user._id, 
          isActive: true 
        });
        console.log('Found by _id:', petsByObjectId.length);
        petDocs = [...petDocs, ...petsByObjectId];
      }
    }
    
    console.log('Total pets found:', petDocs.length, 'Expected:', petIds.length);
    console.log('=== END DEBUG ===');
    
    if (petDocs.length !== petIds.length) {
      return res.status(400).json({ success: false, message: 'One or more pets not found or not owned by you' });
    }

    // Check for date conflicts for each pet
    for (const petId of petIds) {
      const existingApplication = await TemporaryCareApplication.findOne({
        'pets.petId': petId,
        $or: [
          { startDate: { $lte: start }, endDate: { $gte: start } },
          { startDate: { $lte: end }, endDate: { $gte: end } },
          { startDate: { $gte: start }, endDate: { $lte: end } }
        ],
        status: { $in: ['submitted', 'price_determined', 'advance_paid', 'approved', 'active_care'] }
      });

      if (existingApplication) {
        return res.status(400).json({ 
          success: false, 
          message: `Pet already has an active care application for the selected dates` 
        });
      }
    }

    // Calculate number of days
    const diffTime = Math.abs(end - start);
    const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Generate application number
    const applicationNumber = `TCA-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Create application with initial pricing (will be updated by manager)
    const application = await TemporaryCareApplication.create({
      applicationNumber,
      userId: req.user._id,
      pets: pets.map(p => ({
        petId: p.petId,
        specialInstructions: p.specialInstructions || {}
      })),
      startDate: start,
      endDate: end,
      numberOfDays,
      centerId: center._id,
      centerName: center.name,
      pricing: {
        petPricing: [], // Will be filled by manager
        subtotal: 0,
        additionalCharges: [],
        discount: { amount: 0 },
        tax: { percentage: 18, amount: 0 },
        totalAmount: 0,
        advanceAmount: 0,
        remainingAmount: 0
      },
      status: 'submitted'
    });

    // Populate pets for response
    await application.populate('pets.petId');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. Manager will determine pricing.',
      data: { application }
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Calculate estimated pricing (before manager sets final pricing)
 */
const calculateEstimatedPricing = async (req, res) => {
  try {
    const { pets, centerId, startDate, endDate } = req.body;

    const center = await TemporaryCareCenter.findById(centerId);
    if (!center || !center.isActive) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const pricing = await CenterPricing.findOne({ centerId, isActive: true });
    if (!pricing) {
      return res.status(404).json({ success: false, message: 'Pricing not configured for this center' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));

    // Calculate pricing per pet
    const petPricing = [];
    let subtotal = 0;

    for (const petInfo of pets) {
      // Try finding by petCode first, then by _id
      let pet;
      const objectIdPattern = /^[a-f\d]{24}$/i;
      if (objectIdPattern.test(petInfo.petId)) {
        pet = await Pet.findById(petInfo.petId);
      } else {
        pet = await Pet.findOne({ petCode: petInfo.petId });
      }
      if (!pet) continue;

      // Get base rate for pet type and size
      const baseRatePerDay = pricing.getRateForPet(pet.speciesId?.name || 'Dog', petInfo.size);
      const baseAmount = baseRatePerDay * numberOfDays;

      // Add special care addons if any
      const specialCareAddons = [];
      let addonsAmount = 0;
      if (petInfo.specialCareAddons && Array.isArray(petInfo.specialCareAddons)) {
        for (const addonName of petInfo.specialCareAddons) {
          const addon = pricing.specialCareAddons.find(a => a.name === addonName);
          if (addon) {
            let addonAmount = 0;
            if (addon.isPercentage) {
              addonAmount = (baseAmount * addon.ratePerDay) / 100;
            } else {
              addonAmount = addon.ratePerDay * numberOfDays;
            }
            specialCareAddons.push({ name: addon.name, amount: addonAmount });
            addonsAmount += addonAmount;
          }
        }
      }

      const petTotal = baseAmount + addonsAmount;
      subtotal += petTotal;

      petPricing.push({
        petId: pet._id,
        petType: pet.speciesId?.name || 'Dog',
        petSize: petInfo.size || 'medium',
        baseRatePerDay,
        numberOfDays,
        baseAmount,
        specialCareAddons,
        totalAmount: petTotal
      });
    }

    // Calculate tax
    const taxPercentage = pricing.tax.percentage || 18;
    const taxAmount = (subtotal * taxPercentage) / 100;
    const totalAmount = subtotal + taxAmount;

    // Calculate advance (50%)
    const advancePercentage = pricing.advancePercentage || 50;
    const advanceAmount = (totalAmount * advancePercentage) / 100;
    const remainingAmount = totalAmount - advanceAmount;

    res.json({
      success: true,
      data: {
        petPricing,
        subtotal,
        tax: { percentage: taxPercentage, amount: taxAmount },
        totalAmount,
        advanceAmount,
        remainingAmount,
        numberOfDays
      }
    });
  } catch (error) {
    console.error('Calculate pricing error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get user's applications
 */
const getMyApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };
    if (status) {
      filter.status = status;
    }

    const applications = await TemporaryCareApplication.find(filter)
      .populate('pets.petId', 'name speciesId breedId age profileImage')
      .populate('centerId', 'name address phone email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { applications }
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

    const application = await TemporaryCareApplication.findOne({
      _id: id,
      userId: req.user._id
    })
      .populate('centerId')
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
 * Cancel application
 */
const cancelApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await TemporaryCareApplication.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Only allow cancellation if not in active care
    if (application.status === 'active_care') {
      return res.status(400).json({ success: false, message: 'Cannot cancel application that is in active care' });
    }

    if (application.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel completed application' });
    }

    application.status = 'cancelled';
    await application.save();

    res.json({
      success: true,
      message: 'Application cancelled successfully',
      data: { application }
    });
  } catch (error) {
    console.error('Cancel application error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Approve pricing set by manager
 */
const approvePricing = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await TemporaryCareApplication.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Check if pricing has been determined
    if (application.status !== 'price_determined') {
      return res.status(400).json({ success: false, message: 'Pricing has not been set by manager yet' });
    }

    // User approves the pricing - status stays as price_determined, ready for payment
    // No status change needed, user can now proceed to payment
    
    res.json({
      success: true,
      message: 'Pricing approved. You can now proceed to payment.',
      data: { application }
    });
  } catch (error) {
    console.error('Approve pricing error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Reject pricing set by manager (cancels application)
 */
const rejectPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await TemporaryCareApplication.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Check if pricing has been determined
    if (application.status !== 'price_determined') {
      return res.status(400).json({ success: false, message: 'Pricing has not been set by manager yet' });
    }

    // User rejects the pricing - cancel application
    application.status = 'cancelled';
    application.cancellationReason = reason || 'User rejected the pricing';
    application.cancelledAt = new Date();
    application.cancelledBy = req.user._id;
    await application.save();

    res.json({
      success: true,
      message: 'Pricing rejected. Application has been cancelled.',
      data: { application }
    });
  } catch (error) {
    console.error('Reject pricing error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  submitApplication,
  calculateEstimatedPricing,
  getMyApplications,
  getApplicationDetails,
  cancelApplication,
  approvePricing,
  rejectPricing
};
