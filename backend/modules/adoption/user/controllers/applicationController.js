const AdoptionPet = require('../../manager/models/AdoptionPet');
const AdoptionRequest = require('../../manager/models/AdoptionRequest');
const User = require('../../../../core/models/User');
const paymentService = require('../../../../core/services/paymentService');
const { sendMail } = require('../../../../core/utils/email');
const { sendSMS } = require('../../../../core/utils/sms');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// User Controllers
const getAvailablePets = async (req, res) => {
  try {
    const { page = 1, limit = 12, breed, species, age, gender } = req.query;
    
    // First, find pets with pending or approved applications for other users
    // Also exclude pets that are already adopted or reserved
    const reservedPetIds = await AdoptionRequest.distinct('petId', {
      status: { $in: ['pending', 'approved', 'payment_pending', 'completed'] },
      isActive: true,
      userId: { $ne: req.user.id } // Exclude current user's applications
    });
    
    // Build query to exclude reserved pets and already adopted pets
    const query = { 
      status: 'available', 
      isActive: true,
      _id: { $nin: reservedPetIds }, // Exclude pets with active applications by other users
      adopterUserId: null // Ensure pet is not already adopted
    };

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
      .select('name breed species age ageUnit gender color weight healthStatus vaccinationStatus temperament description adoptionFee petCode')
      .populate('images')
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
    console.error('Error fetching available pets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPetDetails = async (req, res) => {
  try {
    // Validate that the ID parameter is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid pet ID format: ${req.params.id}. Pet ID must be a 24-character hexadecimal string.` 
      });
    }
    
    const pet = await AdoptionPet.findById(req.params.id)
      .populate('images')
      .populate('adopterUserId', 'name')
      .select('-createdBy -updatedBy');

    if (!pet || !pet.isActive) {
      return res.status(404).json({ 
        success: false, 
        error: `Pet with ID ${req.params.id} not found. The pet may have been adopted by another user, removed by the adoption manager, or the link you're using may be outdated. Please go back to the pet listings and select a currently available pet.` 
      });
    }

    // Check if pet is available for adoption
    if (pet.status !== 'available') {
      return res.status(400).json({ 
        success: false, 
        error: `Pet is not available for adoption. Current status: ${pet.status}. This pet may have already been reserved or adopted by someone else.` 
      });
    }
    
    // Check if pet has active applications by other users
    const activeApplications = await AdoptionRequest.countDocuments({
      petId: pet._id,
      status: { $in: ['pending', 'approved', 'payment_pending'] },
      isActive: true,
      userId: { $ne: req.user.id } // Exclude current user's applications
    });
    
    if (activeApplications > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Pet is not available for adoption. This pet currently has active applications from other users.` 
      });
    }

    res.json({ success: true, data: pet });
  } catch (error) {
    console.error('Error fetching pet details:', error);
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
      .select('name breed species age ageUnit gender color weight healthStatus vaccinationStatus temperament description adoptionFee')
      .populate('images')
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
    
    // More detailed validation for petId
    if (!petId) {
      return res.status(400).json({ success: false, error: 'Pet ID is required. Please start the adoption process from a pet details page.' });
    }

    if (typeof petId !== 'string' || petId.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid Pet ID format. Please start the adoption process from a pet details page.' });
    }

    const trimmedPetId = petId.trim();
    
    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(trimmedPetId)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid Pet ID format: "${trimmedPetId}". Pet ID must be a valid 24-character hexadecimal string.` 
      });
    }

    // Find adoption pet by its MongoDB _id
    const pet = await AdoptionPet.findById(trimmedPetId);
    
    // Enhanced debugging - log pet lookup results
    console.log('Adoption application - Pet lookup:', {
      requestedPetId: trimmedPetId,
      petFound: !!pet,
      petStatus: pet ? pet.status : 'N/A',
      petIsActive: pet ? pet.isActive : 'N/A',
      petName: pet ? pet.name : 'N/A'
    });
    
    if (!pet) {
      // Let's also check if there are any pets in the database to help with debugging
      const petCount = await AdoptionPet.countDocuments();
      const samplePets = await AdoptionPet.find().limit(5).select('_id name status isActive');
      
      console.log('Adoption application - Database info:', {
        totalPets: petCount,
        samplePets: samplePets.map(p => ({
          id: p._id,
          name: p.name,
          status: p.status,
          isActive: p.isActive
        }))
      });
      
      return res.status(400).json({ 
        success: false, 
        error: `Adoption pet with ID ${trimmedPetId} not found. This pet may have been adopted by someone else, removed by the adoption manager, or the link you're using may be outdated. Please go back to the pet listings and select a different pet.` 
      });
    }
    
    if (!pet.isActive) {
      return res.status(400).json({ 
        success: false, 
        error: 'This pet is no longer available for adoption. The listing may have been removed by the adoption manager.' 
      });
    }
    
    if (pet.status !== 'available') {
      return res.status(400).json({ 
        success: false, 
        error: `Pet is not available for adoption. Current status: ${pet.status}. This pet may have already been reserved or adopted by someone else.` 
      });
    }

    // Check if there are any existing pending applications for this pet by other users
    const existingPendingApplications = await AdoptionRequest.countDocuments({
      petId: pet._id,
      status: 'pending',
      isActive: true
    });

    if (existingPendingApplications > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'This pet already has pending adoption applications. Please check back later or select a different pet.' 
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
        error: 'You already have a pending application for this pet. Please check your applications.' 
      });
    }

    // Normalize documents from body (supports [string], [{url}], or full document objects)
    console.log('🔍 Document Debug - req.body.documents:', req.body?.documents);
    console.log('🔍 Document Debug - applicationData.documents:', applicationData?.documents);
    const rawDocs = Array.isArray(req.body?.documents) ? req.body.documents
                  : (Array.isArray(applicationData?.documents) ? applicationData.documents : [])
    console.log('🔍 Document Debug - rawDocs:', rawDocs);
    const documents = rawDocs
      .map(d => {
        if (typeof d === 'string') {
          // Simple URL string
          return { url: d, name: 'document', type: 'unknown', uploadedAt: new Date() };
        } else if (d && d.url) {
          // Object with at least URL
          // Handle date conversion properly
          let uploadedAt = new Date();
          if (d.uploadedAt) {
            // If it's already a Date object, use it directly
            if (d.uploadedAt instanceof Date) {
              uploadedAt = d.uploadedAt;
            } 
            // If it's a string (likely ISO string from frontend), parse it
            else if (typeof d.uploadedAt === 'string') {
              const parsedDate = new Date(d.uploadedAt);
              if (!isNaN(parsedDate.getTime())) {
                uploadedAt = parsedDate;
              }
            }
            // If it's a number (timestamp), convert it
            else if (typeof d.uploadedAt === 'number') {
              uploadedAt = new Date(d.uploadedAt);
            }
          }
          return {
            url: d.url,
            name: d.name || 'document',
            type: d.type || 'unknown',
            uploadedAt: uploadedAt
          };
        }
        return null;
      })
      .filter(d => d && d.url && typeof d.url === 'string' && d.url.trim())

    // Ensure documents is properly formatted before creating AdoptionRequest
    const cleanDocuments = Array.isArray(documents) ? documents.map(doc => ({
      url: doc.url,
      name: doc.name,
      type: doc.type,
      uploadedAt: doc.uploadedAt instanceof Date && !isNaN(doc.uploadedAt.getTime()) ? doc.uploadedAt : new Date(doc.uploadedAt || Date.now())
    })) : [];
    
    // Additional validation to ensure documents array structure
    if (Array.isArray(cleanDocuments)) {
      cleanDocuments.forEach((doc, index) => {
        // Validate each document
        if (!doc.url || typeof doc.url !== 'string') {
          console.warn(`Document ${index} has invalid URL:`, doc.url);
        }
        if (!(doc.uploadedAt instanceof Date) || isNaN(doc.uploadedAt.getTime())) {
          console.warn(`Document ${index} has invalid date:`, doc.uploadedAt);
        }
      });
    }
    
    // Final validation before creating AdoptionRequest
    const validatedDocuments = Array.isArray(cleanDocuments) ? cleanDocuments.map(doc => ({
      url: typeof doc.url === 'string' ? doc.url : '',
      name: typeof doc.name === 'string' ? doc.name : 'document',
      type: typeof doc.type === 'string' ? doc.type : 'unknown',
      uploadedAt: doc.uploadedAt instanceof Date && !isNaN(doc.uploadedAt.getTime()) ? doc.uploadedAt : 
                 (typeof doc.uploadedAt === 'string' ? new Date(doc.uploadedAt) : new Date())
    })).filter(doc => doc.url && doc.url.trim()) : [];
    
    // Validate the structure of validatedDocuments
    if (Array.isArray(validatedDocuments)) {
      validatedDocuments.forEach((doc, index) => {
        // Validate each document
        if (!doc.url || typeof doc.url !== 'string') {
          console.warn(`Validated document ${index} has invalid URL:`, doc.url);
        }
        if (!(doc.uploadedAt instanceof Date) || isNaN(doc.uploadedAt.getTime())) {
          console.warn(`Validated document ${index} has invalid date:`, doc.uploadedAt);
        }
      });
    }
    
    // Clone the documents array to ensure it's a proper array
    const clonedDocuments = JSON.parse(JSON.stringify(validatedDocuments));
    
    // Manually construct documents array to ensure proper format
    const finalDocuments = clonedDocuments.map(doc => ({
      url: String(doc.url || ''),
      name: String(doc.name || 'document'),
      type: String(doc.type || 'unknown'),
      uploadedAt: doc.uploadedAt instanceof Date && !isNaN(doc.uploadedAt.getTime()) ? doc.uploadedAt : 
                 (typeof doc.uploadedAt === 'string' ? new Date(doc.uploadedAt) : new Date(doc.uploadedAt || Date.now()))
    }));
    console.log('🔍 Document Debug - finalDocuments:', finalDocuments);
    // Validate the structure of finalDocuments
    if (Array.isArray(finalDocuments)) {
      finalDocuments.forEach((doc, index) => {
        // Validate each document
        if (!doc.url || typeof doc.url !== 'string') {
          console.warn(`Final document ${index} has invalid URL:`, doc.url);
        }
        if (!(doc.uploadedAt instanceof Date) || isNaN(doc.uploadedAt.getTime())) {
          console.warn(`Final document ${index} has invalid date:`, doc.uploadedAt);
        }
      });
    }
    
    // Additional validation to ensure documents array is properly formatted
    const validatedFinalDocuments = Array.isArray(finalDocuments) ? finalDocuments.map(doc => ({
      url: typeof doc.url === 'string' ? doc.url : '',
      name: typeof doc.name === 'string' ? doc.name : 'document',
      type: typeof doc.type === 'string' ? doc.type : 'unknown',
      uploadedAt: doc.uploadedAt instanceof Date && !isNaN(doc.uploadedAt.getTime()) ? doc.uploadedAt : 
                 (typeof doc.uploadedAt === 'string' && doc.uploadedAt.length > 0 ? new Date(doc.uploadedAt) : new Date())
    })).filter(doc => doc.url && doc.url.trim()) : [];
    
    // Validate the structure of validatedFinalDocuments
    if (Array.isArray(validatedFinalDocuments)) {
      validatedFinalDocuments.forEach((doc, index) => {
        // Validate each document
        if (!doc.url || typeof doc.url !== 'string') {
          console.warn(`Validated final document ${index} has invalid URL:`, doc.url);
        }
        if (!(doc.uploadedAt instanceof Date) || isNaN(doc.uploadedAt.getTime())) {
          console.warn(`Validated final document ${index} has invalid date:`, doc.uploadedAt);
        }
      });
    }
    
    // Validate that the AdoptionRequest schema is correctly defined
    if (!AdoptionRequest.schema.paths['documents']) {
      console.error('AdoptionRequest schema missing documents path');
      throw new Error('Schema validation error: documents path missing');
    }
    
    // Validate that all documents have the required fields
    if (Array.isArray(validatedFinalDocuments)) {
      for (const [index, doc] of validatedFinalDocuments.entries()) {
        if (!doc.url || !doc.name || !doc.type) {
          console.warn(`Document ${index} is missing required fields:`, doc);
        }
        if (!(doc.uploadedAt instanceof Date) || isNaN(doc.uploadedAt.getTime())) {
          console.warn(`Document ${index} has invalid date:`, doc.uploadedAt);
        }
      }
    }
    
    const application = new AdoptionRequest({
      userId: req.user.id,
      petId: pet._id,
      applicationData: applicationData,
      documents: validatedFinalDocuments
    });

    console.log('🔍 Document Debug - Application before save:', {
      documentsCount: validatedFinalDocuments.length,
      documents: validatedFinalDocuments
    });

    await application.save();

    console.log('🔍 Document Debug - Application after save:', {
      id: application._id,
      documentsCount: application.documents?.length,
      documents: application.documents
    });

    // Blockchain: Log application submission event
    try {
      const BlockchainService = require('../../../../core/services/blockchainService');
      await BlockchainService.addBlock({
        eventType: 'APPLICATION_SUBMITTED',
        petId: pet._id,
        userId: req.user.id,
        data: {
          applicationId: application._id,
          petName: pet.name,
          petCode: pet.petCode,
          breed: pet.breed,
          species: pet.species,
          applicantName: applicationData.fullName || 'Unknown',
          applicantEmail: applicationData.email || '',
        }
      });
    } catch (blockchainErr) {
      console.error('Blockchain logging failed for APPLICATION_SUBMITTED:', blockchainErr);
    }

    // Notify managers (best-effort)
    try {
      const managers = await User.find({ role: 'adoption_manager', isActive: true }).select('email');
      for (const manager of managers) {
        if (manager?.email) {
          await sendMail({to: manager.email, subject: 'New Adoption Application', html: `A new adoption application has been submitted for ${pet.name}. Please review it in the manager dashboard.`});
        }
      }
    } catch (_) {}

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Adoption application error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Upload applicant document (image/pdf)
const uploadDocument = async (req, res) => {
  try {
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { originalname, mimetype, buffer } = req.file;
    const { petId } = req.body;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(mimetype)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.' 
      });
    }

    // Map MIME types to document types
    const mimeTypeToDocType = {
      'application/pdf': 'application/pdf',
      'image/jpeg': 'image/jpeg',
      'image/png': 'image/png',
      'image/gif': 'image/png' // Using png type for gif as well
    };

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = mimetype.split('/')[1];
    const filename = `${timestamp}_${randomString}.${fileExtension}`;

    // Convert buffer to base64 for Cloudinary upload
    const base64Data = `data:${mimetype};base64,${buffer.toString('base64')}`;
    
    let resourceType = 'image';
    let format = undefined;
    
    // Set appropriate resource type and format for Cloudinary
    // For PDFs to be viewable in browsers, use 'image' resource type
    if (mimetype === 'application/pdf') {
      resourceType = 'image';
      format = 'pdf';
    } else if (mimetype.startsWith('image/')) {
      resourceType = 'image';
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: 'adoption/user/application',
      public_id: filename,
      overwrite: false,
      resource_type: resourceType,
      ...(format && { format: format })
    });

    // Create URL from Cloudinary result
    const fileUrl = result.secure_url;

    // Return success response with full document information
    const documentInfo = {
      url: fileUrl,
      name: originalname,
      type: mimeTypeToDocType[mimetype] || 'Other',
      uploadedAt: new Date()
    };
    
    res.json({
      success: true,
      data: documentInfo
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUserApplications = async (req, res) => {
  try {
    const applications = await AdoptionRequest.find({ 
      userId: req.user.id, 
      isActive: true 
    })
      .populate('petId')
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
      .populate('petId')
      .populate('reviewedBy', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUserApplicationPetDetails = async (req, res) => {
  try {
    // Pull `id` from params — route defines the param as `:id`
    const petId = req.params.id;

    // Debug: log incoming params for easier troubleshooting
    console.log('getUserApplicationPetDetails - petId:', petId, 'user:', req.user?.id);

    // Validate that the petId parameter is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(petId)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid pet ID format: ${petId}. Pet ID must be a 24-character hexadecimal string.` 
      });
    }
    
    // First, verify that the user has an active application for this pet
    const application = await AdoptionRequest.findOne({
      userId: req.user.id,
      petId: petId,
      isActive: true
    });
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        error: 'No active application found for this pet. You can only access pet details for pets you have applied to adopt.' 
      });
    }
    
    // Find the pet regardless of its status since user has an application for it
    const pet = await AdoptionPet.findById(petId)
      .populate('images')
      .populate('adopterUserId', 'name')
      .select('-createdBy -updatedBy');

    if (!pet || !pet.isActive) {
      return res.status(404).json({ 
        success: false, 
        error: `Pet with ID ${petId} not found or is no longer active.` 
      });
    }

    res.json({ success: true, data: pet });
  } catch (error) {
    console.error('Error fetching user application pet details:', error);
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

    // Make pet available again if it was reserved or approved
    const pet = await AdoptionPet.findById(application.petId);
    if (pet && pet.adopterUserId && pet.adopterUserId.toString() === req.user.id) {
      // Reset pet status based on current status
      if (pet.status === 'reserved' || pet.status === 'available') {
        pet.status = 'available';
        pet.adopterUserId = null;
      } else if (pet.status === 'adopted') {
        // If already adopted, we can't make it available again
        // But we should log this unusual situation
        console.warn(`Attempt to cancel application for already adopted pet: ${pet._id}`);
      }
      await pet.save();
      
      // Update the pet registry to reflect the status change
      try {
        const PetRegistry = require('../../../../core/models/PetRegistry');
        await PetRegistry.updateOne(
          { adoptionPetId: pet._id },
          { 
            $set: { 
              currentStatus: pet.status,
              currentOwnerId: pet.adopterUserId,
              lastSeenAt: new Date()
            }
          }
        );
      } catch (registryError) {
        console.warn('Failed to update pet registry:', registryError.message);
      }
    }

    res.json({
      success: true,
      message: 'Application cancelled successfully'
    });
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
  getUserApplicationPetDetails,
  cancelApplication,
  uploadDocument
};