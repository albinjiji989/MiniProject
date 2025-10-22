// Test script to verify the PATCH route for adoption applications
const axios = require('axios');

async function testApproval() {
  try {
    console.log('Testing approval of application 68f757576435bb64847e0810...');
    
    // First, let's check if we can get the application
    try {
      const getAppResponse = await axios.get('http://localhost:5000/api/adoption/manager/applications/68f757576435bb64847e0810');
      console.log('Current application status:', getAppResponse.data.data.status);
    } catch (error) {
      console.log('Error getting application:', error.response ? error.response.data : error.message);
      return;
    }
    
    // Now try to approve it
    const response = await axios.patch('http://localhost:5000/api/adoption/manager/applications/68f757576435bb64847e0810', {
      status: 'approved',
      notes: 'Approved via test script'
    });
    
    console.log('Approval response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testApproval();