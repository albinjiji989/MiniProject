const AdoptionPet = require('../../manager/models/AdoptionPet');
const AdoptionRequest = require('../../manager/models/AdoptionRequest');
const User = require('../../../../core/models/User');
const paymentService = require('../../../../core/services/paymentService');
const { sendMail } = require('../../../../core/utils/email');
const { sendSMS } = require('../../../../core/utils/sms');
const Pet = require('../../../../core/models/Pet');
const PetDetails = require('../../../../core/models/PetDetails');
const Species = require('../../../../core/models/Species');
const Breed = require('../../../../core/models/Breed');
const OwnershipHistory = require('../../../../core/models/OwnershipHistory');
const UnifiedPetRegistrationService = require('../../../../core/services/unifiedPetRegistrationService');

const createUserPaymentOrder = async (req, res) => {
  try {
    const { applicationId } = req.body;
    
    const application = await AdoptionRequest.findOne({
      _id: applicationId,
      userId: req.user.id,
      isActive: true
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.status !== 'approved' && application.status !== 'completed' && application.status !== 'payment_completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Application must be approved before payment' 
      });
    }

    const pet = await AdoptionPet.findById(application.petId);
    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    const orderResult = await paymentService.createOrder(pet.adoptionFee, 'INR', {
      applicationId: applicationId,
      userId: application.userId,
      petId: application.petId
    });

    if (!orderResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: orderResult.error 
      });
    }

    // Update application with order details
    application.paymentDetails.razorpayOrderId = orderResult.order.id;
    application.paymentStatus = 'processing';
    await application.save();

    res.json({
      success: true,
      data: {
        orderId: orderResult.order.id,
        amount: orderResult.order.amount,
        currency: orderResult.order.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const verifyUserPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, applicationId } = req.body;

    const isVerified = paymentService.verifyPayment(signature, orderId, paymentId);
    
    if (!isVerified) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment verification failed' 
      });
    }

    const application = await AdoptionRequest.findOne({
      _id: applicationId,
      userId: req.user.id,
      isActive: true
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Get payment details from Razorpay
    const paymentDetails = await paymentService.getPaymentDetails(paymentId);
    if (!paymentDetails.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to fetch payment details' 
      });
    }

    // Update application with payment details
    application.paymentDetails = {
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      amount: paymentDetails.payment.amount / 100, // Convert from paise
      currency: paymentDetails.payment.currency,
      transactionId: paymentDetails.payment.id
    };

    await application.completePayment(application.paymentDetails);

    // Complete adoption
    const pet = await AdoptionPet.findById(application.petId);
    if (pet) {
      pet.completeAdoption();
      await pet.save();

      // Send notification to applicant
      try {
        const applicant = await User.findById(application.userId).select('email phone name')
        if (applicant?.email) {
          await sendMail({to: applicant.email, subject: 'Adoption Completed', html: `Hi ${applicant.name || ''}, your adoption application for ${pet.name} has been completed successfully. Please check your dashboard for more details.`})
        }
        if (applicant?.phone) {
          await sendSMS(applicant.phone, `Your adoption for ${pet.name} is completed. Check your dashboard for details.`)
        }
      } catch (_) {}
      // Create core Pet for the adopter preserving petCode
      try {
        // Resolve species and breed IDs
        let speciesDoc = await Species.findOne({ $or: [ { displayName: pet.species }, { name: pet.species?.toLowerCase() } ] })
        if (!speciesDoc) {
          // fallback: create minimal species? Better: skip to avoid bad data
          throw new Error('Species not found for adopted pet')
        }
        const breedDoc = await Breed.findOne({ name: pet.breed, speciesId: speciesDoc._id })
        if (!breedDoc) {
          throw new Error('Breed not found for adopted pet')
        }

        const pd = await PetDetails.create({
          speciesId: speciesDoc._id,
          breedId: breedDoc._id,
          name: pet.name || 'Pet',
          description: pet.description || '',
          color: pet.color || 'Unknown',
          ageRange: { min: 0, max: 0 },
          weightRange: { min: 0, max: 0, unit: 'kg' },
          typicalLifespan: { min: 0, max: 0, unit: 'years' },
          vaccinationRequirements: [],
          careInstructions: {},
          temperament: Array.isArray(pet.temperament) ? pet.temperament : (pet.temperament ? [pet.temperament] : []),
          specialNeeds: Array.isArray(pet.specialNeeds) ? pet.specialNeeds : [],
          createdBy: req.user.id,
        })

        // Create user pet records using unified service
        const { pet: corePet } = await UnifiedPetRegistrationService.createUserPetRecords({
          name: pet.name || 'Pet',
          speciesId: speciesDoc._id,
          breedId: breedDoc._id,
          ownerId: req.user.id,
          gender: (pet.gender || 'Unknown').toLowerCase() === 'male' ? 'Male' : (pet.gender || 'Unknown').toLowerCase() === 'female' ? 'Female' : 'Unknown',
          age: pet.age || 0,
          ageUnit: pet.ageUnit || 'months',
          color: pet.color || 'Unknown',
          weight: { value: pet.weight || 0, unit: 'kg' },
          size: 'medium',
          temperament: Array.isArray(pet.temperament) ? pet.temperament : (pet.temperament ? [pet.temperament] : []),
          specialNeeds: Array.isArray(pet.specialNeeds) ? pet.specialNeeds : (pet.specialNeeds ? [pet.specialNeeds] : []),
          imageIds: (pet.images || []).map(img => img._id || img.id),
          currentStatus: 'Adopted',
          healthStatus: 'Good',
          createdBy: req.user.id
        });

        // Register pet in unified registry
        await UnifiedPetRegistrationService.registerPet({
          petCode: pet.petCode,
          name: pet.name || 'Pet',
          species: speciesDoc._id,
          breed: breedDoc._id,
          images: pet.images || [],
          source: 'adoption',
          firstAddedSource: 'adoption_center',
          firstAddedBy: pet.createdBy,
          currentOwnerId: req.user.id,
          currentStatus: 'adopted',
          currentLocation: 'at_owner',
          gender: (pet.gender || 'Unknown').toLowerCase() === 'male' ? 'Male' : (pet.gender || 'Unknown').toLowerCase() === 'female' ? 'Female' : 'Unknown',
          age: pet.age || 0,
          ageUnit: pet.ageUnit || 'months',
          color: pet.color || 'Unknown',
          sourceReferences: {
            adoptionPetId: pet._id
          },
          ownershipTransfer: {
            previousOwnerId: pet.createdBy,
            newOwnerId: req.user.id,
            transferType: 'adoption',
            transferPrice: Number(application.paymentDetails?.amount || 0),
            transferReason: 'Pet Adoption',
            source: 'adoption',
            notes: 'Adoption completed successfully',
            performedBy: req.user.id
          },
          actorUserId: req.user.id
        });

        // Create ownership history entry
        try {
          await UnifiedPetRegistrationService.createOwnershipHistory({
            petId: corePet._id,
            previousOwner: pet.createdBy || req.user.id,
            newOwner: req.user.id,
            transferType: 'Adoption',
            reason: 'Adopted via site',
            transferFee: { amount: Number(application.paymentDetails?.amount || 0), currency: application.paymentDetails?.currency || 'INR', paid: true, paymentMethod: 'Card' },
            createdBy: req.user.id,
          });
        } catch (ohErr) {
          console.warn('Ownership history (adoption) create failed:', ohErr?.message);
        }
      } catch (x) {
        console.error('Create core Pet after adoption failed:', x?.message)
      }
    }

    res.json({
      success: true,
      message: 'Payment verified and adoption completed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createUserPaymentOrder,
  verifyUserPayment
};