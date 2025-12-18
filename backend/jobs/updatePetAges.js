const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pet_management');

const Pet = require('../core/models/Pet');
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
const PetInventoryItem = require('../modules/petshop/manager/models/PetInventoryItem');
const PetBirthdayPreference = require('../core/models/PetBirthdayPreference');

// Function to calculate age from date of birth
function calculateAge(dateOfBirth, ageUnit) {
  if (!dateOfBirth) return null;
  
  const now = new Date();
  const diffTime = Math.abs(now - dateOfBirth);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate age based on the unit
  switch (ageUnit) {
    case 'days':
      return diffDays;
    case 'weeks':
      return Math.floor(diffDays / 7);
    case 'months':
      return Math.floor(diffDays / 30.44); // Average days in a month
    case 'years':
      return Math.floor(diffDays / 365.25); // Account for leap years
    default:
      return Math.floor(diffDays / 30.44); // Default to months
  }
}

async function updateAllPetAges() {
  try {
    console.log('Starting pet age update job...');
    
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);
    
    // First, update pets with birthday preferences
    const preferenceUpdatedCount = await updatePetAgesFromPreferences();
    console.log(`Updated ${preferenceUpdatedCount} pets based on birthday preferences`);
    
    // Update Pet model (pets with dateOfBirth but no preference)
    const petResult = await Pet.updateMany(
      { 
        dateOfBirth: { $exists: true, $ne: null },
        _id: { $nin: await mongoose.model('PetBirthdayPreference').distinct('petId') }
      },
      [
        {
          $set: {
            age: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ["$ageUnit", "days"] },
                    then: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24] } }
                  },
                  {
                    case: { $eq: ["$ageUnit", "weeks"] },
                    then: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24 * 7] } }
                  },
                  {
                    case: { $eq: ["$ageUnit", "years"] },
                    then: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24 * 365.25] } }
                  },
                  {
                    case: { $eq: ["$ageUnit", "months"] },
                    then: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24 * 30.44] } }
                  }
                ],
                default: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24 * 30.44] } }
              }
            }
          }
        }
      ]
    );
    
    console.log(`Updated ${petResult.modifiedCount} pets in Pet collection`);
    

    // Update AdoptionPet model
    const adoptionPetResult = await AdoptionPet.updateMany(
      { 
        dateOfBirth: { $exists: true, $ne: null },
        _id: { $nin: await mongoose.model('PetBirthdayPreference').distinct('petId') }
      },
      [
        {
          $set: {
            age: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ["$ageUnit", "days"] },
                    then: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24] } }
                  },
                  {
                    case: { $eq: ["$ageUnit", "weeks"] },
                    then: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24 * 7] } }
                  },
                  {
                    case: { $eq: ["$ageUnit", "years"] },
                    then: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24 * 365.25] } }
                  },
                  {
                    case: { $eq: ["$ageUnit", "months"] },
                    then: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24 * 30.44] } }
                  }
                ],
                default: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24 * 30.44] } }
              }
            }
          }
        }
      ]
    );
    
    console.log(`Updated ${adoptionPetResult.modifiedCount} pets in AdoptionPet collection`);
    
    // Update PetInventoryItem model
    const petInventoryResult = await PetInventoryItem.updateMany(
      { 
        dateOfBirth: { $exists: true, $ne: null },
        _id: { $nin: await mongoose.model('PetBirthdayPreference').distinct('petId') }
      },
      [
        {
          $set: {
            age: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ["$ageUnit", "days"] },
                    then: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24] } }
                  },
                  {
                    case: { $eq: ["$ageUnit", "weeks"] },
                    then: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24 * 7] } }
                  },
                  {
                    case: { $eq: ["$ageUnit", "years"] },
                    then: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24 * 365.25] } }
                  },
                  {
                    case: { $eq: ["$ageUnit", "months"] },
                    then: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24 * 30.44] } }
                  }
                ],
                default: { $floor: { $divide: [{ $subtract: [now, "$dateOfBirth"] }, 1000 * 60 * 60 * 24 * 30.44] } }
              }
            }
          }
        }
      ]
    );
    
    console.log(`Updated ${petInventoryResult.modifiedCount} pets in PetInventoryItem collection`);
    
    console.log('Pet age update job completed successfully!');
    
  } catch (error) {
    console.error('Error updating pet ages:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the job if this script is executed directly
if (require.main === module) {
  updateAllPetAges();
}

module.exports = { updateAllPetAges };