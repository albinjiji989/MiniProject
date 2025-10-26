const AdoptionPet = require('../models/AdoptionPet');
const AdoptionRequest = require('../models/AdoptionRequest');
const Image = require('../../../../core/models/Image');
const Document = require('../../../../core/models/Document');
const User = require('../../../../core/models/User');
const { sendMail } = require('../../../../core/utils/email');
const { sendSMS } = require('../../../../core/utils/sms');
const PetRegistryService = require('../../../../core/services/petRegistryService');
const csvParser = require('csv-parser');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Helper to parse CSV buffer
const parseCSVBuffer = (buffer) => new Promise((resolve, reject) => {
  try {
    const results = [];
    const stream = require('stream');
    const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  } catch (err) {
    reject(err);
  }
});

// Special-case parser for poorly formatted stringified arrays/objects: extract URLs
const extractUrls = (text) => {
  if (typeof text !== 'string') return []
  const urls = []
  const re = /(https?:\/\/[^\s'"\]\)]+)/g
  let m
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(text)) !== null) {
    if (m[1]) urls.push(m[1])
  }
  return urls
}

// Coerce incoming value into array. Supports:
// - already-array
// - JSON string of array
// - JSON string of object
// - plain string URL (or extract first URL)
const ensureArray = (val) => {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    const s = val.trim()
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return parsed
      if (parsed && typeof parsed === 'object') return [parsed]
    } catch (_) {
      const urls = extractUrls(s)
      if (urls.length) return urls
      if (s) return [s]
    }
  }
  if (val && typeof val === 'object') return [val]
  return []
}

// Manager Controllers
const getManagerPets = async (req, res) => {
  try {
    const rawPage = parseInt(req.query.page, 10)
    const rawLimit = parseInt(req.query.limit, 10)
    const page = Math.max(isNaN(rawPage) ? 1 : rawPage, 1)
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 10 : rawLimit, 1), 100)
    const { status, search, fields } = req.query;
    const query = { isActive: true };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { species: { $regex: search, $options: 'i' } },
        { petCode: { $regex: search, $options: 'i' } },
      ];
    }

    // Parse requested fields
    let requestedFields = [];
    let needsImages = true; // Always populate images by default
    let needsDocuments = false; // Only populate documents if explicitly requested
    
    if (fields && typeof fields === 'string') {
      requestedFields = fields.split(',').map(f => f.trim()).filter(Boolean);
      needsImages = requestedFields.includes('images') || requestedFields.length === 0; // Populate images if explicitly requested or if no fields specified
      needsDocuments = requestedFields.includes('documents');
      // Replace virtual field names with actual reference names
      requestedFields = requestedFields.map(f => {
        if (f === 'images') return 'imageIds';
        if (f === 'documents') return 'documentIds';
        return f;
      });
    }

    // Build select string - ensure _id is always included
    let selectString = '_id';
    if (requestedFields.length > 0) {
      selectString = ['_id', ...requestedFields].filter((f, i, arr) => arr.indexOf(f) === i).join(' ');
    } else {
      // Default fields if none specified - include imageIds to populate images
      selectString = '_id name breed species status ageDisplay petCode age ageUnit imageIds';
    }

    // Start query - note: we don't use lean() when we need virtuals
    let dbQuery = AdoptionPet.find(query);

    // Use virtual population for images and documents
    if (selectString.includes('imageIds') && needsImages) {
      dbQuery = dbQuery.populate({
        path: 'images',
        select: 'url caption isPrimary' // Updated to match Image model fields
      });
    }
    if (selectString.includes('documentIds') && needsDocuments) {
      dbQuery = dbQuery.populate({
        path: 'documents',
        select: 'url name type' // Updated to match Document model fields
      });
    }

    const pets = await dbQuery
      .select(selectString)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    // Convert to plain objects but keep virtuals
    const petsPlain = pets.map(doc => doc.toObject({ virtuals: true }));

    // Map populated images/documents for frontend
    const processedPets = petsPlain.map(pet => {
      const result = { _id: pet._id };
      
      // Copy all requested fields
      requestedFields.forEach(field => {
        if (field === 'imageIds' && needsImages) {
          // Ensure we're sending the correct image data structure
          result.images = Array.isArray(pet.images) ? pet.images.map(img => {
            // If img is already a populated image object, return it
            if (img && typeof img === 'object' && img.url) {
              return img;
            }
            // If img is a string URL, convert it to object format
            if (typeof img === 'string') {
              return { url: img };
            }
            // Fallback
            return img;
          }) : [];
        } else if (field === 'documentIds' && needsDocuments) {
          result.documents = Array.isArray(pet.documents) ? pet.documents : [];
        } else if (pet.hasOwnProperty(field)) {
          result[field] = pet[field];
        }
      });

      // Provide defaults for commonly used fields if not explicitly requested
      if (!Object.prototype.hasOwnProperty.call(result, 'name')) result.name = pet.name || 'Unknown';
      if (!Object.prototype.hasOwnProperty.call(result, 'breed')) result.breed = pet.breed || 'Unknown';
      if (!Object.prototype.hasOwnProperty.call(result, 'species')) result.species = pet.species || 'Unknown';
      if (!Object.prototype.hasOwnProperty.call(result, 'status')) result.status = pet.status || 'available';

      // Always include images if needed
      if (needsImages && !result.hasOwnProperty('images')) {
        result.images = Array.isArray(pet.images) ? pet.images.map(img => {
          // Ensure consistent image object structure
          if (img && typeof img === 'object' && img.url) {
            return img;
          }
          if (typeof img === 'string') {
            return { url: img };
          }
          return img;
        }) : [];
      }

      return result;
    });

    const total = await AdoptionPet.countDocuments(query);

    console.log('getManagerPets result:', { petsCount: processedPets.length, total, requestedFields, samplePet: processedPets[0] });

    res.json({
      success: true,
      data: {
        pets: processedPets,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error in getManagerPets:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch pets' });
  }
};

// Generate a unique adoption pet code (without creating a pet)
const getNewPetCode = async (req, res) => {
  try {
    const code = await AdoptionPet.generatePetCode();
    return res.json({ success: true, data: { code } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Helper: sanitize incoming images/documents so we never store base64 in DB
const sanitizeMedia = (input, isDocument = false) => {
  const arr = Array.isArray(input) ? input : []
  const out = []
  for (const item of arr) {
    const obj = typeof item === 'string' ? { url: item } : (item || {})
    const url = typeof obj.url === 'string' ? obj.url.trim() : ''
    // reject excessively long inline values and reject data URLs (base64)
    if (!url || url.length > 1024 || url.startsWith('data:')) continue
    // only allow absolute URLs and our /modules/* or /uploads/* paths
    if (/^https?:\/\//i.test(url) || url.startsWith('/modules/') || url.startsWith('/uploads/')) {
      if (isDocument) {
        // For documents, include required fields
        out.push({ 
          url, 
          name: obj.name || url.split('/').pop() || 'document',
          type: obj.type || 'application/pdf',
          uploadedAt: obj.uploadedAt || new Date()
        })
      } else {
        // For images
        out.push({ url, caption: obj.caption || '', isPrimary: !!obj.isPrimary })
      }
    }
  }
  return out
}

const createPet = async (req, res) => {
  try {
    const petData = { ...req.body, createdBy: req.user.id };
    
    // Debug logging
    console.log('Raw documents received:', typeof req.body?.documents, req.body?.documents);
    
    // Process images and documents - we'll handle them separately now
    let images = sanitizeMedia(ensureArray(req.body?.images), false)
    let documents = sanitizeMedia(ensureArray(req.body?.documents), true)
    
    // Remove images/documents from petData as they're now stored separately
    delete petData.images;
    delete petData.documents;
    
    console.log('Processed documents:', documents);
    
    // Handle images using our new standardized image upload system
    let imageIds = [];
    if (images && images.length > 0) {
      try {
        const { processEntityImages } = require('../../../../core/utils/imageUploadHandler');
        
        console.log('🖼️  Processing', images.length, 'images for adoption pet creation using standardized system');
        
        // Process images using our new utility
        const savedImages = await processEntityImages(
          images, 
          'AdoptionPet', 
          null, // Will be set after pet is created
          req.user.id, 
          'adoption', 
          'manager'
        );
        
        imageIds = savedImages.map(img => img._id);
      } catch (imgErr) {
        console.error('❌ Failed to save adoption pet images:', imgErr);
      }
    }
    
    // Handle documents using our new standardized system
    let documentIds = [];
    if (documents && documents.length > 0) {
      try {
        console.log('📄  Processing', documents.length, 'documents for adoption pet creation');
        
        // Process documents using our new utility
        const { processEntityDocuments } = require('../../../../core/utils/imageUploadHandler');
        
        const savedDocuments = await processEntityDocuments(
          documents,
          'AdoptionPet',
          null, // Will be set after pet is created
          req.user.id,
          'adoption',
          'manager'
        );
        
        documentIds = savedDocuments.map(doc => doc._id);
        console.log('✅ Processed', documentIds.length, 'documents for adoption pet creation');
      } catch (docErr) {
        console.error('❌ Failed to save adoption pet documents:', docErr);
      }
    }
    
    const pet = new AdoptionPet(petData);
    await pet.save();
    
    // Update image documents with the correct entityId
    if (imageIds.length > 0) {
      const Image = require('../../../../core/models/Image');
      await Image.updateMany(
        { _id: { $in: imageIds } },
        { entityId: pet._id }
      );
      
      // Add image references to the pet
      pet.imageIds = imageIds;
      await pet.save();
    }
    
    // Update document records with the correct entityId
    if (documentIds.length > 0) {
      const Document = require('../../../../core/models/Document');
      await Document.updateMany(
        { _id: { $in: documentIds } },
        { entityId: pet._id }
      );
      
      // Add document references to the pet
      pet.documentIds = documentIds;
      await pet.save();
    }
    
    // Respond immediately to avoid blocking UI on downstream integrations
    res.status(201).json({
      success: true,
      data: pet,
      message: 'Pet added successfully'
    });

    // Fire-and-forget: Upsert centralized registry entry without blocking the response
    // Capture minimal data needed to avoid accessing mutated req/pet later
    const _petSnapshot = {
      id: pet._id,
      petCode: pet.petCode,
      name: pet.name,
      images: pet.images || [],
      speciesName: pet.species,
      breedName: pet.breed,
    }
    const _actorUserId = req.user.id

    setImmediate(async () => {
      try {
        // Use relative path for the service
        const PetRegistryService = require('../../../../core/services/petRegistryService');
        const Species = require('../../../../core/models/Species');
        const Breed = require('../../../../core/models/Breed');

        // AdoptionPet uses string names for species/breed, registry needs ObjectIds.
        const speciesDoc = await Species.findOne({ name: { $regex: new RegExp(`^${_petSnapshot.speciesName}$`, 'i') } });
        const breedDoc = await Breed.findOne({ name: { $regex: new RegExp(`^${_petSnapshot.breedName}$`, 'i') } });

        await PetRegistryService.upsertAndSetState({
          petCode: _petSnapshot.petCode,
          name: _petSnapshot.name,
          species: speciesDoc ? speciesDoc._id : undefined,
          breed: breedDoc ? breedDoc._id : undefined,
          images: _petSnapshot.images,
          source: 'adoption',
          adoptionPetId: _petSnapshot.id,
          actorUserId: _actorUserId,
        }, {
          currentLocation: 'at_adoption_center',
          currentStatus: 'available',
        });
      } catch (regErr) {
        console.warn('PetRegistry upsert failed (create adoption pet):', regErr?.message || regErr);
      }
    });
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPetById = async (req, res) => {
  try {
    const { fields, lean } = req.query
    let selectFields = undefined
    if (fields && typeof fields === 'string') {
      selectFields = fields.split(',').map(f => f.trim()).filter(Boolean).join(' ')
      if (selectFields && !selectFields.includes('_id')) selectFields = `_id ${selectFields}`
    }
    
    // Build the base query with populate chains
    let query = AdoptionPet.findById(req.params.id)
    
    // Populate virtuals: images and documents
    query = query
      .populate({
        path: 'images',
        select: 'url caption isPrimary' // Updated to match Image model fields
      })
      .populate({
        path: 'documents',
        select: 'url name type' // Updated to match Document model fields
      })
      .populate('adopterUserId', 'name email phone')
      .populate('createdBy', 'name email')
    
    if (selectFields) query = query.select(selectFields)
    if (String(lean).toLowerCase() === 'true') query = query.lean()

    // Execute the full query with all populated references
    const pet = await query

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    res.json({ success: true, data: pet });
  } catch (error) {
    console.error('Error in getPetById:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Media-only endpoint
const getPetMedia = async (req, res) => {
  try {
    const pet = await AdoptionPet.findById(req.params.id)
      .populate({
        path: 'images',
        select: 'url caption isPrimary' // Updated to match Image model fields
      })
      .populate({
        path: 'documents',
        select: 'url name type' // Updated to match Document model fields
      });
    
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }
    
    res.json({
      success: true,
      data: {
        images: pet.images || [],
        documents: pet.documents || []
      }
    });
  } catch (error) {
    console.error('Error in getPetMedia:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

const updatePet = async (req, res) => {
  try {
    // Separate media from other updates
    const update = { ...req.body, updatedBy: req.user.id }
    
    // Check for both image/document objects AND imageIds/documentIds arrays
    const hasImages = Object.prototype.hasOwnProperty.call(req.body, 'images');
    const hasImageIds = Object.prototype.hasOwnProperty.call(req.body, 'imageIds');
    const hasDocuments = Object.prototype.hasOwnProperty.call(req.body, 'documents');
    const hasDocumentIds = Object.prototype.hasOwnProperty.call(req.body, 'documentIds');
    
    // Handle imageIds/documentIds directly (faster path - just store the IDs)
    let imageIds = null;
    let documentIds = null;
    
    if (hasImageIds) {
      imageIds = ensureArray(req.body.imageIds).filter(id => typeof id === 'string' && id.length > 0);
      delete update.imageIds; // Remove from generic update
    }
    
    if (hasDocumentIds) {
      documentIds = ensureArray(req.body.documentIds).filter(id => typeof id === 'string' && id.length > 0);
      delete update.documentIds; // Remove from generic update
    }
    
    // Keep legacy support for images/documents objects
    let images = hasImages ? ensureArray(req.body.images) : null;
    let documents = hasDocuments ? ensureArray(req.body.documents) : null;
    
    // Remove media arrays from update (they're handled separately)
    delete update.images;
    delete update.documents;
    
    // Update pet basic info
    const pet = await AdoptionPet.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    // Handle imageIds if provided directly (new, simpler path)
    if (hasImageIds && imageIds) {
      pet.imageIds = imageIds;
    }
    // Handle images objects if provided (legacy path)
    else if (hasImages && images) {
      const Image = require('../../../../core/models/Image');
      // Get existing images that we need to keep
      const existingImageIds = pet.imageIds || [];
      const existingImages = await Image.find({ _id: { $in: existingImageIds } });
      
      // Separate existing from new images based on URL presence in request
      const requestedUrls = images.map(img => {
        const url = typeof img === 'string' ? img : img?.url;
        return url;
      }).filter(Boolean);
      
      // Remove images whose URLs are not in the request (user deleted them)
      const imagesToDelete = existingImages.filter(img => !requestedUrls.includes(img.url));
      const imageIdsToDelete = imagesToDelete.map(img => img._id);
      
      if (imageIdsToDelete.length > 0) {
        await Image.deleteMany({ _id: { $in: imageIdsToDelete } });
      }
      
      // Add new images and get all final image IDs
      const finalImageIds = [];
      
      // Keep existing images that are still in the request
      for (const existingImg of existingImages) {
        if (requestedUrls.includes(existingImg.url)) {
          finalImageIds.push(existingImg._id);
        }
      }
      
      // Add new images from the request
      for (const img of images) {
        const url = typeof img === 'string' ? img : img?.url;
        if (!url || !(url.startsWith('/modules/') || url.startsWith('/uploads/'))) continue; // Only accept server paths
        
        // Check if this image already exists
        const existing = await Image.findOne({ url, entityType: 'AdoptionPet', entityId: pet._id });
        if (existing) continue;
        
        // Create new image record
        const image = new Image({
          url,
          caption: typeof img === 'object' ? img.caption || '' : '',
          isPrimary: typeof img === 'object' ? img.isPrimary || false : false,
          entityType: 'AdoptionPet',
          entityId: pet._id,
          uploadedBy: req.user.id
        });
        const saved = await image.save();
        finalImageIds.push(saved._id);
      }
      
      pet.imageIds = finalImageIds;
    }
    
    // Handle documentIds if provided directly (new, simpler path)
    if (hasDocumentIds && documentIds) {
      pet.documentIds = documentIds;
      // Update the Document records to set their entityId
      const Document = require('../../../../core/models/Document');
      await Document.updateMany(
        { _id: { $in: documentIds } },
        { entityId: pet._id }
      );
    }
    // Handle documents objects if provided (legacy path)
    else if (hasDocuments && documents) {
      const Document = require('../../../../core/models/Document');
      // Get existing documents that we need to keep
      const existingDocIds = pet.documentIds || [];
      const existingDocs = await Document.find({ _id: { $in: existingDocIds } });
      
      // Separate existing from new documents based on URL presence in request
      const requestedUrls = documents.map(doc => {
        const url = typeof doc === 'string' ? doc : doc?.url;
        return url;
      }).filter(Boolean);
      
      // Remove documents whose URLs are not in the request (user deleted them)
      const docsToDelete = existingDocs.filter(doc => !requestedUrls.includes(doc.url));
      const docIdsToDelete = docsToDelete.map(doc => doc._id);
      
      if (docIdsToDelete.length > 0) {
        await Document.deleteMany({ _id: { $in: docIdsToDelete } });
      }
      
      // Add new documents and get all final document IDs
      const finalDocIds = [];
      
      // Keep existing documents that are still in the request
      for (const existingDoc of existingDocs) {
        if (requestedUrls.includes(existingDoc.url)) {
          finalDocIds.push(existingDoc._id);
        }
      }
      
      // Add new documents from the request
      for (const doc of documents) {
        const url = typeof doc === 'string' ? doc : doc?.url;
        if (!url || !(url.startsWith('/modules/') || url.startsWith('/uploads/'))) continue; // Only accept server paths
        
        // Check if this document already exists
        const existing = await Document.findOne({ url, entityType: 'AdoptionPet', entityId: pet._id });
        if (existing) continue;
        
        // Create new document record
        const document = new Document({
          url,
          name: typeof doc === 'object' ? doc.name || url.split('/').pop() || 'document' : url.split('/').pop() || 'document',
          type: typeof doc === 'object' ? doc.type || 'application/pdf' : 'application/pdf',
          entityType: 'AdoptionPet',
          entityId: pet._id,
          uploadedBy: req.user.id,
          uploadedAt: typeof doc === 'object' ? doc.uploadedAt || new Date() : new Date()
        });
        const saved = await document.save();
        finalDocIds.push(saved._id);
      }
      
      pet.documentIds = finalDocIds;
    }
    
    // Save pet with updated media references
    if (hasImages || hasImageIds || hasDocuments || hasDocumentIds) {
      await pet.save();
    }

    // Return pet with populated media for response
    const fullPet = await AdoptionPet.findById(pet._id)
      .populate({
        path: 'images',
        select: 'url caption isPrimary' // Updated to match Image model fields
      })
      .populate({
        path: 'documents',
        select: 'url name type' // Updated to match Document model fields
      });

    res.json({
      success: true,
      data: fullPet,
      message: 'Pet updated successfully'
    });
  } catch (error) {
    console.error('Error in updatePet:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

const deletePet = async (req, res) => {
  try {
    const { Types } = require('mongoose')
    const id = req.params.id
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid pet id' })
    }
    
    // Find the pet first to get its media references
    const pet = await AdoptionPet.findById(id);
    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    // Delete associated images and documents from filesystem and database
    await deletePetMedia(pet);

    // Completely remove the pet from the database
    await AdoptionPet.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// New function for soft delete (keeping for backward compatibility)
const softDeletePet = async (req, res) => {
  try {
    const { Types } = require('mongoose')
    const id = req.params.id
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid pet id' })
    }
    const pet = await AdoptionPet.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to delete pet media files
const deletePetMedia = async (pet) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Delete images
    if (pet.imageIds && pet.imageIds.length > 0) {
      const Image = require('../../../../core/models/Image');
      const images = await Image.find({ _id: { $in: pet.imageIds } });
      
      for (const image of images) {
        // Delete file from filesystem if it exists
        if (image.url) {
          // Convert URL to file path
          const filePath = path.join(__dirname, '..', '..', '..', '..', image.url);
          try {
            await fs.unlink(filePath);
            console.log(`Deleted image file: ${filePath}`);
          } catch (err) {
            console.warn(`Failed to delete image file: ${filePath}`, err.message);
          }
        }
      }
      
      // Delete image records from database
      await Image.deleteMany({ _id: { $in: pet.imageIds } });
    }
    
    // Delete documents
    if (pet.documentIds && pet.documentIds.length > 0) {
      const Document = require('../../../../core/models/Document');
      const documents = await Document.find({ _id: { $in: pet.documentIds } });
      
      for (const document of documents) {
        // Delete file from filesystem if it exists
        if (document.url) {
          // Convert URL to file path
          const filePath = path.join(__dirname, '..', '..', '..', '..', document.url);
          try {
            await fs.unlink(filePath);
            console.log(`Deleted document file: ${filePath}`);
          } catch (err) {
            console.warn(`Failed to delete document file: ${filePath}`, err.message);
          }
        }
      }
      
      // Delete document records from database
      await Document.deleteMany({ _id: { $in: pet.documentIds } });
    }
  } catch (error) {
    console.error('Error deleting pet media:', error);
    // Don't throw error as we want to continue with pet deletion even if media deletion fails
  }
};

// Bulk delete (hard delete) pets by ids
const bulkDeletePets = async (req, res) => {
  try {
    const { ids } = req.body || {}
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids must be a non-empty array' })
    }
    const { Types } = require('mongoose')
    const validIds = ids.filter(id => Types.ObjectId.isValid(id))
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid ids provided' })
    }
    
    // Find all pets to delete
    const pets = await AdoptionPet.find({ _id: { $in: validIds } });
    
    // Delete media for each pet
    for (const pet of pets) {
      await deletePetMedia(pet);
    }
    
    // Delete pets from database
    const result = await AdoptionPet.deleteMany({ _id: { $in: validIds } });
    
    return res.json({ 
      success: true, 
      data: { 
        requested: ids.length, 
        valid: validIds.length, 
        deleted: result.deletedCount || 0 
      } 
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

// CSV import endpoint: expects multipart/form-data with field name 'file'
const importPetsCSV = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'CSV file is required (field name: file)' });
    }
    const rows = await parseCSVBuffer(req.file.buffer);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'CSV appears empty' });
    }

    // Map CSV columns to model fields; support common header variants and handle BOM
    const normalize = (row, key) => {
      const candidates = [key, key.toLowerCase(), key.replace(/([A-Z])/g, '_$1').toLowerCase()];
      const found = Object.keys(row).find(k => {
        // Remove BOM (\uFEFF) and other invisible characters, then normalize
        const cleanKey = String(k).replace(/^\uFEFF/, '').replace(/^\ufeff/, '').trim().toLowerCase();
        return candidates.includes(cleanKey);
      });
      const value = found ? row[found] : undefined;
      return value ? String(value).trim() : undefined;
    };

    // Clean the row keys to remove BOM from the actual data
    const cleanedRows = rows.map(row => {
      const cleanedRow = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key.replace(/^\uFEFF/, '').replace(/^\ufeff/, '').trim();
        cleanedRow[cleanKey] = row[key];
      });
      return cleanedRow;
    });

    // Debug: Add header information to help troubleshoot
    let debugInfo = '';
    if (cleanedRows.length > 0) {
      const originalHeaders = Object.keys(rows[0]);
      const cleanedHeaders = Object.keys(cleanedRows[0]);
      debugInfo = `Original headers: [${originalHeaders.map(h => `"${h}"`).join(', ')}] | Cleaned headers: [${cleanedHeaders.join(', ')}]`;
      console.log('CSV Debug:', debugInfo);
    }

    const results = {
      totalRows: cleanedRows.length,
      successful: [],
      failed: [],
      warnings: []
    };

    // Process each row individually with detailed error handling
    for (let i = 0; i < cleanedRows.length; i++) {
      const row = cleanedRows[i];
      const rowNumber = i + 2; // +2 because CSV row 1 is headers, and we're 0-indexed
      
      try {
        // Extract and validate required fields
        const name = normalize(row, 'name');
        const breed = normalize(row, 'breed');
        const species = normalize(row, 'species') || normalize(row, 'type');
        
        // Check for required fields
        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!breed) missingFields.push('breed');
        if (!species) missingFields.push('species');
        
        if (missingFields.length > 0) {
          results.failed.push({
            row: rowNumber,
            data: row,
            reason: `Missing required fields: ${missingFields.join(', ')}`,
            error: 'MISSING_REQUIRED_FIELDS'
          });
          continue;
        }

        // Process optional fields with smart defaults and validation
        const processedData = {
          name,
          breed,
          species,
          createdBy: req.user.id,
          images: [],
          status: 'available'
        };

        // Age handling
        const ageValue = normalize(row, 'age');
        if (ageValue) {
          const ageNum = Number(ageValue);
          if (!isNaN(ageNum) && ageNum >= 0) {
            processedData.age = ageNum;
          } else {
            results.warnings.push({
              row: rowNumber,
              field: 'age',
              value: ageValue,
              message: 'Invalid age value, defaulting to 0'
            });
            processedData.age = 0;
          }
        } else {
          processedData.age = 0;
        }

        // Age unit handling
        const ageUnitValue = normalize(row, 'ageUnit');
        if (ageUnitValue) {
          const ageUnitLower = ageUnitValue.toLowerCase();
          if (['months', 'years'].includes(ageUnitLower)) {
            processedData.ageUnit = ageUnitLower;
          } else {
            results.warnings.push({
              row: rowNumber,
              field: 'ageUnit',
              value: ageUnitValue,
              message: 'Invalid age unit, defaulting to months'
            });
            processedData.ageUnit = 'months';
          }
        } else {
          processedData.ageUnit = 'months';
        }

        // Gender handling
        const genderValue = normalize(row, 'gender');
        if (genderValue) {
          const genderLower = genderValue.toLowerCase();
          if (['male', 'female'].includes(genderLower)) {
            processedData.gender = genderLower;
          } else {
            results.warnings.push({
              row: rowNumber,
              field: 'gender',
              value: genderValue,
              message: 'Invalid gender, defaulting to male'
            });
            processedData.gender = 'male';
          }
        } else {
          processedData.gender = 'male';
        }

        // Color handling
        processedData.color = normalize(row, 'color') || 'unknown';

        // Weight handling
        const weightValue = normalize(row, 'weight');
        if (weightValue) {
          const weightNum = Number(weightValue);
          if (!isNaN(weightNum) && weightNum >= 0) {
            processedData.weight = weightNum;
          } else {
            results.warnings.push({
              row: rowNumber,
              field: 'weight',
              value: weightValue,
              message: 'Invalid weight value, defaulting to 0'
            });
            processedData.weight = 0;
          }
        } else {
          processedData.weight = 0;
        }

        // Health status handling
        const healthStatusValue = normalize(row, 'healthStatus');
        if (healthStatusValue) {
          const healthStatusLower = healthStatusValue.toLowerCase();
          if (['excellent', 'good', 'fair', 'needs_attention'].includes(healthStatusLower)) {
            processedData.healthStatus = healthStatusLower;
          } else {
            results.warnings.push({
              row: rowNumber,
              field: 'healthStatus',
              value: healthStatusValue,
              message: 'Invalid health status, defaulting to good'
            });
            processedData.healthStatus = 'good';
          }
        } else {
          processedData.healthStatus = 'good';
        }

        // Vaccination status handling
        const vaccinationStatusValue = normalize(row, 'vaccinationStatus');
        if (vaccinationStatusValue) {
          const vaccinationStatusLower = vaccinationStatusValue.toLowerCase();
          if (['up_to_date', 'partial', 'not_vaccinated'].includes(vaccinationStatusLower)) {
            processedData.vaccinationStatus = vaccinationStatusLower;
          } else {
            results.warnings.push({
              row: rowNumber,
              field: 'vaccinationStatus',
              value: vaccinationStatusValue,
              message: 'Invalid vaccination status, defaulting to not_vaccinated'
            });
            processedData.vaccinationStatus = 'not_vaccinated';
          }
        } else {
          processedData.vaccinationStatus = 'not_vaccinated';
        }

        // Temperament handling
        const temperamentValue = normalize(row, 'temperament');
        if (temperamentValue) {
          const temperamentLower = temperamentValue.toLowerCase();
          if (['calm', 'energetic', 'playful', 'shy', 'aggressive', 'friendly'].includes(temperamentLower)) {
            processedData.temperament = temperamentLower;
          } else {
            results.warnings.push({
              row: rowNumber,
              field: 'temperament',
              value: temperamentValue,
              message: 'Invalid temperament, defaulting to friendly'
            });
            processedData.temperament = 'friendly';
          }
        } else {
          processedData.temperament = 'friendly';
        }

        // Description handling
        processedData.description = normalize(row, 'description') || 'No description provided';

        // Adoption fee handling
        const adoptionFeeValue = normalize(row, 'adoptionFee');
        if (adoptionFeeValue) {
          const adoptionFeeNum = Number(adoptionFeeValue);
          if (!isNaN(adoptionFeeNum) && adoptionFeeNum >= 0) {
            processedData.adoptionFee = adoptionFeeNum;
          } else {
            results.warnings.push({
              row: rowNumber,
              field: 'adoptionFee',
              value: adoptionFeeValue,
              message: 'Invalid adoption fee, defaulting to 0'
            });
            processedData.adoptionFee = 0;
          }
        } else {
          processedData.adoptionFee = 0;
        }

        // Try to save the pet
        const pet = new AdoptionPet(processedData);
        const savedPet = await pet.save();
        
        results.successful.push({
          row: rowNumber,
          petId: savedPet._id,
          name: savedPet.name,
          breed: savedPet.breed,
          species: savedPet.species
        });

      } catch (error) {
        results.failed.push({
          row: rowNumber,
          data: row,
          reason: error.message,
          error: 'DATABASE_ERROR'
        });
      }
    }

    // Prepare response with detailed results
    const response = {
      success: true,
      message: `Import completed: ${results.successful.length} successful, ${results.failed.length} failed, ${results.warnings.length} warnings`,
      data: {
        totalRows: results.totalRows,
        successful: results.successful.length,
        failed: results.failed.length,
        warnings: results.warnings.length,
        debugInfo: debugInfo,
        detectedHeaders: cleanedRows.length > 0 ? Object.keys(cleanedRows[0]) : [],
        details: {
          successfulPets: results.successful,
          failedRows: results.failed,
          warnings: results.warnings
        }
      }
    };

    // Return appropriate status code
    if (results.successful.length === 0) {
      return res.status(400).json({
        ...response,
        success: false,
        message: 'No pets were successfully imported'
      });
    } else if (results.failed.length > 0) {
      return res.status(207).json(response); // 207 Multi-Status for partial success
    } else {
      return res.status(200).json(response);
    }

  } catch (error) {
    console.error('Import CSV error:', error);
    res.status(500).json({ success: false, error: 'Failed to import CSV: ' + error.message });
  }
}

// Upload pet photo
const uploadPetPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })
    const allowed = ['image/jpeg','image/png','image/webp','image/gif']
    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Only image files (JPG, PNG, WebP, GIF) are allowed' })
    }
    
    // Convert buffer to base64 for Cloudinary upload
    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Use the centralized image upload handler with Cloudinary
    const { processEntityImages } = require('../../../../core/utils/imageUploadHandler');
    
    // Process image using Cloudinary
    const savedImages = await processEntityImages(
      [{ url: base64Data, isPrimary: false, caption: '' }],
      'AdoptionPet',
      null, // entityId will be set later
      req.user.id,
      'adoption',
      'manager'
    );
    
    if (savedImages.length === 0) {
      return res.status(500).json({ success: false, error: 'Failed to upload image' });
    }
    
    const imageDoc = savedImages[0];
    
    // Return consistent data structure with the createPet function
    return res.status(201).json({ 
      success: true, 
      data: { 
        _id: imageDoc._id, 
        url: imageDoc.url,
        caption: imageDoc.caption,
        isPrimary: imageDoc.isPrimary
      } 
    })
  } catch (e) {
    console.error('Error uploading pet photo:', e)
    return res.status(500).json({ success: false, error: e.message })
  }
}

// Upload pet document
const uploadPetDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })
    const allowed = ['image/jpeg','image/png','image/jpg','image/webp','application/pdf']
    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Only images (JPG, PNG, WebP) or PDF files are allowed' })
    }
    
    // For documents, we'll need to handle both images and PDFs appropriately
    const Document = require('../../../../core/models/Document');
    const cloudinary = require('cloudinary').v2;
    
    let docRecord;
    
    // Generate a unique filename
    const crypto = require('crypto');
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const safeName = (req.file.originalname || 'document').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeName}-${timestamp}-${uniqueId}`;
    
    if (req.file.mimetype.startsWith('image/')) {
      // Handle image documents with Cloudinary
      // Convert buffer to base64 for Cloudinary upload
      const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(base64Data, {
        folder: 'adoption/manager/document',
        public_id: filename,
        overwrite: false,
        resource_type: 'image'
      });
      
      // Create document record that references the Cloudinary image
      docRecord = new Document({
        name: req.file.originalname || 'document',
        type: req.file.mimetype,
        url: result.secure_url,
        entityType: 'AdoptionPet',
        module: 'adoption',
        role: 'manager',
        uploadedBy: req.user.id
      });
    } else {
      // For PDF documents, we'll upload them to Cloudinary as raw files
      // Convert buffer to base64 for Cloudinary upload
      const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      // Upload PDF to Cloudinary
      const result = await cloudinary.uploader.upload(base64Data, {
        folder: 'adoption/manager/document',
        public_id: filename,
        overwrite: false,
        resource_type: 'raw', // For PDF and other non-image files
        format: 'pdf',
        invalidate: true
      });
      
      // Create document record that references the Cloudinary PDF
      docRecord = new Document({
        name: req.file.originalname || 'document',
        type: req.file.mimetype,
        url: result.secure_url,
        entityType: 'AdoptionPet',
        module: 'adoption',
        role: 'manager',
        uploadedBy: req.user.id
      });
    }
    
    await docRecord.save();
    
    // Return consistent data structure
    return res.status(201).json({ 
      success: true, 
      data: { 
        _id: docRecord._id, 
        url: docRecord.url,
        name: docRecord.name,
        type: docRecord.type
      } 
    })
  } catch (e) {
    console.error('Error uploading pet document:', e)
    return res.status(500).json({ success: false, error: e.message })
  }
}

module.exports = {
  getManagerPets,
  createPet,
  updatePet,
  deletePet,
  softDeletePet,
  getPetById,
  getPetMedia,
  importPetsCSV,
  bulkDeletePets,
  uploadPetPhoto,
  uploadPetDocument,
  getNewPetCode
};