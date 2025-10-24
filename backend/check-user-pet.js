const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Connect to database
const connectDB = require('./core/db');
connectDB();

// Import models
const Pet = require('./core/models/Pet');
const User = require('./core/models/User');

async function checkUserPet(petCode, userEmail) {
  try {
    console.log(`Checking if pet ${petCode} exists for user with email ${userEmail}`);
    
    // Find user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.email}) with ID: ${user._id}`);
    
    // Check if pet exists in user's collection
    const pet = await Pet.findOne({ petCode: petCode, owner: user._id });
    if (pet) {
      console.log('Pet already exists in user collection:');
      console.log(`  ID: ${pet._id}`);
      console.log(`  Name: ${pet.name}`);
      console.log(`  Gender: ${pet.gender}`);
      console.log(`  Images: ${pet.imageIds ? pet.imageIds.length : 0} images`);
      return;
    }
    
    console.log('Pet does not exist in user collection');
  } catch (error) {
    console.error('Error checking user pet:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node check-user-pet.js <petCode> <userEmail>');
  console.log('Example: node check-user-pet.js EBA64023 albinjiji005@gmail.com');
  process.exit(1);
}

const petCode = args[0];
const userEmail = args[1];

checkUserPet(petCode, userEmail);