const { spawn } = require('child_process');
const path = require('path');

console.log('Starting MongoDB...');

// Try to start MongoDB
const mongod = spawn('mongod', ['--dbpath', './data', '--port', '27017'], {
  stdio: 'inherit',
  shell: true
});

mongod.on('error', (err) => {
  console.error('MongoDB not found or failed to start:', err.message);
  console.log('\nTo install MongoDB:');
  console.log('1. Download from: https://www.mongodb.com/try/download/community');
  console.log('2. Install MongoDB Community Server');
  console.log('3. Add MongoDB to your PATH environment variable');
  console.log('4. Run this script again');
  console.log('\nAlternatively, you can start MongoDB manually:');
  console.log('mongod --dbpath ./data --port 27017');
});

mongod.on('close', (code) => {
  console.log(`MongoDB process exited with code ${code}`);
});

// Keep the script running
process.on('SIGINT', () => {
  console.log('\nShutting down MongoDB...');
  mongod.kill();
  process.exit(0);
});
