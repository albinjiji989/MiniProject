const axios = require('axios');

async function testPetApi() {
  try {
    const response = await axios.get('http://localhost:5000/api/pets/68fd3a70550bd93bc40666c8', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjhmY2ZmZGIxNzc1Mzc3ZGNmOTE5NWIwIiwicm9sZSI6InB1YmxpY191c2VyIiwiZW1haWwiOiJhbGJpbmphamlAZ21haWwuY29tIiwibmFtZSI6IkFsYmluIEppamkifSwiaWF0IjoxNzMwMzQ4MjY0LCJleHAiOjE3MzA0MzQ2NjR9.7Oa5F5G5G5G5G5G5G5G5G5G5G5G5G5G5G5G5G5G5G5G'
      }
    });
    
    console.log('Pet data:', JSON.stringify(response.data, null, 2));
    console.log('\nPet images:', response.data.data.pet.images);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPetApi();