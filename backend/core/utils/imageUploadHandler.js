const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Generate a unique filename using crypto for better uniqueness
 * @param {string} originalName - Original filename
 * @param {string} entityId - ID of the entity (pet, user, etc.)
 * @returns {string} Unique filename
 */
const generateUniqueFilename = (originalName, entityId) => {
  // Get file extension
  const ext = path.extname(originalName).toLowerCase();
  
  // Generate unique identifier
  const uniqueId = crypto.randomBytes(16).toString('hex');
  
  // Get timestamp
  const timestamp = Date.now();
  
  // Create filename: entity-type-entityId-timestamp-uniqueId.ext
  const nameWithoutExt = path.basename(originalName, ext);
  const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${safeName}-${entityId}-${timestamp}-${uniqueId}${ext}`;
};

/**
 * Save base64 image to file system
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} uploadPath - Full path where file should be saved
 * @returns {Promise<void>}
 */
const saveBase64Image = async (base64Data, uploadPath) => {
  try {
    // Extract base64 data and file extension
    const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image format');
    }
    
    const base64Content = matches[2];
    
    // Convert base64 to buffer and save to file
    const buffer = Buffer.from(base64Content, 'base64');
    await fs.writeFile(uploadPath, buffer);
  } catch (error) {
    throw new Error(`Failed to save image: ${error.message}`);
  }
};

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Path to directory
 * @returns {Promise<void>}
 */
const createDirectoryIfNotExists = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory: ${error.message}`);
  }
};

/**
 * Process and save images for an entity
 * @param {Array} images - Array of image objects or strings
 * @param {string} entityType - Type of entity (PetNew, AdoptionPet, etc.)
 * @param {string} entityId - ID of the entity
 * @param {string} userId - ID of the user uploading
 * @param {string} module - Module name (adoption, petshop, veterinary, etc.)
 * @param {string} role - User role (admin, manager, user)
 * @returns {Promise<Array>} Array of image documents to save to DB
 */
const processEntityImages = async (images, entityType, entityId, userId, module, role) => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return [];
  }
  
  const Image = require('../models/Image');
  const savedImages = [];
  
  try {
    // Create upload directory based on module and role
    // For petshop, save to uploads/petshop/manager/pets
    let uploadDir;
    if (module === 'petshop/manager/pets' || (module === 'petshop' && role === 'manager')) {
      uploadDir = path.join(__dirname, `../../uploads/petshop/manager/pets`);
    } else {
      // Split module path and join with role
      const moduleParts = module.split('/');
      uploadDir = path.join(__dirname, `../../uploads`, ...moduleParts, role);
    }
    await createDirectoryIfNotExists(uploadDir);
    
    for (let i = 0; i < images.length; i++) {
      try {
        const img = images[i];
        const imageData = img?.url || img; // Support both {url: ...} and direct string
        const isPrimary = img?.isPrimary || i === 0;
        const caption = img?.caption || '';
        
        // Check if it's a base64 string
        if (imageData && typeof imageData === 'string' && imageData.startsWith('data:image/')) {
          // Extract original filename if available
          let originalName = `image-${i}.jpg`; // Default name
          const dataMatch = imageData.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
          if (dataMatch && dataMatch[1]) {
            originalName = `image-${i}.${dataMatch[1]}`;
          }
          
          // Generate unique filename
          const filename = generateUniqueFilename(originalName, entityId || 'unknown');
          const filepath = path.join(uploadDir, filename);
          
          // Save image to file system
          await saveBase64Image(imageData, filepath);
          
          // Store relative path in database - make sure it matches the actual file location
          let relativePath;
          if (module === 'petshop/manager/pets' || (module === 'petshop' && role === 'manager')) {
            relativePath = `/uploads/petshop/manager/pets/${filename}`;
          } else {
            // For other modules, use the standard path
            const moduleParts = module.split('/');
            relativePath = `/uploads/${moduleParts.join('/')}/${role}/${filename}`;
          }
          
          // For petshop images, use a consistent module and role
          const imageModule = module === 'petshop/manager/pets' || (module === 'petshop' && role === 'manager') ? 'petshop' : module;
          const imageRole = module === 'petshop/manager/pets' || (module === 'petshop' && role === 'manager') ? 'manager' : role;
          
          const imageDoc = new Image({
            url: relativePath,
            caption: caption,
            entityType: entityType,
            entityId: entityId,
            isPrimary: isPrimary,
            module: imageModule,
            role: imageRole,
            uploadedBy: userId
          });
          
          const savedImage = await imageDoc.save();
          savedImages.push(savedImage);
          console.log('🖼️  Saved image:', { relativePath, entityId, filename });
        } else if (imageData && typeof imageData === 'string' && imageData.startsWith('/')) {
          // Already a file path, store as-is
          const imageDoc = new Image({
            url: imageData,
            caption: caption,
            entityType: entityType,
            entityId: entityId,
            isPrimary: isPrimary,
            module: module,
            role: role,
            uploadedBy: userId
          });
          
          const savedImage = await imageDoc.save();
          savedImages.push(savedImage);
        }
      } catch (imgProcessErr) {
        console.error(`Error processing image ${i}:`, imgProcessErr);
        // Continue with other images even if one fails
      }
    }
  } catch (error) {
    console.error('Error processing entity images:', error);
    throw error;
  }
  
  return savedImages;
};

/**
 * Process and save documents for an entity
 * @param {Array} documents - Array of document objects
 * @param {string} entityType - Type of entity (PetNew, AdoptionPet, etc.)
 * @param {string} entityId - ID of the entity
 * @param {string} userId - ID of the user uploading
 * @param {string} module - Module name (adoption, petshop, veterinary, etc.)
 * @param {string} role - User role (admin, manager, user)
 * @returns {Promise<Array>} Array of document records to save to DB
 */
const processEntityDocuments = async (documents, entityType, entityId, userId, module, role) => {
  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return [];
  }
  
  const Document = require('../models/Document');
  const savedDocuments = [];
  
  try {
    for (let i = 0; i < documents.length; i++) {
      try {
        const doc = documents[i];
        const docData = doc?.url || doc; // Support both {url: ...} and direct string
        const name = doc?.name || (typeof docData === 'string' ? docData.split('/').pop() : `document-${i}`) || `document-${i}`;
        const type = doc?.type || 'application/pdf';
        const uploadedAt = doc?.uploadedAt || new Date();
        
        if (docData && typeof docData === 'string' && docData.startsWith('/')) {
          // Already a file path, store as-is
          const docRecord = new Document({
            url: docData,
            name: name,
            type: type,
            entityType: entityType,
            entityId: entityId,
            module: module,
            role: role,
            uploadedBy: userId,
            uploadedAt: uploadedAt
          });
          
          const savedDoc = await docRecord.save();
          savedDocuments.push(savedDoc);
        }
      } catch (docProcessErr) {
        console.error(`Error processing document ${i}:`, docProcessErr);
        // Continue with other documents even if one fails
      }
    }
  } catch (error) {
    console.error('Error processing entity documents:', error);
    throw error;
  }
  
  return savedDocuments;
};

module.exports = {
  generateUniqueFilename,
  saveBase64Image,
  createDirectoryIfNotExists,
  processEntityImages,
  processEntityDocuments
};