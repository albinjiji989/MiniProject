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

    // Verify all pets exist and belong to user (support both _id and petCode)
    const petIds = pets.map(p => p.petId);

    console.log('=== DEBUGGING PET LOOKUP ===');
    console.log('User ID:', req.user._id);
    console.log('Looking for pets with IDs:', petIds);

    // Strategy: Find pets from multiple sources
    // 1. PetRegistry (centralized ownership tracking) - PRIMARY SOURCE
    // 2. Pet collection (owned pets - purchased or registered)
    // 3. AdoptionPet collection (adopted pets)
    // 4. PetInventoryItem collection (purchased from petshop)

    const PetInventoryItem = require('../../../petshop/manager/models/PetInventoryItem');
    const PetReservation = require('../../../petshop/user/models/PetReservation');
    const PetRegistry = require('../../../../core/models/PetRegistry');

    let petDocs = [];
    const foundPetIds = new Set();
    const verifiedPetCodes = new Set(); // Pets verified via PetRegistry

    // FIRST: Check PetRegistry for ownership (most reliable)
    console.log('Checking PetRegistry for ownership...');
    const registryEntries = await PetRegistry.find({
      petCode: { $in: petIds },
      currentOwnerId: req.user._id
    });
    console.log('Found in PetRegistry:', registryEntries.length);

    for (const entry of registryEntries) {
      verifiedPetCodes.add(entry.petCode);
      console.log('✓ Pet owned (via Registry):', entry.petCode);
    }

    // Now fetch actual pet documents for verified pets
    // Search in Pet collection
    const petsFromPetCollection = await Pet.find({
      petCode: { $in: petIds },
      isActive: true
    });
    console.log('Found in Pet collection:', petsFromPetCollection.length);

    for (const pet of petsFromPetCollection) {
      const verifiedByRegistry = verifiedPetCodes.has(pet.petCode);
      const ownedDirectly = pet.ownerId && pet.ownerId.toString() === req.user._id.toString();

      if (verifiedByRegistry || ownedDirectly) {
        petDocs.push(pet);
        foundPetIds.add(pet.petCode);
        console.log('✓ Pet document added:', pet.petCode, pet.name);
      }
    }

    // Search in AdoptionPet collection
    const remainingIds = petIds.filter(id => !foundPetIds.has(id));
    if (remainingIds.length > 0) {
      console.log('Searching AdoptionPet for remaining IDs:', remainingIds);

      const adoptionPets = await AdoptionPet.find({
        petCode: { $in: remainingIds }
      });
      console.log('Found in AdoptionPet:', adoptionPets.length);

      for (const pet of adoptionPets) {
        const verifiedByRegistry = verifiedPetCodes.has(pet.petCode);
        const isAdoptedByUser = pet.adopterUserId && pet.adopterUserId.toString() === req.user._id.toString();

        if (verifiedByRegistry || isAdoptedByUser) {
          petDocs.push(pet);
          foundPetIds.add(pet.petCode);
          console.log('✓ AdoptionPet document added:', pet.petCode, pet.name);
        }
      }
    }

    // Search in PetInventoryItem (purchased from petshop)
    const stillMissingIds = petIds.filter(id => !foundPetIds.has(id));
    if (stillMissingIds.length > 0) {
      console.log('Searching PetInventoryItem for remaining IDs:', stillMissingIds);

      const inventoryPets = await PetInventoryItem.find({
        petCode: { $in: stillMissingIds }
      });
      console.log('Found in PetInventoryItem:', inventoryPets.length);

      // Check if verified via PetRegistry OR purchased via reservations
      for (const pet of inventoryPets) {
        const verifiedByRegistry = verifiedPetCodes.has(pet.petCode);

        if (verifiedByRegistry) {
          petDocs.push(pet);
          foundPetIds.add(pet.petCode);
          console.log('✓ PetInventoryItem document added (via Registry):', pet.petCode, pet.name);
          continue;
        }

        const reservation = await PetReservation.findOne({
          itemId: pet._id,
          userId: req.user._id,
          status: { $in: ['completed', 'at_owner', 'paid', 'delivered'] }
        });

        if (reservation) {
          petDocs.push(pet);
          foundPetIds.add(pet.petCode);
          console.log('✓ PetInventoryItem document added (via Reservation):', pet.petCode, pet.name);
        } else {
          console.log('✗ PetInventoryItem not purchased by user:', pet.petCode);
        }
      }
    }

    // Try finding by ObjectId if still missing
    const finalMissingIds = petIds.filter(id => !foundPetIds.has(id));
    if (finalMissingIds.length > 0) {
      const objectIdPattern = /^[a-f\d]{24}$/i;
      const possibleObjectIds = finalMissingIds.filter(id => objectIdPattern.test(id));

      if (possibleObjectIds.length > 0) {
        console.log('Searching by ObjectId:', possibleObjectIds);

        const petsByObjectId = await Pet.find({
          _id: { $in: possibleObjectIds },
          ownerId: req.user._id,
          isActive: true
        });

        for (const pet of petsByObjectId) {
          petDocs.push(pet);
          foundPetIds.add(pet._id.toString());
          console.log('✓ Found by ObjectId:', pet._id, pet.name);
        }
      }
    }

    console.log('Total pets found:', petDocs.length, 'Expected:', petIds.length);
    console.log('Found pet IDs:', Array.from(foundPetIds));
    console.log('=== END DEBUG ===');

    if (petDocs.length !== petIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more pets not found or not owned by you',
        debug: {
          requested: petIds,
          found: Array.from(foundPetIds),
          missing: petIds.filter(id => !foundPetIds.has(id))
        }
      });
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
