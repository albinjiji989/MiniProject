/**
 * Utility functions for handling images in the frontend
 */

/**
 * Convert a file to base64
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 encoded string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum file size in MB (default: 5)
 * @returns {Object} Validation result
 */
export const validateImageFile = (file, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // Check if file is provided
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.' };
  }
  
  // Check file size
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit.` };
  }
  
  return { valid: true };
};

/**
 * Process multiple image files
 * @param {FileList} files - List of files to process
 * @param {number} maxFiles - Maximum number of files allowed (default: 5)
 * @param {number} maxSizeMB - Maximum file size in MB (default: 5)
 * @returns {Promise<Object>} Processing result
 */
export const processImageFiles = async (files, maxFiles = 5, maxSizeMB = 5) => {
  // Check number of files
  if (files.length > maxFiles) {
    return { 
      success: false, 
      error: `You can upload maximum ${maxFiles} images.` 
    };
  }
  
  const processedImages = [];
  const errors = [];
  
  // Process each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Validate file
    const validation = validateImageFile(file, maxSizeMB);
    if (!validation.valid) {
      errors.push(`File ${file.name}: ${validation.error}`);
      continue;
    }
    
    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      processedImages.push({
        url: base64,
        name: file.name,
        type: file.type,
        size: file.size,
        isPrimary: i === 0 // First image is primary by default
      });
    } catch (error) {
      errors.push(`File ${file.name}: Failed to process image.`);
    }
  }
  
  if (errors.length > 0) {
    return { 
      success: false, 
      error: errors.join('\n'),
      images: processedImages
    };
  }
  
  return { 
    success: true, 
    images: processedImages 
  };
};

/**
 * Get image URL for display
 * @param {string|Object} image - Image path or image object
 * @returns {string} Image URL
 */
export const getImageUrl = (image) => {
  if (!image) return '/placeholder-pet.svg';
  
  // If it's already a full URL
  if (typeof image === 'string' && (image.startsWith('http') || image.startsWith('/'))) {
    return image;
  }
  
  // If it's an object with url property
  if (typeof image === 'object' && image.url) {
    return image.url;
  }
  
  return '/placeholder-pet.svg';
};

export default {
  fileToBase64,
  validateImageFile,
  processImageFiles,
  getImageUrl
};