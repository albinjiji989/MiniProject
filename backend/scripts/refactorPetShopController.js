/**
 * Script to refactor the large petShopController.js file
 * This script identifies functions and suggests which specialized controller they should go to
 */

const fs = require('fs');
const path = require('path');

// Function to extract function names from the large controller file
function extractFunctionNames(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const functionPattern = /const ([a-zA-Z0-9_]+) = async/g;
  const matches = [];
  let match;
  
  while ((match = functionPattern.exec(content)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

// Function to categorize functions by their purpose
function categorizeFunctions(functionNames) {
  const categories = {
    store: [],
    inventory: [],
    order: [],
    reservation: [],
    promotion: [],
    admin: [],
    user: [],
    dashboard: [],
    payment: [],
    pricing: [],
    public: [],
    other: []
  };
  
  functionNames.forEach(funcName => {
    // Categorize based on function name patterns
    if (funcName.includes('Store') || funcName.includes('store') || 
        funcName.includes('Shop') || funcName.includes('shop')) {
      categories.store.push(funcName);
    } else if (funcName.includes('Inventory') || funcName.includes('inventory') ||
               funcName.includes('Item') || funcName.includes('item')) {
      categories.inventory.push(funcName);
    } else if (funcName.includes('Order') || funcName.includes('order') ||
               funcName.includes('Purchase') || funcName.includes('purchase')) {
      categories.order.push(funcName);
    } else if (funcName.includes('Reservation') || funcName.includes('reservation') ||
               funcName.includes('Reserve') || funcName.includes('reserve')) {
      categories.reservation.push(funcName);
    } else if (funcName.includes('Promotion') || funcName.includes('promotion') ||
               funcName.includes('promo') || funcName.includes('Promo')) {
      categories.promotion.push(funcName);
    } else if (funcName.includes('Admin') || funcName.includes('admin')) {
      categories.admin.push(funcName);
    } else if (funcName.includes('User') || funcName.includes('user') ||
               funcName.includes('Profile') || funcName.includes('profile')) {
      categories.user.push(funcName);
    } else if (funcName.includes('Dashboard') || funcName.includes('dashboard') ||
               funcName.includes('Stats') || funcName.includes('stats')) {
      categories.dashboard.push(funcName);
    } else if (funcName.includes('Payment') || funcName.includes('payment') ||
               funcName.includes('Pay') || funcName.includes('pay')) {
      categories.payment.push(funcName);
    } else if (funcName.includes('Price') || funcName.includes('price') ||
               funcName.includes('Pricing') || funcName.includes('pricing')) {
      categories.pricing.push(funcName);
    } else if (funcName.includes('Public') || funcName.includes('public')) {
      categories.public.push(funcName);
    } else {
      categories.other.push(funcName);
    }
  });
  
  return categories;
}

// Function to generate a refactoring report
function generateRefactoringReport(categories) {
  console.log('=== PET SHOP CONTROLLER REFACTORING REPORT ===\n');
  
  Object.keys(categories).forEach(category => {
    if (categories[category].length > 0) {
      console.log(`${category.toUpperCase()} FUNCTIONS (${categories[category].length}):`);
      categories[category].forEach(func => {
        console.log(`  - ${func}`);
      });
      console.log('');
    }
  });
  
  // Generate summary
  const totalFunctions = Object.values(categories).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`TOTAL FUNCTIONS TO REFACTOR: ${totalFunctions}`);
  
  // Suggest next steps
  console.log('\n=== REFACTORING STEPS ===');
  console.log('1. Start with the most critical functions (store, inventory, order)');
  console.log('2. Move functions to their respective specialized controllers');
  console.log('3. Update the index.js file to export from the correct controllers');
  console.log('4. Test each function after moving');
  console.log('5. Remove functions from the main controller as they are moved');
}

// Main execution
function main() {
  const controllerPath = path.join(__dirname, '..', 'modules', 'petshop', 'controllers', 'petShopController.js');
  
  if (!fs.existsSync(controllerPath)) {
    console.error('Main controller file not found:', controllerPath);
    return;
  }
  
  try {
    const functionNames = extractFunctionNames(controllerPath);
    const categories = categorizeFunctions(functionNames);
    generateRefactoringReport(categories);
  } catch (error) {
    console.error('Error during refactoring analysis:', error.message);
  }
}

// Run the script
main();

module.exports = {
  extractFunctionNames,
  categorizeFunctions,
  generateRefactoringReport
};