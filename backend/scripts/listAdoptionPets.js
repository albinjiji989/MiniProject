const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Connect to database
const connectDB = require('../core/db');
connectDB();

// Import models
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');

async function listPets(options = {}) {
  const { 
    page = 1, 
    limit = 20, 
    status = 'available', 
    search = '', 
    sortBy = 'createdAt', 
    sortOrder = -1 
  } = options;
  
  try {
    // Build query
    const query = { isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { species: { $regex: search, $options: 'i' } },
        { petCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await AdoptionPet.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    // Get pets with pagination
    const pets = await AdoptionPet.find(query)
      .select('_id name species breed age ageUnit gender status isActive petCode createdAt')
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip((page - 1) * limit);
    
    console.log(`\n=== ADOPTION PETS LISTING ===`);
    console.log(`Page ${page} of ${totalPages} (Total: ${total} pets)`);
    console.log(`Filters - Status: ${status || 'All'}, Search: "${search}"`);
    console.log(`Sorting - By: ${sortBy}, Order: ${sortOrder === 1 ? 'ASC' : 'DESC'}\n`);
    
    if (pets.length === 0) {
      console.log('No pets found matching the criteria.');
      return;
    }
    
    // Display pets in a table format
    console.log('ID\t\t\t\tName\t\tSpecies\t\tBreed\t\tStatus\t\tAge\tCode');
    console.log('-'.repeat(120));
    
    pets.forEach(pet => {
      const ageDisplay = `${pet.age || 0} ${pet.ageUnit || 'months'}`;
      const name = pet.name ? pet.name.substring(0, 15) : '-';
      const species = pet.species ? pet.species.substring(0, 12) : '-';
      const breed = pet.breed ? pet.breed.substring(0, 12) : '-';
      
      console.log(
        `${pet._id}\t${name}\t\t${species}\t\t${breed}\t\t${pet.status}\t\t${ageDisplay}\t${pet.petCode || '-'}`
      );
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Showing ${pets.length} pets on page ${page}`);
    
    // Show status breakdown
    const statusCounts = await AdoptionPet.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('\nStatus Breakdown:');
    statusCounts.forEach(status => {
      console.log(`  ${status._id}: ${status.count}`);
    });
    
  } catch (error) {
    console.error('Error listing pets:', error);
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
Usage: node scripts/listAdoptionPets.js [options]

Options:
  --page <number>     Page number (default: 1)
  --limit <number>    Number of pets per page (default: 20)
  --status <string>   Filter by status (available, reserved, adopted) (default: available)
  --search <string>   Search by name, breed, species, or code
  --sort <field>      Sort by field (name, createdAt, age) (default: createdAt)
  --order <asc|desc>  Sort order (default: desc)

Examples:
  node scripts/listAdoptionPets.js --page 1 --limit 10
  node scripts/listAdoptionPets.js --status adopted --search "Buddy"
  node scripts/listAdoptionPets.js --sort name --order asc
  `);
}

// Check if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

const options = parseArgs();
listPets(options);