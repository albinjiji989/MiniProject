const axios = require('axios');

// Test the veterinary pet APIs
async function testVeterinaryPets() {
  try {
    const baseURL = 'http://localhost:5000/api';
    
    console.log('Testing veterinary pet APIs...');
    
    // Test owned pets
    console.log('\\n1. Testing owned pets...');
    try {
      const ownedPets = await axios.get(`${baseURL}/pets/my-pets`);
      console.log('Owned pets response:', ownedPets.data);
    } catch (error) {
      console.error('Owned pets error:', error.response?.data || error.message);
    }
    
    // Test adopted pets
    console.log('\\n2. Testing adopted pets...');
    try {
      const adoptedPets = await axios.get(`${baseURL}/adoption/user/my-adopted-pets`);
      console.log('Adopted pets response:', adoptedPets.data);
    } catch (error) {
      console.error('Adopted pets error:', error.response?.data || error.message);
    }
    
    // Test purchased pets
    console.log('\\n3. Testing purchased pets...');
    try {
      const purchasedPets = await axios.get(`${baseURL}/petshop/user/my-purchased-pets`);
      console.log('Purchased pets response:', purchasedPets.data);
    } catch (error) {
      console.error('Purchased pets error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testVeterinaryPets();