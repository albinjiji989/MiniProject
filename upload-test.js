const fs = require('fs');
const path = require('path');

// Read the test document
const filePath = path.join(__dirname, 'test-document.txt');
const fileContent = fs.readFileSync(filePath);

// Display file information
console.log('File path:', filePath);
console.log('File size:', fileContent.length, 'bytes');
console.log('File content:', fileContent.toString());

console.log('\nTo test the upload functionality:');
console.log('1. Open http://localhost:5173/User/adoption/apply/documents in your browser');
console.log('2. Select the test-document.txt file for upload');
console.log('3. Check if the file is saved in D:\\Second\\MiniProject\\backend\\uploads\\adoption\\user\\document');
console.log('4. Verify that the path is correctly returned in the response');