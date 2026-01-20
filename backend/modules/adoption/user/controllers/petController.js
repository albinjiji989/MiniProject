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
    const identifier = req.params.id;

    console.log('🔍 getPublicPetDetails - Looking for pet:', identifier);
    console.log('🔍 User info:', req.user ? { id: req.user.id, email: req.user.email } : 'No user');

    // Try to find by petCode first, then by _id as fallback
    let pet = await AdoptionPet.findOne({ petCode: identifier, isActive: true })
      .populate('images')
      .populate('documents')
      .select('-createdBy -updatedBy');

    // If not found by petCode, try by MongoDB _id
    if (!pet) {
      console.log('🔍 Not found by petCode, trying by _id');
      pet = await AdoptionPet.findById(identifier)
        .populate('images')
        .populate('documents')
        .select('-createdBy -updatedBy');
    }

    if (!pet || !pet.isActive) {
      console.log('❌ Pet not found or not active');
      return res.status(404).json({
        success: false,
        error: `Pet with ID ${identifier} not found. The pet may have been removed by the adoption manager, or the link you're using may be outdated. Please go back to the pet listings and select a currently available pet.`
      });
    }

    console.log('✅ Pet found:', {
      petCode: pet.petCode,
      name: pet.name,
      status: pet.status,
      adopterUserId: pet.adopterUserId
    });

    // If pet is adopted, only show to the adopter (if authenticated) or hide adopter info for public
    if (pet.status === 'adopted') {
      console.log('🔒 Pet is adopted, checking access');
      // If user is authenticated and is the adopter, show full details
      if (req.user && pet.adopterUserId) {
        const userIdStr = req.user.id.toString();
        const adopterIdStr = pet.adopterUserId.toString();
        console.log('🔑 Comparing IDs:', { userId: userIdStr, adopterId: adopterIdStr, match: userIdStr === adopterIdStr });

        if (userIdStr === adopterIdStr) {
          console.log('✅ User is the adopter, showing details');
          return res.json({ success: true, data: pet });
        }
      }
      // Otherwise, pet is not available for public viewing
      console.log('❌ User is not the adopter or not authenticated');
      return res.status(404).json({
        success: false,
        error: `This pet has already been adopted and is no longer available.`
      });
    }

    console.log('✅ Pet is available, showing details');
    // For available pets, hide adopter info
    const petData = pet.toObject();
    delete petData.adopterUserId;

    res.json({ success: true, data: petData });
  } catch (error) {
    console.error('❌ Error in getPublicPetDetails:', error);
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