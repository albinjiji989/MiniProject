/**
 * Simple Cloudinary test script
 */

require('dotenv').config({ path: './.env' });

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary configured with cloud name:', cloudinary.config().cloud_name);

// Test image data (small base64 encoded image)
const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function testCloudinaryUpload() {
  try {
    console.log('Testing Cloudinary upload...');
    
    // Extract base64 data and file extension
    const matches = testImageData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image format');
    }
    
    const base64Content = matches[2];
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/${matches[1]};base64,${base64Content}`,
      {
        folder: 'test',
        public_id: 'test-image-' + Date.now(),
        overwrite: false,
        resource_type: 'image'
      }
    );
    
    console.log('✅ Upload successful!');
    console.log('Image URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    
    // Clean up - delete the test image
    await cloudinary.uploader.destroy(result.public_id);
    console.log('✅ Test image cleaned up');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
}

testCloudinaryUpload();