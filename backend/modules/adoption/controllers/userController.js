const AdoptionPet = require('../models/AdoptionPet');
const AdoptionRequest = require('../models/AdoptionRequest');
const User = require('../../../core/models/User');
const paymentService = require('../../../core/services/paymentService');
const { sendMail } = require('../../../core/utils/email');
const { sendSMS } = require('../../../core/utils/sms');
// For transferring adopted pets into user's core pets with preserved petCode
const Pet = require('../../../core/models/Pet');
const PetDetails = require('../../../core/models/PetDetails');
const Species = require('../../../core/models/Species');
const Breed = require('../../../core/models/Breed');
const OwnershipHistory = require('../../../core/models/OwnershipHistory');

// User Controllers
const getAvailablePets = async (req, res) => {
  try {
    const { page = 1, limit = 12, breed, species, age, gender } = req.query;
    const query = { status: 'available', isActive: true };

    if (breed) query.breed = { $regex: breed, $options: 'i' };
    if (species) query.species = { $regex: species, $options: 'i' };
    if (gender) query.gender = gender;
    if (age) {
      const ageNum = parseInt(age);
      if (ageNum <= 12) {
        query.age = { $lte: 12 };
      } else if (ageNum <= 24) {
        query.age = { $gt: 12, $lte: 24 };
      } else if (ageNum <= 36) {
        query.age = { $gt: 24, $lte: 36 };
      } else {
        query.age = { $gt: 36 };
      }
    }

    const pets = await AdoptionPet.find(query)
      .select('name breed species age ageUnit gender color weight healthStatus vaccinationStatus temperament description images adoptionFee')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AdoptionPet.countDocuments(query);

    res.json({
      success: true,
      data: {
        pets,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPetDetails = async (req, res) => {
  try {
    const pet = await AdoptionPet.findById(req.params.id)
      .populate('adopterUserId', 'name')
      .select('-createdBy -updatedBy');

    if (!pet || !pet.isActive) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    res.json({ success: true, data: pet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const searchPets = async (req, res) => {
  try {
    const { q, breed, species, age, gender, healthStatus } = req.query;
    const query = { status: 'available', isActive: true };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { breed: { $regex: q, $options: 'i' } },
        { species: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    if (breed) query.breed = { $regex: breed, $options: 'i' };
    if (species) query.species = { $regex: species, $options: 'i' };
    if (gender) query.gender = gender;
    if (healthStatus) query.healthStatus = healthStatus;
    if (age) {
      const ageNum = parseInt(age);
      if (ageNum <= 12) {
        query.age = { $lte: 12 };
      } else if (ageNum <= 24) {
        query.age = { $gt: 12, $lte: 24 };
      } else if (ageNum <= 36) {
        query.age = { $gt: 24, $lte: 36 };
      } else {
        query.age = { $gt: 36 };
      }
    }

    const pets = await AdoptionPet.find(query)
      .select('name breed species age ageUnit gender color weight healthStatus vaccinationStatus temperament description images adoptionFee')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: pets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const submitApplication = async (req, res) => {
  try {
    const { petId, applicationData } = req.body;
    
    if (!petId) {
      return res.status(400).json({ success: false, error: 'petId is required' });
    }

    // Simple and direct: find adoption pet by its MongoDB _id
    const pet = await AdoptionPet.findById(petId);
    
    if (!pet) {
      return res.status(400).json({ 
        success: false, 
        error: `Adoption pet with ID ${petId} not found` 
      });
    }
    
    if (!pet.isActive) {
      return res.status(400).json({ 
        success: false, 
        error: 'This pet is no longer available' 
      });
    }
    if (pet.status !== 'available') {
      return res.status(400).json({ 
        success: false, 
        error: `Pet is not available for adoption (current status: ${pet.status})` 
      });
    }

    // Ensure no existing active application by same user for this pet
    const existingApplication = await AdoptionRequest.findOne({
      userId: req.user.id,
      petId: pet._id,
      status: { $in: ['pending', 'approved', 'payment_pending'] },
      isActive: true
    });

    if (existingApplication) {
      return res.status(400).json({ 
        success: false, 
        error: 'You already have a pending application for this pet' 
      });
    }

    // Normalize documents from body (supports [string] or [{url}])
    const rawDocs = Array.isArray(req.body?.documents) ? req.body.documents
                  : (Array.isArray(applicationData?.documents) ? applicationData.documents : [])
    const documents = rawDocs
      .map(d => (typeof d === 'string' ? d : (d && d.url ? d.url : null)))
      .filter(u => typeof u === 'string' && u.trim())

    const application = new AdoptionRequest({
      userId: req.user.id,
      petId: pet._id,
      applicationData: applicationData,
      documents: documents
    });

    await application.save();

    // Notify managers (best-effort)
    try {
      const managers = await User.find({ role: 'adoption_manager', isActive: true }).select('email');
      for (const manager of managers) {
        if (manager?.email) {
          await sendMail(manager.email, 'New Adoption Application', `A new adoption application has been submitted for ${pet.name}. Please review it in the manager dashboard.`);
        }
      }
    } catch (_) {}

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Upload applicant document (image/pdf)
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','application/pdf']
    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Only images or PDF files are allowed' })
    }
    const extMap = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'application/pdf': '.pdf'
    }
    const filename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${extMap[req.file.mimetype] || ''}`
    // Organize by module/area/role/user under documents
    const uploadDir = path.join(__dirname, '..', 'uploads', 'documents', 'applications', 'users', String(req.user.id))
    try { fs.mkdirSync(uploadDir, { recursive: true }) } catch (_) {}
    const filePath = path.join(uploadDir, filename)
    fs.writeFileSync(filePath, req.file.buffer)
    const url = `/modules/adoption/uploads/documents/applications/users/${req.user.id}/${filename}`
    return res.status(201).json({ success: true, data: { url, name: filename, type: req.file.mimetype } })
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message })
  }
}

const getUserApplications = async (req, res) => {
  try {
    const applications = await AdoptionRequest.find({ 
      userId: req.user.id, 
      isActive: true 
    })
      .populate('petId', 'name breed species age images')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUserApplicationById = async (req, res) => {
  try {
    const application = await AdoptionRequest.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    })
      .populate('petId', 'name breed species age images')
      .populate('reviewedBy', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const cancelApplication = async (req, res) => {
  try {
    const application = await AdoptionRequest.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot cancel completed application' 
      });
    }

    await application.updateStatus('cancelled', req.user.id, 'Application cancelled by user');

    // Make pet available again if it was reserved
    const pet = await AdoptionPet.findById(application.petId);
    if (pet && pet.status === 'reserved' && pet.adopterUserId.toString() === req.user.id) {
      pet.status = 'available';
      pet.adopterUserId = null;
      await pet.save();
    }

    res.json({
      success: true,
      message: 'Application cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

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

    if (application.status !== 'approved') {
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
          await sendMail(applicant.email, 'Adoption Completed', `Hi ${applicant.name || ''}, your adoption application for ${pet.name} has been completed successfully. Please check your dashboard for more details.`)
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

        const corePet = new Pet({
          name: pet.name || 'Pet',
          species: speciesDoc._id,
          breed: breedDoc._id,
          petDetails: pd._id,
          owner: req.user.id,
          gender: (pet.gender || 'Unknown').toLowerCase() === 'male' ? 'Male' : (pet.gender || 'Unknown').toLowerCase() === 'female' ? 'Female' : 'Unknown',
          color: pet.color || 'Unknown',
          images: (pet.images || []).map(img => ({ url: img.url, caption: img.caption || '', isPrimary: !!img.isPrimary })),
          tags: ['adoption'],
          description: pet.description || '',
          createdBy: req.user.id,
          // Preserve code from adoption pet
          petCode: pet.petCode,
          currentStatus: 'Adopted',
        })
        await corePet.save()

        // Centralized registry sync: identity + state
        try {
          const PetRegistryService = require('../../../core/services/petRegistryService')
          await PetRegistryService.upsertAndSetState({
            petCode: pet.petCode,
            name: pet.name || 'Pet',
            species: speciesDoc._id,
            breed: breedDoc._id,
            images: (pet.images || []).map(img => ({ url: img.url, caption: img.caption || '', isPrimary: !!img.isPrimary })),
            source: 'adoption',
            adoptionPetId: pet._id,
            actorUserId: req.user.id
          }, {
            currentOwnerId: req.user.id,
            currentLocation: 'at_owner',
            currentStatus: 'adopted',
            lastTransferAt: new Date()
          })
        } catch (regErr) {
          console.warn('PetRegistry sync failed (adoption complete):', regErr?.message || regErr)
        }

        // Ownership history entry
        try {
          await OwnershipHistory.create({
            pet: corePet._id,
            previousOwner: pet.createdBy || req.user.id,
            newOwner: req.user.id,
            transferType: 'Adoption',
            reason: 'Adopted via site',
            transferFee: { amount: Number(application.paymentDetails?.amount || 0), currency: application.paymentDetails?.currency || 'INR', paid: true, paymentMethod: 'Card' },
            createdBy: req.user.id,
          })
        } catch (ohErr) {
          console.warn('Ownership history (adoption) create failed:', ohErr?.message)
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

const getUserAdoptedPets = async (req, res) => {
  try {
    const pets = await AdoptionPet.find({
      adopterUserId: req.user.id,
      status: 'adopted',
      isActive: true
    })
      .select('name breed species age ageUnit gender color weight healthStatus vaccinationStatus temperament description images adoptionDate')
      .sort({ adoptionDate: -1 });

    res.json({ success: true, data: pets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUserAdoptedPetDetails = async (req, res) => {
  try {
    const pet = await AdoptionPet.findOne({
      _id: req.params.id,
      adopterUserId: req.user.id,
      status: 'adopted',
      isActive: true
    });

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    res.json({ success: true, data: pet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Public Controllers
const getPublicPets = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    
    const pets = await AdoptionPet.find({ 
      status: 'available', 
      isActive: true 
    })
      .select('name breed species age ageUnit gender color weight healthStatus vaccinationStatus temperament description images adoptionFee')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AdoptionPet.countDocuments({ 
      status: 'available', 
      isActive: true 
    });

    res.json({
      success: true,
      data: {
        pets,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPublicPetDetails = async (req, res) => {
  try {
    const pet = await AdoptionPet.findById(req.params.id)
      .select('-createdBy -updatedBy -adopterUserId');

    if (!pet || !pet.isActive || pet.status !== 'available') {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    res.json({ success: true, data: pet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAvailablePets,
  getPetDetails,
  searchPets,
  submitApplication,
  getUserApplications,
  getUserApplicationById,
  cancelApplication,
  createUserPaymentOrder,
  verifyUserPayment,
  uploadDocument,
  getUserAdoptedPets,
  getUserAdoptedPetDetails,
  getPublicPets,
  getPublicPetDetails
};

