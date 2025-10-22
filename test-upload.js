const fs = require('fs');
const path = require('path');

// Create a test document
const testContent = "This is a test document for adoption application";
fs.writeFileSync('test-document.txt', testContent);

console.log('Test document created successfully');