const axios = require('axios');

async function test() {
  try {
    const response = await axios.get('http://localhost:5000/api/adoption/user/public/pets');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();