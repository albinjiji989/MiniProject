const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const crypto = require('crypto');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Generate random filename
const generateRandomFilename = () => {
  return `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
};

// Storage for product images
const productImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    public_id: (req, file) => generateRandomFilename()
  }
});

// Storage for review images
const reviewImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/reviews',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
    public_id: (req, file) => generateRandomFilename()
  }
});

// Storage for category images
const categoryImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
    public_id: (req, file) => generateRandomFilename()
  }
});

// Multer upload instances
const uploadProductImages = multer({
  storage: productImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const uploadReviewImages = multer({
  storage: reviewImageStorage,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB
  }
});

const uploadCategoryImage = multer({
  storage: categoryImageStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

// Delete multiple images
const deleteImages = async (publicIds) => {
  try {
    await cloudinary.api.delete_resources(publicIds);
    return true;
  } catch (error) {
    console.error('Error deleting images from Cloudinary:', error);
    return false;
  }
};

module.exports = {
  cloudinary,
  uploadProductImages,
  uploadReviewImages,
  uploadCategoryImage,
  deleteImage,
  deleteImages,
  generateRandomFilename
};
