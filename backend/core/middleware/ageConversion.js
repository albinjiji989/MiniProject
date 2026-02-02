/**
 * Middleware to convert age/ageUnit inputs to dateOfBirth
 * This allows backward compatibility while transitioning to DOB-based system
 * Includes IST timezone support and validation
 */

const ageCalculator = require('../utils/ageCalculator');

/**
 * Convert age and ageUnit in request body to dateOfBirth
 * Sets dobAccuracy to 'estimated' when converted from age
 * If dateOfBirth already exists, keeps it and sets dobAccuracy to 'exact'
 * Validates DOB for correctness
 */
function convertAgeToDOB(req, res, next) {
  try {
    const body = req.body;
    
    // If dateOfBirth is already provided, validate and ensure dobAccuracy is set
    if (body.dateOfBirth) {
      // Validate DOB
      const validation = ageCalculator.validateDOB(body.dateOfBirth);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: `Invalid date of birth: ${validation.error}`
        });
      }
      
      // Normalize to IST midnight
      body.dateOfBirth = ageCalculator.normalizeToISTMidnight(body.dateOfBirth);
      
      if (!body.dobAccuracy) {
        body.dobAccuracy = 'exact';
      }
      // Remove age and ageUnit if provided (DOB takes precedence)
      delete body.age;
      delete body.ageUnit;
      return next();
    }
    
    // If age and ageUnit are provided, convert to estimated DOB
    if (body.age !== undefined && body.age !== null && body.age !== '') {
      const age = Number(body.age);
      const ageUnit = body.ageUnit || 'months';
      
      if (isNaN(age) || age < 0) {
        return res.status(400).json({
          success: false,
          error: 'Age must be a positive number'
        });
      }
      
      const estimatedDOB = ageCalculator.convertAgeToDOB(age, ageUnit);
      if (estimatedDOB) {
        // Validate converted DOB
        const validation = ageCalculator.validateDOB(estimatedDOB);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: `Invalid age conversion: ${validation.error}`
          });
        }
        
        body.dateOfBirth = estimatedDOB;
        body.dobAccuracy = 'estimated';
      }
      
      // Remove age and ageUnit from body (don't persist them)
      delete body.age;
      delete body.ageUnit;
    }
    
    next();
  } catch (error) {
    console.error('Error in convertAgeToDOB middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process age data'
    });
  }
}

/**
 * Convert age/ageUnit to DOB for array of pet data
 * Used for CSV imports and bulk operations
 */
function convertAgeToDOBBulk(petsArray) {
  if (!Array.isArray(petsArray)) {
    return petsArray;
  }
  
  return petsArray.map(pet => {
    const petData = { ...pet };
    
    // If dateOfBirth is already provided, ensure dobAccuracy is set
    if (petData.dateOfBirth) {
      if (!petData.dobAccuracy) {
        petData.dobAccuracy = 'exact';
      }
      // Remove age and ageUnit
      delete petData.age;
      delete petData.ageUnit;
      return petData;
    }
    
    // If age and ageUnit are provided, convert to estimated DOB
    if (petData.age !== undefined && petData.age !== null && petData.age !== '') {
      const age = Number(petData.age);
      const ageUnit = petData.ageUnit || 'months';
      
      if (!isNaN(age) && age >= 0) {
        const estimatedDOB = ageCalculator.convertAgeToDOB(age, ageUnit);
        if (estimatedDOB) {
          petData.dateOfBirth = estimatedDOB;
          petData.dobAccuracy = 'estimated';
        }
      }
      
      // Remove age and ageUnit
      delete petData.age;
      delete petData.ageUnit;
    }
    
    return petData;
  });
}

module.exports = {
  convertAgeToDOB,
  convertAgeToDOBBulk
};
