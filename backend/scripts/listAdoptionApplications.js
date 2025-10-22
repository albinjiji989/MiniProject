const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Connect to database
const connectDB = require('../core/db');
connectDB();

// Import models
const AdoptionRequest = require('../modules/adoption/manager/models/AdoptionRequest');
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
const User = require('../core/models/User');

async function listApplications(options = {}) {
  const { 
    page = 1, 
    limit = 20, 
    status = '', 
    search = '', 
    sortBy = 'createdAt', 
    sortOrder = -1 
  } = options;
  
  try {
    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      // For search, we'll need to do this differently since we're joining collections
      // Let's simplify for now and just show all applications
    }
    
    // Get total count
    const total = await AdoptionRequest.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    // Get applications with pagination and populate references
    const applications = await AdoptionRequest.find(query)
      .populate('userId', 'name email')
      .populate('petId', 'name petCode')
      .populate('reviewedBy', 'name')
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip((page - 1) * limit);
    
    console.log(`\n=== ADOPTION APPLICATIONS LISTING ===`);
    console.log(`Page ${page} of ${totalPages} (Total: ${total} applications)`);
    console.log(`Filters - Status: ${status || 'All'}, Search: "${search}"`);
    console.log(`Sorting - By: ${sortBy}, Order: ${sortOrder === 1 ? 'ASC' : 'DESC'}\n`);
    
    if (applications.length === 0) {
      console.log('No applications found matching the criteria.');
      return;
    }
    
    // Display applications in a table format
    console.log('ID\t\t\t\tUser\t\t\tPet\t\t\tStatus\t\tCreated At');
    console.log('-'.repeat(120));
    
    for (const app of applications) {
      const userId = app.userId ? app.userId._id.toString().substring(0, 8) : '-';
      const userName = app.userId ? app.userId.name.substring(0, 15) : '-';
      const petName = app.petId ? app.petId.name.substring(0, 15) : '-';
      const petCode = app.petId ? app.petId.petCode || '-' : '-';
      const createdAt = app.createdAt.toISOString().split('T')[0];
      
      console.log(
        `${app._id.toString().substring(0, 8)}\t${userName}\t\t${petName} (${petCode})\t${app.status}\t\t${createdAt}`
      );
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Showing ${applications.length} applications on page ${page}`);
    
    // Show status breakdown
    const statusCounts = await AdoptionRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('\nStatus Breakdown:');
    statusCounts.forEach(status => {
      console.log(`  ${status._id}: ${status.count}`);
    });
    
  } catch (error) {
    console.error('Error listing applications:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key && value !== undefined) {
      switch (key) {
        case 'page':
          options.page = parseInt(value);
          break;
        case 'limit':
          options.limit = parseInt(value);
          break;
        case 'status':
          options.status = value;
          break;
        case 'search':
          options.search = value;
          break;
        case 'sort':
          options.sortBy = value;
          break;
        case 'order':
          options.sortOrder = value === 'asc' ? 1 : -1;
          break;
      }
    }
  }
  
  return options;
}

// Show help
function showHelp() {
  console.log(`
Usage: node scripts/listAdoptionApplications.js [options]

Options:
  --page <number>     Page number (default: 1)
  --limit <number>    Number of applications per page (default: 20)
  --status <string>   Filter by status (pending, approved, rejected, cancelled, completed)
  --search <string>   Search by user name or pet name
  --sort <field>      Sort by field (createdAt, status) (default: createdAt)
  --order <asc|desc>  Sort order (default: desc)

Examples:
  node scripts/listAdoptionApplications.js --page 1 --limit 10
  node scripts/listAdoptionApplications.js --status pending
  node scripts/listAdoptionApplications.js --sort status --order asc
  `);
}

// Check if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

const options = parseArgs();
listApplications(options);