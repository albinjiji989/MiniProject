// Test script to verify the PATCH route for adoption applications
const http = require('http');

// Create a simple request to test the route
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/adoption/manager/applications/68f75757',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Request completed');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(JSON.stringify({
  status: 'approved',
  notes: 'Approved via test script'
}));

req.end();

console.log('Testing PATCH route for adoption application approval...');