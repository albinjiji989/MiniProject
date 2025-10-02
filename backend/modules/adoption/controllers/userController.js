const AdoptionPet = require('../models/AdoptionPet');
const AdoptionRequest = require('../models/AdoptionRequest');
const User = require('../../../core/models/User');
const paymentService = require('../../../core/services/paymentService');
const { sendMail } = require('../../../core/utils/email');
const { sendSMS } = require('../../../core/utils/sms');

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

    // Check if pet is available
    const pet = await AdoptionPet.findById(petId);
    if (!pet || pet.status !== 'available') {
      return res.status(400).json({ 
        success: false, 
        error: 'Pet is not available for adoption' 
      });
    }

    // Check if user already has a pending application for this pet
    const existingApplication = await AdoptionRequest.findOne({
      userId: req.user.id,
      petId: petId,
      status: { $in: ['pending', 'approved', 'payment_pending'] },
      isActive: true
    });

    if (existingApplication) {
      return res.status(400).json({ 
        success: false, 
        error: 'You already have a pending application for this pet' 
      });
    }

    const application = new AdoptionRequest({
      userId: req.user.id,
      petId: petId,
      applicationData: applicationData
    });

    await application.save();

    // Send notification to managers
    const managers = await User.find({ role: 'adoption_manager', isActive: true });
    for (const manager of managers) {
      await sendMail(manager.email, 'New Adoption Application', 
        `A new adoption application has been submitted for ${pet.name}. Please review it in the manager dashboard.`);
    }

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

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
  getUserAdoptedPets,
  getUserAdoptedPetDetails,
  getPublicPets,
  getPublicPetDetails
};
