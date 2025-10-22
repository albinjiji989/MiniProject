const axios = require('axios');

async function test() {
  try {
    // Test the manager endpoint to see if it returns images
    const managerResponse = await axios.get('http://localhost:5000/api/adoption/manager/pets');
    console.log('Manager endpoint response:');
    console.log(JSON.stringify(managerResponse.data.data.pets[0], null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();