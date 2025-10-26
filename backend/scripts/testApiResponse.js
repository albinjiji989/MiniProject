const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

async function testApiEndpoint() {
  try {
    console.log('🔍 Testing API endpoint for pet: 68fd3a70550bd93bc40666c8');
    
    // Import axios inside the function to avoid conflicts
    const axios = await import('axios');
    const response = await axios.default.get('http://localhost:5000/api/pets/68fd3a70550bd93bc40666c8');
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', {
      success: response.data.success,
      petName: response.data.data.pet.name,
      petCode: response.data.data.pet.petCode,
      images: response.data.data.pet.images,
      imagesLength: response.data.data.pet.images?.length || 0,
      imageIds: response.data.data.pet.imageIds,
      imageIdsLength: response.data.data.pet.imageIds?.length || 0
    });
    
    if (response.data.data.pet.images && response.data.data.pet.images.length > 0) {
      console.log('✅ Images found in API response!');
      console.log('First image URL:', response.data.data.pet.images[0].url);
    } else {
      console.log('❌ No images found in API response');
    }
    
  } catch (error) {
    console.error('API Test Error:', error.response?.data || error.message);
  }
}

testApiEndpoint();
