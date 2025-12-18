const PetBirthdayPreference = require('../../models/PetBirthdayPreference');
const Pet = require('../../models/Pet');
const AdoptionPet = require('../../../modules/adoption/manager/models/AdoptionPet');
const PetInventoryItem = require('../../../modules/petshop/manager/models/PetInventoryItem');
const ErrorHandler = require('../../utils/errorHandler');
const logger = require('../../utils/logger');
const { validate, setPetBirthdayPreferenceSchema } = require('../../utils/validation');

// Helper function to calculate birth date from current age and preferred birthday
function calculateBirthDate(currentAge, ageUnit, preferredBirthday) {
  const now = new Date();
  
  // First, calculate the approximate date based on current age
  let approxBirthDate = new Date(now);
  
  switch (ageUnit) {
    case 'days':
      approxBirthDate.setDate(approxBirthDate.getDate() - currentAge);
      break;
    case 'weeks':
      approxBirthDate.setDate(approxBirthDate.getDate() - (currentAge * 7));
      break;
    case 'months':
      approxBirthDate.setMonth(approxBirthDate.getMonth() - currentAge);
      break;
    case 'years':
      approxBirthDate.setFullYear(approxBirthDate.getFullYear() - currentAge);
      break;
  }
  
  // Set the preferred birthday
  approxBirthDate.setDate(preferredBirthday);
  
  // If the calculated date is in the future, adjust to previous year/month
  if (approxBirthDate > now) {
    if (ageUnit === 'years') {
      approxBirthDate.setFullYear(approxBirthDate.getFullYear() - 1);
    } else if (ageUnit === 'months') {
      approxBirthDate.setMonth(approxBirthDate.getMonth() - 1);
    } else if (ageUnit === 'weeks') {
      approxBirthDate.setDate(approxBirthDate.getDate() - 7);
    } else {
      approxBirthDate.setDate(approxBirthDate.getDate() - 1);
    }
  }
  
  return approxBirthDate;
}

// Helper function to get the correct pet model
async function getPetById(petId, petModel) {
  switch (petModel) {
    case 'Pet':
      return await Pet.findById(petId);
    case 'AdoptionPet':
      return await AdoptionPet.findById(petId);
    case 'PetInventoryItem':
      return await PetInventoryItem.findById(petId);
    default:
      // Try all models
      return await Pet.findById(petId) || 
             await AdoptionPet.findById(petId) || 
             await PetInventoryItem.findById(petId);
  }
}

// Set pet birthday preference
const setPetBirthdayPreference = async (req, res) => {
  try {
    // Validate input
    const { isValid, error } = validate(setPetBirthdayPreferenceSchema, req.body);
    if (!isValid) {
      return ErrorHandler.sendError(res, error, 400);
    }

    const { petId, petModel, currentAge, preferredBirthday } = req.body;
    const userId = req.user._id;
    
    logger.debug('Setting birthday preference for pet:', { petId, petModel, currentAge, preferredBirthday, userId });
    
    // Check if pet exists
    const pet = await getPetById(petId, petModel);
    logger.debug('Found pet:', pet ? pet._id : 'not found');
    
    if (!pet) {
      return ErrorHandler.sendError(res, 'Pet not found', 404);
    }
    
    // Verify user owns this pet
    const petOwnerId = pet.owner || pet.ownerId || pet.adopterUserId || pet.soldTo;
    logger.debug('Pet owner ID:', petOwnerId, 'User ID:', userId);
    
    if (!petOwnerId || petOwnerId.toString() !== userId.toString()) {
      return ErrorHandler.sendError(res, 'You do not have permission to set birthday preference for this pet', 403);
    }
    
    // Calculate the birth date
    const calculatedBirthDate = calculateBirthDate(
      currentAge.value, 
      currentAge.unit, 
      preferredBirthday
    );
    logger.debug('Calculated birth date:', calculatedBirthDate);
    
    // Check if preference already exists
    let preference = await PetBirthdayPreference.findOne({ petId });
    logger.debug('Existing preference:', preference);
    
    if (preference) {
      // Update existing preference
      preference.currentAge = currentAge;
      preference.preferredBirthday = preferredBirthday;
      preference.calculatedBirthDate = calculatedBirthDate;
      preference.updatedAt = Date.now();
      await preference.save();
    } else {
      // Create new preference
      preference = new PetBirthdayPreference({
        petId,
        petModel,
        currentAge,
        preferredBirthday,
        calculatedBirthDate,
        ownerId: userId
      });
      await preference.save();
    }
    
    // Update the pet's dateOfBirth field
    pet.dateOfBirth = calculatedBirthDate;
    await pet.save();
    
    ErrorHandler.sendSuccess(res, { preference }, 'Pet birthday preference set successfully');
    
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'set_pet_birthday_preference');
  }
};

// Get pet birthday preference
const getPetBirthdayPreference = async (req, res) => {
  try {
    const { petId } = req.params;
    logger.debug('Getting birthday preference for pet:', petId);
    
    const preference = await PetBirthdayPreference.findOne({ petId });
    logger.debug('Found preference:', preference);
    
    if (!preference) {
      return ErrorHandler.sendError(res, 'Birthday preference not found for this pet', 404);
    }
    
    ErrorHandler.sendSuccess(res, { preference });
    
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'get_pet_birthday_preference');
  }
};

// Update pet ages based on birthday preferences
const updatePetAgesFromPreferences = async () => {
  try {
    logger.info('Starting pet age update from birthday preferences...');
    
    // Get all active birthday preferences
    const preferences = await PetBirthdayPreference.find({ autoUpdateEnabled: true });
    
    let updatedCount = 0;
    
    for (const preference of preferences) {
      try {
        // Find the pet
        const pet = await getPetById(preference.petId, preference.petModel);
        
        if (pet && pet.dateOfBirth) {
          // Calculate new age based on birth date
          const now = new Date();
          const diffTime = Math.abs(now - pet.dateOfBirth);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          let newAge;
          switch (pet.ageUnit || 'months') {
            case 'days':
              newAge = diffDays;
              break;
            case 'weeks':
              newAge = Math.floor(diffDays / 7);
              break;
            case 'months':
              newAge = Math.floor(diffDays / 30.44);
              break;
            case 'years':
              newAge = Math.floor(diffDays / 365.25);
              break;
            default:
              newAge = Math.floor(diffDays / 30.44);
          }
          
          // Update pet age if it has changed
          if (pet.age !== newAge) {
            pet.age = newAge;
            await pet.save();
            updatedCount++;
          }
        }
      } catch (error) {
        logger.error(`Error updating pet ${preference.petId}:`, error);
      }
    }
    
    logger.info(`Updated ages for ${updatedCount} pets based on birthday preferences`);
    return updatedCount;
    
  } catch (error) {
    logger.error('Update pet ages from preferences error:', error);
    throw error;
  }
};

// Get all pets with birthday preferences for a user
const getUserPetsWithPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    logger.debug('Getting birthday preferences for user:', userId);
    
    // Get all birthday preferences for this user
    const preferences = await PetBirthdayPreference.find({ ownerId: userId });
    logger.debug('Found preferences:', preferences.length);
    
    const preferenceMap = {};
    preferences.forEach(pref => {
      preferenceMap[pref.petId.toString()] = pref;
    });
    
    ErrorHandler.sendSuccess(res, { preferences: preferenceMap });
    
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'get_user_pets_with_preferences');
  }
};

module.exports = {
  setPetBirthdayPreference,
  getPetBirthdayPreference,
  updatePetAgesFromPreferences,
  getUserPetsWithPreferences
};