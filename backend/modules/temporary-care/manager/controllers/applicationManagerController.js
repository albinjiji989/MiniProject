const TemporaryCareApplication = require('../../models/TemporaryCareApplication');
const TemporaryCareCenter = require('../../manager/models/TemporaryCareCenter');
const CenterPricing = require('../../models/CenterPricing');
const Pet = require('../../../../core/models/Pet');
const AdoptionPet = require('../../../adoption/manager/models/AdoptionPet');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendMail } = require('../../../../core/utils/email');

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
    // Use centralized pet service for better data consistency
    const CentralizedPetService = require('../../../../core/services/centralizedPetService');
    
    for (let application of applications) {
      console.log(`🏥 Processing application ${application._id} with ${application.pets?.length || 0} pets`);
      
      for (let pet of application.pets) {
        console.log(`🔍 Looking for pet with code: ${pet.petId}`);
        
        try {
          // Use centralized service to get complete pet data with images
          const centralizedPet = await CentralizedPetService.getCentralizedPet(pet.petId);
          
          if (centralizedPet) {
            console.log(`✅ Found centralized pet data for ${pet.petId}:`, {
              name: centralizedPet.name,
              species: centralizedPet.species?.name || centralizedPet.species?.displayName,
              breed: centralizedPet.breed?.name,
              hasImages: !!(centralizedPet.images && centralizedPet.images.length > 0),
              imageCount: centralizedPet.images?.length || 0,
              sourceData: !!centralizedPet.sourceData,
              firstImageUrl: centralizedPet.images?.[0]?.url,
              sourceDataImages: centralizedPet.sourceData?.images?.length || 0
            });
            
            // Create comprehensive petDetails object with proper structure
            pet.petDetails = {
              _id: centralizedPet._id,
              name: centralizedPet.name || centralizedPet.sourceData?.name || `Pet ${pet.petId}`,
              petCode: centralizedPet.petCode || pet.petId,
              
              // Species handling - try multiple sources
              species: centralizedPet.species?.name || centralizedPet.species?.displayName || centralizedPet.sourceData?.species?.name || centralizedPet.sourceData?.speciesId?.name,
              speciesId: centralizedPet.species || centralizedPet.sourceData?.speciesId,
              
              // Breed handling - try multiple sources  
              breed: centralizedPet.breed?.name || centralizedPet.sourceData?.breed?.name || centralizedPet.sourceData?.breedId?.name,
              breedId: centralizedPet.breed || centralizedPet.sourceData?.breedId,
              
              // Images - comprehensive image handling
              images: centralizedPet.images || centralizedPet.sourceData?.images || centralizedPet.sourceData?.imageIds || [],
              profileImage: centralizedPet.images?.[0]?.url || centralizedPet.sourceData?.images?.[0]?.url || centralizedPet.sourceData?.profileImage,
              
              // Additional pet details
              age: centralizedPet.sourceData?.age || centralizedPet.age,
              gender: centralizedPet.sourceData?.gender || centralizedPet.gender,
              description: centralizedPet.sourceData?.description || centralizedPet.description,
              color: centralizedPet.sourceData?.color,
              weight: centralizedPet.sourceData?.weight,
              
              // Status information
              currentStatus: centralizedPet.currentStatus,
              currentLocation: centralizedPet.currentLocation,
              currentOwnerId: centralizedPet.currentOwnerId,
              
              // Source information for debugging
              source: centralizedPet.source,
              sourceData: centralizedPet.sourceData
            };
            
            console.log(`📋 Created petDetails for ${pet.petId}:`, {
              name: pet.petDetails.name,
              species: pet.petDetails.species,
              breed: pet.petDetails.breed,
              hasImages: pet.petDetails.images?.length > 0,
              profileImage: !!pet.petDetails.profileImage,
              imageUrls: pet.petDetails.images?.map(img => img.url || img)
            });
          }
        } catch (error) {
          console.log(`❌ Centralized service failed for ${pet.petId}, trying direct database lookup:`, error.message);
          
          // Enhanced fallback with direct database queries and better image handling
          let petDetails = null;
          
          // Try PetRegistry first (most likely to have user pets)
          const PetRegistry = require('../../../../core/models/PetRegistry');
          petDetails = await PetRegistry.findOne({ petCode: pet.petId })
            .populate('species', 'name displayName')
            .populate('breed', 'name');
          console.log(`📝 PetRegistry result for ${pet.petId}:`, petDetails ? 'Found' : 'Not found');
          
          if (petDetails) {
            console.log(`📝 PetRegistry data:`, {
              name: petDetails.name,
              species: petDetails.species?.name,
              breed: petDetails.breed?.name,
              imageIds: petDetails.imageIds?.length || 0,
              source: petDetails.source
            });
            
            // Get images from source based on registry source
            let sourceImages = [];
            if (petDetails.source === 'petshop' && petDetails.petShopItemId) {
              const PetInventoryItem = require('../../../petshop/manager/models/PetInventoryItem');
              const sourceData = await PetInventoryItem.findById(petDetails.petShopItemId).populate('imageIds');
              if (sourceData?.imageIds) {
                sourceImages = sourceData.imageIds;
                console.log(`🏪 Found ${sourceImages.length} images from PetInventoryItem`);
              }
            } else if (petDetails.source === 'user' && petDetails.userPetId) {
              const Pet = require('../../../../core/models/Pet');
              const sourceData = await Pet.findById(petDetails.userPetId).populate('imageIds');
              if (sourceData?.imageIds) {
                sourceImages = sourceData.imageIds;
                console.log(`👤 Found ${sourceImages.length} images from User Pet`);
              }
            } else if (petDetails.source === 'adoption' && petDetails.adoptionPetId) {
              const AdoptionPet = require('../../../adoption/manager/models/AdoptionPet');
              const sourceData = await AdoptionPet.findById(petDetails.adoptionPetId).populate('imageIds');
              if (sourceData?.imageIds) {
                sourceImages = sourceData.imageIds;
                console.log(`🏠 Found ${sourceImages.length} images from AdoptionPet`);
              }
            }
            
            // Create standardized petDetails structure
            pet.petDetails = {
              _id: petDetails._id,
              name: petDetails.name || `Pet ${pet.petId}`,
              petCode: petDetails.petCode || pet.petId,
              species: petDetails.species?.name || petDetails.species?.displayName,
              speciesId: petDetails.species,
              breed: petDetails.breed?.name,
              breedId: petDetails.breed,
              images: sourceImages || [],
              profileImage: sourceImages?.[0]?.url,
              source: petDetails.source
            };
            
            console.log(`✅ Registry fallback success for ${pet.petId}:`, {
              name: pet.petDetails.name,
              species: pet.petDetails.species,
              breed: pet.petDetails.breed,
              hasImages: pet.petDetails.images?.length > 0,
              profileImage: !!pet.petDetails.profileImage
            });
          } else {
            // Try other collections as final fallback
            console.log(`🔍 Trying other collections for ${pet.petId}...`);
            
            // Try Pet collection
            petDetails = await Pet.findOne({ petCode: pet.petId })
              .populate('speciesId', 'name displayName')
              .populate('breedId', 'name')
              .populate('imageIds');
            console.log(`📋 Pet collection result:`, petDetails ? 'Found' : 'Not found');

            if (!petDetails) {
              // Try AdoptionPet collection
              petDetails = await AdoptionPet.findOne({ petCode: pet.petId })
                .populate('speciesId', 'name displayName')
                .populate('breedId', 'name')
                .populate('imageIds');
              console.log(`🏠 AdoptionPet collection result:`, petDetails ? 'Found' : 'Not found');
            }

            if (!petDetails) {
              // Try PetInventoryItem (petshop pets)
              const PetInventoryItem = require('../../../petshop/manager/models/PetInventoryItem');
              petDetails = await PetInventoryItem.findOne({ petCode: pet.petId })
                .populate('speciesId', 'name displayName')
                .populate('breedId', 'name')
                .populate('imageIds');
              console.log(`🏪 PetInventoryItem collection result:`, petDetails ? 'Found' : 'Not found');
            }

            if (petDetails) {
              console.log(`✅ Found pet details for ${pet.petId} via direct collection search:`, {
                name: petDetails.name,
                species: petDetails.species?.name || petDetails.speciesId?.name,
                breed: petDetails.breed?.name || petDetails.breedId?.name,
                hasImages: !!(petDetails.images && petDetails.images.length > 0) || !!(petDetails.imageIds && petDetails.imageIds.length > 0),
                imageCount: petDetails.imageIds?.length || petDetails.images?.length || 0
              });
              
              // Create standardized petDetails structure for direct collection fallback
              pet.petDetails = {
                _id: petDetails._id,
                name: petDetails.name || `Pet ${pet.petId}`,
                petCode: petDetails.petCode || pet.petId,
                species: petDetails.species?.name || petDetails.speciesId?.name,
                speciesId: petDetails.species || petDetails.speciesId,
                breed: petDetails.breed?.name || petDetails.breedId?.name,
                breedId: petDetails.breed || petDetails.breedId,
                images: petDetails.imageIds || petDetails.images || [],
                profileImage: petDetails.profileImage || petDetails.imageIds?.[0]?.url || petDetails.images?.[0]?.url,
                age: petDetails.age,
                gender: petDetails.gender,
                description: petDetails.description,
                color: petDetails.color,
                weight: petDetails.weight
              };
            } else {
              console.log(`❌ No pet details found anywhere for petCode: ${pet.petId}`);
              // Create minimal petDetails to prevent errors
              pet.petDetails = {
                name: `Pet ${pet.petId}`,
                petCode: pet.petId,
                species: 'Unknown Species',
                breed: 'Unknown Breed',
                images: [],
                profileImage: null
              };
            }
          }
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

    // Manually fetch pet details for each pet using centralized service
    const CentralizedPetService = require('../../../../core/services/centralizedPetService');
    
    for (let pet of application.pets) {
      console.log(`🔍 Looking for pet details with code: ${pet.petId}`);
      
      try {
        // Use centralized service to get complete pet data with images
        const centralizedPet = await CentralizedPetService.getCentralizedPet(pet.petId);
        
        if (centralizedPet) {
          console.log(`✅ Found centralized pet data for ${pet.petId}:`, {
            name: centralizedPet.name,
            species: centralizedPet.species?.name,
            breed: centralizedPet.breed?.name,
            hasImages: !!(centralizedPet.images && centralizedPet.images.length > 0),
            imageCount: centralizedPet.images?.length || 0
          });
          
          // Create petDetails object with proper structure
          pet.petDetails = {
            name: centralizedPet.name,
            petCode: centralizedPet.petCode,
            species: centralizedPet.species,
            breed: centralizedPet.breed,
            images: centralizedPet.images || [],
            profileImage: centralizedPet.images?.[0]?.url, // Set first image as profile
            age: centralizedPet.sourceData?.age,
            gender: centralizedPet.sourceData?.gender,
            description: centralizedPet.sourceData?.description,
            currentStatus: centralizedPet.currentStatus,
            currentLocation: centralizedPet.currentLocation,
            currentOwnerId: centralizedPet.currentOwnerId
          };
        }
      } catch (error) {
        console.log(`❌ Centralized service failed for ${pet.petId}, trying fallback:`, error.message);
        
        // Fallback to original logic if centralized service fails
        let petDetails = await Pet.findOne({ petCode: pet.petId });
        console.log(`📋 Pet collection result:`, petDetails ? 'Found' : 'Not found');

        if (!petDetails) {
          petDetails = await AdoptionPet.findOne({ petCode: pet.petId });
          console.log(`🏠 AdoptionPet collection result:`, petDetails ? 'Found' : 'Not found');

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

        if (!petDetails) {
          const PetRegistry = require('../../../../core/models/PetRegistry');
          petDetails = await PetRegistry.findOne({ petCode: pet.petId });
          console.log(`📝 PetRegistry collection result:`, petDetails ? 'Found' : 'Not found');
        }

        if (!petDetails) {
          const PetInventoryItem = require('../../../petshop/manager/models/PetInventoryItem');
          petDetails = await PetInventoryItem.findOne({ petCode: pet.petId });
          console.log(`🏪 PetInventoryItem collection result:`, petDetails ? 'Found' : 'Not found');
        }

        if (petDetails) {
          console.log(`✅ Found pet details for ${pet.petId} via fallback:`, {
            name: petDetails.name,
            species: petDetails.species || petDetails.speciesId?.name,
            breed: petDetails.breed || petDetails.breedId?.name,
            hasImages: !!(petDetails.images && petDetails.images.length > 0),
            hasProfileImage: !!petDetails.profileImage
          });
          pet.petDetails = petDetails;
        } else {
          console.log(`❌ No pet details found for petCode: ${pet.petId}`);
        }
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

    // Update pet status to show "In Temporary Care"
    const Pet = require('../../../../core/models/Pet');
    const AdoptionPet = require('../../../adoption/manager/models/AdoptionPet');
    const PetInventoryItem = require('../../../petshop/manager/models/PetInventoryItem');

    for (const pet of application.pets) {
      const petCode = pet.petId;

      // Try updating in Pet collection
      await Pet.updateMany(
        { petCode: petCode },
        {
          $set: {
            temporaryCareStatus: {
              inCare: true,
              applicationId: application._id,
              centerId: center._id,
              checkInDate: new Date(),
              originalSource: 'pet'
            }
          }
        }
      );

      // Try updating in AdoptionPet collection
      await AdoptionPet.updateMany(
        { petCode: petCode },
        {
          $set: {
            temporaryCareStatus: {
              inCare: true,
              applicationId: application._id,
              centerId: center._id,
              checkInDate: new Date(),
              originalSource: 'adoption'
            }
          }
        }
      );

      // Try updating in PetInventoryItem collection
      await PetInventoryItem.updateMany(
        { petCode: petCode },
        {
          $set: {
            temporaryCareStatus: {
              inCare: true,
              applicationId: application._id,
              centerId: center._id,
              checkInDate: new Date(),
              originalSource: 'petshop'
            }
          }
        }
      );
    }

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

    // Generate check-out OTP if not provided (no payment check here)
    if (!otp) {
      const checkOutOtp = crypto.randomInt(100000, 999999).toString();
      application.checkOut = {
        otp: checkOutOtp,
        otpGeneratedAt: new Date(),
        otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        otpUsed: false
      };
      await application.save();

      // Populate user and center info for email
      await application.populate('userId', 'email name phone');
      await application.populate('centerId', 'name');

      console.log('📧 Preparing to send pickup OTP email...');
      console.log('Application ID:', application._id);
      console.log('User:', application.userId);
      console.log('Center:', application.centerId);

      // Send OTP via email to USER
      const userEmail = application.userId?.email;
      const userName = application.userId?.name || 'User';
      const centerName = application.centerId?.name || 'Temporary Care Center';
      const otpExpiry = application.checkOut.otpExpiresAt;

      if (!userEmail) {
        console.error('❌ No user email found!');
        return res.json({
          success: true,
          message: 'Pickup OTP generated but email not sent (no user email)',
          data: { application, checkOutOtp }
        });
      }

      console.log('📧 Sending pickup OTP to:', userEmail);

      const subject = `🐾 Pet Pickup OTP - ${checkOutOtp}`;
      const html = `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:24px;color:#e6e9ef;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);backdrop-filter:blur(10px);border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;">
            <h1 style="margin:0;font-size:20px;">🐾 Pet Pickup OTP</h1>
          </td></tr>
          <tr><td style="padding:24px 28px;color:#e6e9ef;">
            <p style="margin:0 0 16px;">Hi <b>${userName}</b>,</p>
            <p style="margin:0 0 24px;">Your pet is ready for pickup at <b>${centerName}</b>! Please verify this OTP with the staff member when you arrive:</p>
            
            <div style="background:rgba(239,68,68,0.15);border:2px dashed rgba(245,158,11,0.6);border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
              <p style="margin:0;font-size:13px;color:#9ca3af;">Your Pickup OTP</p>
              <div style="font-size:36px;font-weight:bold;color:#ef4444;letter-spacing:8px;margin:12px 0;">${checkOutOtp}</div>
              <p style="margin:0;font-size:12px;color:#6b7280;">Valid for 24 hours</p>
            </div>

            <div style="background:rgba(251,191,36,0.1);border-left:4px solid #fbbf24;padding:12px 16px;margin:20px 0;">
              <p style="margin:0;font-size:13px;"><b>⏰ Expires:</b> ${otpExpiry.toLocaleString()}</p>
            </div>

            <p style="margin:16px 0 8px;"><b>Before Pickup:</b></p>
            <ul style="margin:0;padding-left:20px;line-height:1.8;">
              <li>Ensure final payment is completed</li>
              <li>Bring a valid ID</li>
              <li>Show this OTP to the care center staff</li>
              <li>Complete the checkout paperwork</li>
            </ul>

            <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">If you didn't request pickup, please contact us immediately.</p>
          </td></tr>
          <tr><td style="padding:16px 28px;text-align:center;font-size:11px;color:#6b7280;border-top:1px solid rgba(255,255,255,0.1);">
            <p style="margin:0;">Pet Connect Temporary Care System &copy; ${new Date().getFullYear()}</p>
          </td></tr>
        </table>
      </div>`;

      // Send email (non-blocking)
      try {
        await sendMail({ to: userEmail, subject, html });
        console.log('✅ Pickup OTP email sent successfully to:', userEmail);
      } catch (err) {
        console.error('❌ Failed to send pickup OTP email:', err);
      }

      return res.json({
        success: true,
        message: `Pickup OTP sent to ${userEmail}. User must pay final bill before pickup.`,
        data: { application, checkOutOtp, emailSent: userEmail }
      });
    }

    // Verify OTP if provided
    if (application.checkOut.otp && application.checkOut.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid check-out OTP' });
    }

    // NOW verify final payment before completing checkout
    if (application.finalBill && application.finalBill.finalAmountDue > 0) {
      if (application.paymentStatus.final.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Final payment must be completed before completing check-out. Please ask user to pay the final bill first.'
        });
      }
    }

    // Mark as completed
    application.checkOut.otpUsed = true;
    application.checkOut.actualCheckOutTime = new Date();
    application.checkOut.checkedOutBy = req.user._id;
    application.status = 'completed';
    application.careEndDate = new Date();

    await application.save();

    // Clear temporary care status from all pet collections
    const Pet = require('../../../../core/models/Pet');
    const AdoptionPet = require('../../../adoption/manager/models/AdoptionPet');
    const PetInventoryItem = require('../../../petshop/manager/models/PetInventoryItem');

    for (const pet of application.pets) {
      const petCode = pet.petId;

      // Clear status in Pet collection
      await Pet.updateMany(
        { petCode: petCode },
        {
          $unset: { temporaryCareStatus: "" }
        }
      );

      // Clear status in AdoptionPet collection
      await AdoptionPet.updateMany(
        { petCode: petCode },
        {
          $unset: { temporaryCareStatus: "" }
        }
      );

      // Clear status in PetInventoryItem collection
      await PetInventoryItem.updateMany(
        { petCode: petCode },
        {
          $unset: { temporaryCareStatus: "" }
        }
      );
    }

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

/**
 * Generate OTP for pet handover when user arrives at center (manager initiates)
 */
const generateHandoverOTP = async (req, res) => {
  try {
    const { applicationId } = req.body;

    // Get manager's center
    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const application = await TemporaryCareApplication.findOne({
      _id: applicationId,
      centerId: center._id
    }).populate('userId', 'email name phone').populate('centerId', 'name');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Check if advance payment is completed
    if (application.paymentStatus.advance.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Advance payment must be completed before handover'
      });
    }

    // Check if already in active care
    if (application.status === 'active_care') {
      return res.status(400).json({
        success: false,
        message: 'Pet is already in care'
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update application with handover OTP (using checkIn schema field)
    if (!application.checkIn) {
      application.checkIn = {};
    }
    application.checkIn.otp = otp;
    application.checkIn.otpGeneratedAt = new Date();
    application.checkIn.otpExpiresAt = otpExpiry;
    application.checkIn.otpUsed = false;
    await application.save();

    // Send OTP via email to USER
    const userEmail = application.userId.email;
    const userName = application.userId.name || 'User';
    const centerName = application.centerId?.name || 'Temporary Care Center';

    const subject = `🐾 Pet Handover OTP - ${otp}`;
    const html = `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:24px;color:#e6e9ef;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);backdrop-filter:blur(10px);border-radius:16px;overflow:hidden;">
        <tr><td style="padding:28px;background:linear-gradient(135deg,#6a11cb,#2575fc);color:#fff;">
          <h1 style="margin:0;font-size:20px;">🐾 Pet Handover OTP</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;color:#e6e9ef;">
          <p style="margin:0 0 16px;">Hi <b>${userName}</b>,</p>
          <p style="margin:0 0 24px;">You have arrived at <b>${centerName}</b> for pet handover! Please verify this OTP with the staff member:</p>
          
          <div style="background:rgba(106,17,203,0.15);border:2px dashed rgba(37,117,252,0.6);border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
            <p style="margin:0;font-size:13px;color:#9ca3af;">Your Handover OTP</p>
            <div style="font-size:36px;font-weight:bold;color:#2575fc;letter-spacing:8px;margin:12px 0;">${otp}</div>
            <p style="margin:0;font-size:12px;color:#6b7280;">Valid for 15 minutes</p>
          </div>

          <div style="background:rgba(251,191,36,0.1);border-left:4px solid #fbbf24;padding:12px 16px;margin:20px 0;">
            <p style="margin:0;font-size:13px;"><b>⏰ Expires:</b> ${otpExpiry.toLocaleString()}</p>
          </div>

          <p style="margin:16px 0 8px;"><b>Instructions:</b></p>
          <ul style="margin:0;padding-left:20px;line-height:1.8;">
            <li>Show this OTP to the care center staff</li>
            <li>Complete the handover paperwork</li>
            <li>Your pet will be safely checked in</li>
          </ul>

          <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">If you didn't arrive at the center, please contact us immediately.</p>
        </td></tr>
        <tr><td style="padding:16px 28px;text-align:center;font-size:11px;color:#6b7280;border-top:1px solid rgba(255,255,255,0.1);">
          <p style="margin:0;">Pet Connect Temporary Care System &copy; ${new Date().getFullYear()}</p>
        </td></tr>
      </table>
    </div>`;

    // Send email (non-blocking)
    await sendMail({ to: userEmail, subject, html }).catch(err => {
      console.error('Failed to send OTP email:', err);
    });

    res.json({
      success: true,
      message: `Handover OTP sent to ${userEmail}`,
      data: {
        applicationId: application._id,
        emailSent: userEmail,
        userPhone: application.userId.phone,
        userName,
        expiresAt: otpExpiry
      }
    });
  } catch (error) {
    console.error('Generate handover OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Verify handover OTP (manager enters OTP from user)
 */
const verifyHandoverOTP = async (req, res) => {
  try {
    const { applicationId, otp } = req.body;

    // Get manager's center
    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found' });
    }

    const application = await TemporaryCareApplication.findOne({
      _id: applicationId,
      centerId: center._id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Verify OTP (using checkIn schema field)
    if (!application.checkIn || !application.checkIn.otp) {
      return res.status(400).json({ success: false, message: 'No OTP generated for this application' });
    }

    if (application.checkIn.otpUsed) {
      return res.status(400).json({ success: false, message: 'OTP has already been used' });
    }

    if (new Date() > application.checkIn.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please generate a new one.' });
    }

    if (application.checkIn.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Mark OTP as used
    application.checkIn.otpUsed = true;
    application.checkIn.actualCheckInTime = new Date();
    application.checkIn.checkedInBy = req.user._id;
    application.status = 'active_care';
    application.careStartDate = new Date();
    await application.save();

    // Update pets' temporary care status AND currentStatus
    const PetRegistry = require('../../../../core/models/PetRegistry');

    for (const petEntry of application.pets) {
      let pet = await Pet.findOne({ petCode: petEntry.petId });
      if (!pet) {
        pet = await AdoptionPet.findOne({ petCode: petEntry.petId });
      }

      if (pet) {
        // Update temporary care status
        pet.temporaryCareStatus = {
          inCare: true,
          applicationId: application._id,
          centerId: application.centerId,
          startDate: new Date()
        };

        // Update pet's current status to "in care"
        pet.currentStatus = 'in care';

        await pet.save();

        // Also update in PetRegistry for consistency
        await PetRegistry.findOneAndUpdate(
          { petCode: petEntry.petId },
          {
            currentStatus: 'in care',
            currentLocation: `Temporary Care - ${center.centerName || 'Care Center'}`
          }
        );
      }
    }

    res.json({
      success: true,
      message: 'Pet handover completed successfully',
      data: {
        application,
        careStartDate: application.careStartDate
      }
    });
  } catch (error) {
    console.error('Verify handover OTP error:', error);
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
  getDashboardStats,
  generateHandoverOTP,
  verifyHandoverOTP
};
