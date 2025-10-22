const AdoptionPet = require('../../manager/models/AdoptionPet');
const AdoptionRequest = require('../../manager/models/AdoptionRequest');

const getUserAdoptedPets = async (req, res) => {
  try {
    const pets = await AdoptionPet.find({
      adopterUserId: req.user.id,
      status: 'adopted',
      isActive: true
    })
      .select('name breed species age ageUnit gender color weight healthStatus vaccinationStatus temperament description imageIds adoptionDate')
      .populate('images')
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
    }).populate('images');

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    res.json({ success: true, data: pet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add medical history entry for adopted pet
const addMedicalHistory = async (req, res) => {
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

    const medicalEntry = {
      date: new Date(),
      description: req.body.description,
      veterinarian: req.body.veterinarian,
      ...req.body
    };

    pet.medicalHistory.push(medicalEntry);
    pet.updatedBy = req.user.id;
    await pet.save();

    res.json({ 
      success: true, 
      message: 'Medical history added successfully',
      data: { pet }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get medical history for adopted pet
const getMedicalHistory = async (req, res) => {
  try {
    const pet = await AdoptionPet.findOne({
      _id: req.params.id,
      adopterUserId: req.user.id,
      status: 'adopted',
      isActive: true
    }).select('name medicalHistory');

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    res.json({ 
      success: true, 
      data: { 
        petName: pet.name,
        medicalHistory: pet.medicalHistory || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Public Controllers
const getPublicPets = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    
    // Only show pets that are available and active
    // These pets are only created by adoption managers
    const pets = await AdoptionPet.find({ 
      status: 'available', 
      isActive: true 
    })
      .select('name breed species age ageUnit gender color weight healthStatus vaccinationStatus temperament description imageIds documentIds adoptionFee petCode createdBy')
      .populate('images')
      .populate('documents')
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
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
      .populate('images')
      .populate('documents')
      .select('-createdBy -updatedBy -adopterUserId');

    if (!pet || !pet.isActive || pet.status !== 'available') {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    res.json({ success: true, data: pet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUserHandoverDetails = async (req, res) => {
  try {
    const app = await AdoptionRequest.findOne({ _id: req.params.id, userId: req.user.id, isActive: true }).select('handover status contractURL');
    if (!app) return res.status(404).json({ success: false, error: 'Application not found' });
    return res.json({ success: true, data: { handover: app.handover || {}, status: app.status, contractURL: app.contractURL || null } });
  } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
};

module.exports = {
  getUserAdoptedPets,
  getUserAdoptedPetDetails,
  addMedicalHistory,
  getMedicalHistory,
  getPublicPets,
  getPublicPetDetails,
  getUserHandoverDetails
};