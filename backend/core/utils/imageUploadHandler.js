const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
 * Upload base64 image to Cloudinary
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} folderPath - Cloudinary folder path
 * @param {string} filename - Filename for the image
 * @returns {Promise<string>} Cloudinary URL of the uploaded image
 */
const uploadBase64ImageToCloudinary = async (base64Data, folderPath, filename) => {
  try {
    // Extract base64 data and file extension
    const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image format');
    }
    
    const base64Content = matches[2];
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/${matches[1]};base64,${base64Content}`,
      {
        folder: folderPath,
        public_id: filename.replace(/\.[^/.]+$/, ""), // Remove extension for public_id
        overwrite: false,
        resource_type: 'image'
      }
    );
    
    return result.secure_url;
  } catch (error) {
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
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
          
          // Create Cloudinary folder path based on module and role
          const folderPath = `${module}/${role}`;
          
          // Upload image to Cloudinary
          const cloudinaryUrl = await uploadBase64ImageToCloudinary(imageData, folderPath, filename);
          
          // For petshop images, use a consistent module and role
          const imageModule = module === 'petshop/manager/pets' || (module === 'petshop' && role === 'manager') ? 'petshop' : module;
          const imageRole = module === 'petshop/manager/pets' || (module === 'petshop' && role === 'manager') ? 'manager' : role;
          
          const imageDoc = new Image({
            url: cloudinaryUrl,
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
          console.log('☁️  Saved image to Cloudinary:', { cloudinaryUrl, entityId, filename });
        } else if (imageData && typeof imageData === 'string' && (imageData.startsWith('http') || imageData.startsWith('/'))) {
          // Already a URL or file path, store as-is
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
        
        if (docData && typeof docData === 'string' && (docData.startsWith('http') || docData.startsWith('/'))) {
          // Already a URL or file path, store as-is
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
  processEntityImages,
  processEntityDocuments
};