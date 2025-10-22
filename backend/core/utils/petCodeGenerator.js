const mongoose = require('mongoose');

/**
 * Centralized Pet Code Generator
 * Ensures unique pet codes across ALL pet systems in the project
 * Format: 3 uppercase letters (A-Z) + 5 digits (e.g., ABC12345)
 */
class PetCodeGenerator {
  
  /**
   * Generate a unique pet code across all pet systems
   * @returns {Promise<string>} Unique pet code (e.g., "DOG12345")
   */
  static async generateUniquePetCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const randomLetters = () => Array.from({ length: 3 }, () => 
      letters[Math.floor(Math.random() * letters.length)]
    ).join('')
    const randomNumber = () => Math.floor(10000 + Math.random() * 90000).toString() // 5 digits

    let code
    let exists = true
    let attempts = 0
    const maxAttempts = 1000 // Prevent infinite loops

    while (exists && attempts < maxAttempts) {
      code = `${randomLetters()}${randomNumber()}`
      
      // Check across ALL pet systems for uniqueness
      exists = await this.checkCodeExists(code)
      attempts++
    }

    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique pet code after maximum attempts')
    }

    return code
  }

  /**
   * Check if a pet code exists in ANY pet system
   * @param {string} code - Pet code to check
   * @returns {Promise<boolean>} True if code exists anywhere
   */
  static async checkCodeExists(code) {
    try {
      // Import models dynamically to avoid circular dependencies
      const Pet = require('../models/Pet')
      const PetNew = require('../models/PetNew')
      const AdoptionPet = require('../../modules/adoption/manager/models/AdoptionPet')
      const PetInventoryItem = require('../../modules/petshop/manager/models/PetInventoryItem')
      const PetRegistry = require('../models/PetRegistry')

      // Check all pet systems in parallel
      const [coreExists, coreNewExists, adoptionExists, petshopExists, registryExists] = await Promise.all([
        Pet.exists({ petCode: code }).catch(() => false), // Handle if model doesn't exist
        PetNew.exists({ petCode: code }).catch(() => false), // User-added pets
        AdoptionPet.exists({ petCode: code }).catch(() => false),
        PetInventoryItem.exists({ petCode: code }).catch(() => false),
        PetRegistry.exists({ petCode: code }).catch(() => false)
      ])

      return coreExists || coreNewExists || adoptionExists || petshopExists || registryExists
    } catch (error) {
      console.error('Error checking pet code existence:', error)
      // If there's an error, assume code exists to be safe
      return true
    }
  }

  /**
   * Validate pet code format
   * @param {string} code - Pet code to validate
   * @returns {boolean} True if valid format
   */
  static validatePetCodeFormat(code) {
    return /^[A-Z]{3}\d{5}$/.test(code)
  }

  /**
   * Reserve a specific pet code (for manual assignment)
   * @param {string} code - Pet code to reserve
   * @returns {Promise<boolean>} True if code is available and reserved
   */
  static async reservePetCode(code) {
    if (!this.validatePetCodeFormat(code)) {
      throw new Error('Invalid pet code format. Must be 3 uppercase letters followed by 5 digits')
    }

    const exists = await this.checkCodeExists(code)
    if (exists) {
      throw new Error(`Pet code ${code} is already in use`)
    }

    return true
  }

  /**
   * Generate multiple unique pet codes for bulk operations
   * @param {number} count - Number of codes to generate
   * @returns {Promise<string[]>} Array of unique pet codes
   */
  static async generateBulkPetCodes(count) {
    const codes = []
    const generatedCodes = new Set()

    for (let i = 0; i < count; i++) {
      let code
      let attempts = 0
      const maxAttempts = 100

      do {
        code = await this.generateUniquePetCode()
        attempts++
      } while (generatedCodes.has(code) && attempts < maxAttempts)

      if (attempts >= maxAttempts) {
        throw new Error(`Unable to generate ${count} unique pet codes`)
      }

      codes.push(code)
      generatedCodes.add(code)
    }

    return codes
  }

  /**
   * Get statistics about pet code usage
   * @returns {Promise<Object>} Usage statistics
   */
  static async getUsageStats() {
    try {
      const Pet = require('../models/Pet')
      const PetNew = require('../models/PetNew')
      const AdoptionPet = require('../../modules/adoption/manager/models/AdoptionPet')
      const PetInventoryItem = require('../../modules/petshop/manager/models/PetInventoryItem')

      const [coreCount, coreNewCount, adoptionCount, petshopCount] = await Promise.all([
        Pet.countDocuments({ petCode: { $exists: true, $ne: null } }).catch(() => 0),
        PetNew.countDocuments({ petCode: { $exists: true, $ne: null } }).catch(() => 0),
        AdoptionPet.countDocuments({ petCode: { $exists: true, $ne: null } }).catch(() => 0),
        PetInventoryItem.countDocuments({ petCode: { $exists: true, $ne: null } }).catch(() => 0)
      ])

      const totalUsed = coreCount + coreNewCount + adoptionCount + petshopCount
      const totalPossible = 26 * 26 * 26 * 90000 // AAA00000 to ZZZ99999 (excluding 00000-09999)
      const usagePercentage = ((totalUsed / totalPossible) * 100).toFixed(6)

      return {
        totalUsed,
        totalPossible,
        usagePercentage: `${usagePercentage}%`,
        breakdown: {
          corePets: coreCount,
          userAddedPets: coreNewCount,
          adoptionPets: adoptionCount,
          petshopInventory: petshopCount
        }
      }
    } catch (error) {
      console.error('Error getting usage stats:', error)
      return {
        error: 'Unable to calculate usage statistics'
      }
    }
  }
}

module.exports = PetCodeGenerator
