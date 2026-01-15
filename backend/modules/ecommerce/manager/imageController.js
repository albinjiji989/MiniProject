const { uploadProductImages, deleteImage, deleteImages } = require('../../../config/cloudinary');
const Product = require('../models/Product');

/**
 * Upload product images to Cloudinary
 */
exports.uploadProductImages = [
  uploadProductImages.array('images', 10), // Max 10 images
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No images uploaded'
        });
      }

      // Format uploaded images
      const images = req.files.map((file, index) => ({
        url: file.path, // Cloudinary URL
        publicId: file.filename, // Cloudinary public ID for deletion
        alt: req.body.alt || `Product image ${index + 1}`,
        isPrimary: index === 0, // First image is primary by default
        order: index
      }));

      res.json({
        success: true,
        message: 'Images uploaded successfully',
        data: images
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading images',
        error: error.message
      });
    }
  }
];

/**
 * Delete product image from Cloudinary
 */
exports.deleteProductImage = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const deleted = await deleteImage(publicId);

    if (deleted) {
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete image'
      });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
};

/**
 * Reorder product images
 */
exports.reorderProductImages = async (req, res) => {
  try {
    const { productId, imageOrder } = req.body; // imageOrder: [{ publicId, order, isPrimary }]

    const product = await Product.findOne({
      _id: productId,
      seller: req.user.id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update image order
    product.images = product.images.map(img => {
      const orderInfo = imageOrder.find(o => o.publicId === img.publicId);
      if (orderInfo) {
        return {
          ...img,
          order: orderInfo.order,
          isPrimary: orderInfo.isPrimary
        };
      }
      return img;
    });

    // Sort by order
    product.images.sort((a, b) => a.order - b.order);

    await product.save();

    res.json({
      success: true,
      message: 'Images reordered successfully',
      data: product.images
    });
  } catch (error) {
    console.error('Error reordering images:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering images',
      error: error.message
    });
  }
};
