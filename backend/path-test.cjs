const path = require('path');

// Test the path from inventoryManagementController.js to User.js
const controllerPath = path.resolve(__dirname, 'modules/petshop/manager/controllers/inventoryManagementController.js');
const userPath = path.resolve(__dirname, 'core/models/User.js');

console.log('Controller path:', controllerPath);
console.log('User path:', userPath);

// Calculate relative path
const relativePath = path.relative(path.dirname(controllerPath), userPath);
console.log('Relative path:', relativePath);

// Try to require the module
try {
  const User = require('./core/models/User.js');
  console.log('Successfully imported User model');
} catch (error) {
  console.error('Failed to import User model:', error.message);
}