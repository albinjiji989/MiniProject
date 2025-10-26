const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to database
const connectDB = require('../core/db');

// Mock request and response objects
const mockReq = {
  params: {
    id: '68fd3a70550bd93bc40666c8'
  },
  user: {
    _id: '68fcffdb1775377dcf9195b0',
    role: 'public_user'
  }
};

const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    this.data = data;
    console.log(`Response Status: ${this.statusCode}`);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    return this;
  }
};

async function testGetPetById() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Import the getPetById function
    const { getPetById } = require('../core/controllers/petController');

    // Call the function
    await getPetById(mockReq, mockRes);
    
    // Check if images are included in the response
    if (mockRes.data && mockRes.data.data && mockRes.data.data.pet) {
      const pet = mockRes.data.data.pet;
      console.log('\n=== Pet Data Analysis ===');
      console.log(`Pet Name: ${pet.name}`);
      console.log(`Pet Code: ${pet.petCode}`);
      console.log(`Images Count: ${pet.images?.length || 0}`);
      console.log(`ImageIds Count: ${pet.imageIds?.length || 0}`);
      
      if (pet.images && pet.images.length > 0) {
        console.log('Images:', pet.images);
      } else {
        console.log('❌ No images found in response');
      }
    }

    console.log('\n=== Test complete ===');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from database');
  }
}

// Run the test function
testGetPetById();