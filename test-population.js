const axios = require('axios');

async function test() {
  try {
    // Test the manager endpoint to see if it returns images
    const managerResponse = await axios.get('http://localhost:5000/api/adoption/manager/pets');
    console.log('Manager endpoint response:');
    console.log(JSON.stringify(managerResponse.data, null, 2));
    
    // Test the user public endpoint
    const userResponse = await axios.get('http://localhost:5000/api/adoption/user/public/pets');
    console.log('\nUser public endpoint response:');
    console.log(JSON.stringify(userResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();