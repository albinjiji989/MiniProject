const fs = require('fs');
const path = require('path');

// Debug script to test certificate generation path
console.log('=== Certificate Generation Debug ===\n');

// Test the path that the certificate controller is using
const dir = path.join(__dirname, 'backend', 'uploads', 'adoption', 'manager', 'certificate');
console.log('Certificate directory path:', dir);

// Check if directory exists
if (fs.existsSync(dir)) {
  console.log('✓ Certificate directory exists');
  
  // Check permissions
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    console.log('✓ Certificate directory is writable');
  } catch (err) {
    console.log('✗ Certificate directory is not writable:', err.message);
  }
  
  // List contents
  const files = fs.readdirSync(dir);
  console.log('Files in certificate directory:', files.length);
  files.forEach((file, index) => {
    if (index < 5) {  // Only show first 5 files
      console.log('  -', file);
    }
  });
  if (files.length > 5) {
    console.log('  ... and', files.length - 5, 'more files');
  }
} else {
  console.log('✗ Certificate directory does not exist');
  console.log('Attempting to create directory...');
  try {
    fs.mkdirSync(dir, { recursive: true });
    console.log('✓ Certificate directory created successfully');
  } catch (err) {
    console.log('✗ Failed to create certificate directory:', err.message);
  }
}

// Test incorrect path that might still be used
const incorrectDir = path.join(__dirname, 'backend', 'modules', 'adoption', 'uploads', 'adoption', 'manager', 'certificate');
console.log('\nIncorrect certificate directory path:', incorrectDir);

if (fs.existsSync(incorrectDir)) {
  console.log('⚠  Incorrect certificate directory exists');
  const files = fs.readdirSync(incorrectDir);
  console.log('Files in incorrect directory:', files.length);
} else {
  console.log('✓ Incorrect certificate directory does not exist');
}

console.log('\n=== Debug Complete ===');