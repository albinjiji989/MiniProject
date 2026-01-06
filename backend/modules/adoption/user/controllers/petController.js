const AdoptionPet = require('../../manager/models/AdoptionPet');
const AdoptionRequest = require('../../manager/models/AdoptionRequest');

const getUserAdoptedPets = async (req, res) => {
  try {
    const pets = await AdoptionPet.find({
      adopterUserId: req.user.id,
      status: 'adopted',
      isActive: true
    })
      .select('petCode name breed species age ageUnit gender color weight healthStatus vaccinationStatus temperament description imageIds documentIds adoptionDate')
      .populate('imageIds')
      .populate('documentIds')
      .sort({ adoptionDate: -1 });
    
    // Log actual database data for debugging
    if (pets.length > 0) {
      console.log('🔍 DATABASE CHECK - First adoption pet data:', {
        _id: pets[0]._id,
        name: pets[0].name,
        imageIds: pets[0].imageIds,
        imageIdsLength: pets[0].imageIds?.length,
        imageIdsType: typeof pets[0].imageIds,
        hasImagesVirtual: pets[0].images !== undefined,
        imagesVirtualLength: pets[0].images?.length
      });
    }
    
    // Manually populate the virtual 'images' and 'documents' fields for each pet
    for (const pet of pets) {
      console.log('📸 ADOPTION - Before populate - imageIds:', pet.imageIds?.map(id => id._id || id));
      await pet.populate('images');
      await pet.populate('documents');
      console.log('📸 ADOPTION - After populate - images:', pet.images?.length || 0, 'images');
      if (pet.images?.length > 0) {
        console.log('📸 ADOPTION - First image data:', {
          _id: pet.images[0]._id,
          url: pet.images[0].url,
          isPrimary: pet.images[0].isPrimary,
          entityType: pet.images[0].entityType
        });
      }
    }

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
    }).populate('imageIds').populate('documentIds');
    
    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }
    
    // Manually populate the virtual 'images' and 'documents' fields
    await pet.populate('images');
    await pet.populate('documents');

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
    // Exclude pets that are already adopted
    const pets = await AdoptionPet.find({ 
      status: 'available', 
      isActive: true,
      adopterUserId: null // Ensure pet is not already adopted
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
      isActive: true,
      adopterUserId: null // Ensure pet is not already adopted
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
      return res.status(404).json({ 
        success: false, 
        error: `Pet with ID ${req.params.id} not found. The pet may have been adopted by another user, removed by the adoption manager, or the link you're using may be outdated. Please go back to the pet listings and select a currently available pet.` 
      });
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