const PetAgeTracker = require('../models/PetAgeTracker');
const PetRegistry = require('../models/PetRegistry');

/**
 * Pet Age Service
 * Centralized service for managing and calculating pet ages across all modules
 */
class PetAgeService {
  /**
   * Create a new age tracker for a pet
   * @param {Object} ageData - Age data for the pet
   * @param {String} ageData.petCode - Unique pet code
   * @param {Number} ageData.initialAgeValue - Initial age value
   * @param {String} ageData.initialAgeUnit - Initial age unit (days, weeks, months, years)
   * @param {Date} ageData.birthDate - Birth date if known
   * @returns {Promise<Object>} Created age tracker
   */
  static async createAgeTracker(ageData) {
    try {
      const {
        petCode,
        initialAgeValue,
        initialAgeUnit,
        birthDate
      } = ageData;

      // Validate pet exists in registry
      const petRegistry = await PetRegistry.findOne({ petCode });
      if (!petRegistry) {
        throw new Error(`Pet with code ${petCode} not found in registry`);
      }

      // Determine calculation method
      const calculationMethod = birthDate ? 'birthdate' : 'manual';
      
      // Set initial current age same as initial age
      const initialAge = {
        value: initialAgeValue,
        unit: initialAgeUnit
      };

      const ageTracker = new PetAgeTracker({
        petCode,
        initialAge,
        birthDate,
        currentAge: { ...initialAge },
        calculationMethod
      });

      const savedTracker = await ageTracker.save();
      console.log(`✅ Created age tracker for pet ${petCode}`);
      return savedTracker;
    } catch (error) {
      console.error('Error creating age tracker:', error);
      throw error;
    }
  }

  /**
   * Get current age for a pet
   * @param {String} petCode - Unique pet code
   * @returns {Promise<Object>} Current age information
   */
  static async getCurrentAge(petCode) {
    try {
      const tracker = await PetAgeTracker.findOne({ petCode });
      if (!tracker) {
        throw new Error(`Age tracker not found for pet ${petCode}`);
      }

      // Calculate current age
      const currentAge = tracker.calculateCurrentAge();
      
      return {
        petCode,
        initialAge: tracker.initialAge,
        currentAge,
        birthDate: tracker.birthDate,
        calculationMethod: tracker.calculationMethod,
        lastCalculated: tracker.lastCalculated
      };
    } catch (error) {
      console.error(`Error getting current age for pet ${petCode}:`, error);
      throw error;
    }
  }

  /**
   * Update age tracker with new information
   * @param {String} petCode - Unique pet code
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated age tracker
   */
  static async updateAgeTracker(petCode, updateData) {
    try {
      const tracker = await PetAgeTracker.findOne({ petCode });
      if (!tracker) {
        throw new Error(`Age tracker not found for pet ${petCode}`);
      }

      // Update fields
      if (updateData.birthDate !== undefined) {
        tracker.birthDate = updateData.birthDate;
        tracker.calculationMethod = updateData.birthDate ? 'birthdate' : 'manual';
      }

      if (updateData.initialAgeValue !== undefined && updateData.initialAgeUnit !== undefined) {
        tracker.initialAge = {
          value: updateData.initialAgeValue,
          unit: updateData.initialAgeUnit
        };
      }

      // Recalculate current age
      const currentAge = tracker.calculateCurrentAge();
      tracker.currentAge = currentAge;
      tracker.lastCalculated = new Date();

      const updatedTracker = await tracker.save();
      console.log(`✅ Updated age tracker for pet ${petCode}`);
      return updatedTracker;
    } catch (error) {
      console.error(`Error updating age tracker for pet ${petCode}:`, error);
      throw error;
    }
  }

  /**
   * Update all pet ages in the system
   * @returns {Promise<Array>} Updated trackers
   */
  static async updateAllAges() {
    try {
      console.log('🔄 Starting bulk age update for all pets...');
      const updatedTrackers = await PetAgeTracker.updateAllAges();
      console.log(`✅ Updated ages for ${updatedTrackers.length} pets`);
      return updatedTrackers;
    } catch (error) {
      console.error('Error updating all pet ages:', error);
      throw error;
    }
  }

  /**
   * Delete age tracker for a pet
   * @param {String} petCode - Unique pet code
   * @returns {Promise<Boolean>} Success status
   */
  static async deleteAgeTracker(petCode) {
    try {
      const result = await PetAgeTracker.deleteOne({ petCode });
      if (result.deletedCount > 0) {
        console.log(`✅ Deleted age tracker for pet ${petCode}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting age tracker for pet ${petCode}:`, error);
      throw error;
    }
  }

  /**
   * Get pets by age range
   * @param {Number} minAge - Minimum age
   * @param {Number} maxAge - Maximum age
   * @param {String} unit - Age unit (days, weeks, months, years)
   * @returns {Promise<Array>} Pets in age range
   */
  static async getPetsByAgeRange(minAge, maxAge, unit) {
    try {
      const trackers = await PetAgeTracker.find({
        'currentAge.value': { $gte: minAge, $lte: maxAge },
        'currentAge.unit': unit
      }).populate({
        path: 'petCode',
        model: 'PetRegistry'
      });

      return trackers.map(tracker => ({
        petCode: tracker.petCode,
        initialAge: tracker.initialAge,
        currentAge: tracker.currentAge,
        birthDate: tracker.birthDate
      }));
    } catch (error) {
      console.error('Error getting pets by age range:', error);
      throw error;
    }
  }

  /**
   * Get age statistics for reporting
   * @returns {Promise<Object>} Age statistics
   */
  static async getAgeStatistics() {
    try {
      const stats = await PetAgeTracker.aggregate([
        {
          $group: {
            _id: '$currentAge.unit',
            count: { $sum: 1 },
            averageAge: { $avg: '$currentAge.value' },
            minAge: { $min: '$currentAge.value' },
            maxAge: { $max: '$currentAge.value' }
          }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error getting age statistics:', error);
      throw error;
    }
  }
}

module.exports = PetAgeService;