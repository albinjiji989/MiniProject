const PetRegistry = require('../models/PetRegistry');
const Pet = require('../models/Pet');
// const PetNew = require('../models/PetNew'); // Removed as PetNew model doesn't exist
const AdoptionPet = require('../../modules/adoption/manager/models/AdoptionPet');
const PetInventoryItem = require('../../modules/petshop/manager/models/PetInventoryItem');
const PetStock = require('../../modules/petshop/manager/models/PetStock');
const PetAuditService = require('./PetAuditService');
const PetAgeService = require('./PetAgeService');

/**
 * Unified Pet Service
 * Ensures consistent registration and management of pets across all modules
 */
class UnifiedPetService {
  /**
   * Register a pet in the centralized registry
   * @param {Object} params - Registration parameters
   * @param {String} params.petCode - Unique pet code
   * @param {String} params.name - Pet name
   * @param {mongoose.Types.ObjectId} params.speciesId - Species reference
   * @param {mongoose.Types.ObjectId} params.breedId - Breed reference
   * @param {Array} params.imageIds - Array of image IDs
   * @param {String} params.source - Source of pet ('core', 'petshop', 'adoption')
   * @param {String} params.firstAddedSource - Where pet was first added ('user', 'adoption_center', 'pet_shop')
   * @param {mongoose.Types.ObjectId} params.firstAddedBy - User who first added the pet
   * @param {mongoose.Types.ObjectId} params.currentOwnerId - Current owner of the pet
   * @param {String} params.currentLocation - Current location of the pet
   * @param {String} params.currentStatus - Current status of the pet
   * @param {String} params.gender - Gender of the pet
   * @param {Number} params.age - Age of the pet
   * @param {String} params.ageUnit - Age unit ('weeks', 'months', 'years')
   * @param {String} params.color - Color of the pet
   * @param {Object} params.sourceReferences - References to source models
   * @param {mongoose.Types.ObjectId} params.sourceReferences.corePetId - Reference to Pet/PetNew model
   * @param {mongoose.Types.ObjectId} params.sourceReferences.petShopItemId - Reference to PetInventoryItem model
   * @param {mongoose.Types.ObjectId} params.sourceReferences.adoptionPetId - Reference to AdoptionPet model
   * @param {mongoose.Types.ObjectId} params.actorUserId - User performing the current action
   * @returns {Promise<Object>} Registered pet registry entry
   */
  static async registerPetInRegistry({
    petCode,
    name,
    speciesId,
    breedId,
    imageIds = [],
    source,
    firstAddedSource,
    firstAddedBy,
    currentOwnerId,
    currentLocation,
    currentStatus,
    gender,
    age,
    ageUnit,
    color,
    sourceReferences = {},
    actorUserId
  }) {
    // Validate required parameters
    if (!petCode) throw new Error('petCode is required');
    if (!source) throw new Error('source is required');

    try {
      // Prepare registry identity data
      const registryData = {
        petCode,
        name,
        species: speciesId,
        breed: breedId,
        imageIds: Array.isArray(imageIds) ? imageIds : [],
        source,
        firstAddedSource,
        firstAddedBy,
        gender,
        age,
        ageUnit,
        color,
        createdBy: actorUserId,
        updatedBy: actorUserId,
        ...sourceReferences
      };

      // Set source label based on source
      const sourceLabels = {
        'core': 'User Added',
        'petshop': 'Pet Shop',
        'adoption': 'Adoption Center'
      };
      registryData.sourceLabel = sourceLabels[source] || source;

      // Prepare registry state data
      const stateData = {
        currentOwnerId,
        currentLocation,
        currentStatus,
        updatedBy: actorUserId,
        lastSeenAt: new Date()
      };

      // Upsert the registry entry
      const registryEntry = await PetRegistry.findOneAndUpdate(
        { petCode },
        {
          $set: { ...registryData, ...stateData },
          $setOnInsert: {
            petCode,
            firstAddedAt: new Date(),
            createdBy: actorUserId
          }
        },
        { new: true, upsert: true }
      ).populate('images');

      return registryEntry;
    } catch (error) {
      console.error('Error registering pet in registry:', error);
      throw error;
    }
  }

  /**
   * Create an adoption pet and register in PetRegistry
   * @param {Object} adoptionPetData - Adoption pet data
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created adoption pet and registry entry
   */
  static async createAdoptionPet(adoptionPetData, userData) {
    try {
      // Generate pet code if not provided
      if (!adoptionPetData.petCode) {
        const PetCodeGenerator = require('../utils/petCodeGenerator');
        adoptionPetData.petCode = await PetCodeGenerator.generateUniquePetCode();
      }

      // Create adoption pet
      const adoptionPet = new AdoptionPet({
        ...adoptionPetData,
        createdBy: userData.id
      });
      await adoptionPet.save();

      // Register in PetRegistry
      const registryEntry = await this.registerPetInRegistry({
        petCode: adoptionPet.petCode,
        name: adoptionPet.name,
        speciesId: adoptionPet.species, // String name in AdoptionPet
        breedId: adoptionPet.breed, // String name in AdoptionPet
        imageIds: adoptionPet.imageIds || [],
        source: 'adoption',
        firstAddedSource: 'adoption_center',
        firstAddedBy: userData.id,
        currentOwnerId: userData.id, // Adoption center owns it initially
        currentLocation: 'at_adoption_center',
        currentStatus: adoptionPet.status || 'available',
        gender: adoptionPet.gender,
        age: adoptionPet.age,
        ageUnit: adoptionPet.ageUnit,
        color: adoptionPet.color,
        sourceReferences: {
          adoptionPetId: adoptionPet._id
        },
        actorUserId: userData.id
      });

      // Log the creation in audit trail
      await PetAuditService.logPetCreation({
        petCode: adoptionPet.petCode,
        module: 'adoption',
        performedBy: userData.id,
        details: {
          name: adoptionPet.name,
          species: adoptionPet.species,
          breed: adoptionPet.breed
        },
        notes: 'Pet created in adoption center'
      });

      // Create age tracker for the pet
      try {
        await PetAgeService.createAgeTracker({
          petCode: adoptionPet.petCode,
          initialAgeValue: adoptionPet.age || 0,
          initialAgeUnit: adoptionPet.ageUnit || 'months',
          birthDate: adoptionPet.birthDate
        });
      } catch (ageError) {
        console.warn(`⚠️  Failed to create age tracker for pet ${adoptionPet.petCode}:`, ageError.message);
      }

      return { adoptionPet, registryEntry };
    } catch (error) {
      console.error('Error creating adoption pet:', error);
      throw error;
    }
  }

  /**
   * Create a pet shop pet and register in PetRegistry
   * @param {Object} petShopData - Pet shop pet data
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created pet shop pet and registry entry
   */
  static async createPetShopPet(petShopData, userData) {
    try {
      // Generate pet code if not provided
      if (!petShopData.petCode) {
        const PetCodeGenerator = require('../utils/petCodeGenerator');
        petShopData.petCode = await PetCodeGenerator.generateUniquePetCode();
      }

      // Create pet shop pet
      const petShopPet = new PetInventoryItem({
        ...petShopData,
        createdBy: userData.id,
        storeId: userData.storeId
      });
      await petShopPet.save();

      // Register in PetRegistry
      const registryEntry = await this.registerPetInRegistry({
        petCode: petShopPet.petCode,
        name: petShopPet.name,
        speciesId: petShopPet.speciesId,
        breedId: petShopPet.breedId,
        imageIds: petShopPet.imageIds || [],
        source: 'petshop',
        firstAddedSource: 'pet_shop',
        firstAddedBy: userData.id,
        currentOwnerId: userData.id, // Pet shop manager owns it initially
        currentLocation: 'at_petshop',
        currentStatus: petShopPet.status || 'in_petshop',
        gender: petShopPet.gender,
        age: petShopPet.age,
        ageUnit: petShopPet.ageUnit,
        color: petShopPet.color,
        sourceReferences: {
          petShopItemId: petShopPet._id
        },
        actorUserId: userData.id
      });

      // Log the creation in audit trail
      await PetAuditService.logPetCreation({
        petCode: petShopPet.petCode,
        module: 'petshop',
        performedBy: userData.id,
        details: {
          name: petShopPet.name,
          speciesId: petShopPet.speciesId,
          breedId: petShopPet.breedId,
          price: petShopPet.price
        },
        notes: 'Pet created in pet shop'
      });

      // Create age tracker for the pet
      try {
        await PetAgeService.createAgeTracker({
          petCode: petShopPet.petCode,
          initialAgeValue: petShopPet.age || 0,
          initialAgeUnit: petShopPet.ageUnit || 'months',
          birthDate: petShopPet.birthDate
        });
      } catch (ageError) {
        console.warn(`⚠️  Failed to create age tracker for pet ${petShopPet.petCode}:`, ageError.message);
      }

      return { petShopPet, registryEntry };
    } catch (error) {
      console.error('Error creating pet shop pet:', error);
      throw error;
    }
  }

  /**
   * Create a user pet and register in PetRegistry
   * @param {Object} userPetData - User pet data
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user pet and registry entry
   */
  static async createUserPet(userPetData, userData) {
    try {
      // Generate pet code if not provided
      if (!userPetData.petCode) {
        const PetCodeGenerator = require('../utils/petCodeGenerator');
        userPetData.petCode = await PetCodeGenerator.generateUniquePetCode();
      }

      // Create user pet in Pet model
      const userPet = new Pet({
        ...userPetData,
        owner: userData.id,
        createdBy: userData.id
      });
      await userPet.save();

      // Removed PetNew creation as PetNew model doesn't exist

      // Register in PetRegistry
      const registryEntry = await this.registerPetInRegistry({
        petCode: userPet.petCode,
        name: userPet.name,
        speciesId: userPet.species || userPet.speciesId,
        breedId: userPet.breed || userPet.breedId,
        imageIds: userPet.imageIds || [],
        source: 'core',
        firstAddedSource: 'user',
        firstAddedBy: userData.id,
        currentOwnerId: userData.id, // User owns it
        currentLocation: 'at_owner',
        currentStatus: userPet.currentStatus || 'Available',
        gender: userPet.gender,
        age: userPet.age,
        ageUnit: userPet.ageUnit,
        color: userPet.color,
        sourceReferences: {
          corePetId: userPet._id // Reference to Pet model (primary)
        },
        actorUserId: userData.id
      });

      // Log the creation in audit trail
      await PetAuditService.logPetCreation({
        petCode: userPet.petCode,
        module: 'core',
        performedBy: userData.id,
        details: {
          name: userPet.name,
          speciesId: userPet.species || userPet.speciesId,
          breedId: userPet.breed || userPet.breedId
        },
        notes: 'Pet added by user'
      });

      // Create age tracker for the pet
      try {
        await PetAgeService.createAgeTracker({
          petCode: userPet.petCode,
          initialAgeValue: userPet.age || 0,
          initialAgeUnit: userPet.ageUnit || 'months',
          birthDate: userPet.birthDate
        });
      } catch (ageError) {
        console.warn(`⚠️  Failed to create age tracker for pet ${userPet.petCode}:`, ageError.message);
      }

      return { userPet, registryEntry };
    } catch (error) {
      console.error('Error creating user pet:', error);
      throw error;
    }
  }

  /**
   * Generate pets from stock and register each in PetRegistry
   * @param {mongoose.Types.ObjectId} stockId - Stock ID
   * @param {Number} maleCount - Number of male pets to generate
   * @param {Number} femaleCount - Number of female pets to generate
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Generated pets and updated stock
   */
  static async generatePetsFromStock(stockId, maleCount, femaleCount, userData) {
    try {
      // Find the stock
      const stock = await PetStock.findById(stockId);
      if (!stock) {
        throw new Error('Stock not found');
      }

      // Validate counts
      if (maleCount > stock.maleCount || femaleCount > stock.femaleCount) {
        throw new Error('Not enough pets in stock');
      }

      // Generate individual pets
      const generatedPets = [];

      // Generate male pets
      for (let i = 0; i < maleCount; i++) {
        const PetCodeGenerator = require('../utils/petCodeGenerator');
        const petCode = await PetCodeGenerator.generateUniquePetCode();

        const pet = new PetInventoryItem({
          name: stock.name,
          petCode,
          speciesId: stock.speciesId,
          breedId: stock.breedId,
          gender: 'Male',
          age: stock.age,
          ageUnit: stock.ageUnit,
          color: stock.color,
          size: stock.size,
          price: stock.price,
          discountPrice: stock.discountPrice,
          storeId: stock.storeId,
          storeName: stock.storeName,
          createdBy: userData.id,
          imageIds: stock.maleImageIds, // Share the same image for all male pets in this stock
          status: 'available_for_sale',
          stockId: stockId, // Link to the stock
          generatedFromStock: true
        });

        await pet.save();
        generatedPets.push(pet);

        // Register each generated pet in PetRegistry
        await this.registerPetInRegistry({
          petCode: pet.petCode,
          name: pet.name,
          speciesId: pet.speciesId,
          breedId: pet.breedId,
          imageIds: pet.imageIds || [],
          source: 'petshop',
          firstAddedSource: 'pet_shop',
          firstAddedBy: userData.id,
          currentOwnerId: userData.id, // Pet shop manager owns it initially
          currentLocation: 'at_petshop',
          currentStatus: pet.status || 'available_for_sale',
          gender: pet.gender,
          age: pet.age,
          ageUnit: pet.ageUnit,
          color: pet.color,
          sourceReferences: {
            petShopItemId: pet._id
          },
          actorUserId: userData.id
        });

        // Log the creation in audit trail
        await PetAuditService.logPetCreation({
          petCode: pet.petCode,
          module: 'petshop',
          performedBy: userData.id,
          details: {
            name: pet.name,
            speciesId: pet.speciesId,
            breedId: pet.breedId,
            price: pet.price,
            generatedFromStock: true,
            stockId: stockId
          },
          notes: 'Pet generated from stock (male)'
        });

        // Create age tracker for the generated pet
        try {
          await PetAgeService.createAgeTracker({
            petCode: pet.petCode,
            initialAgeValue: pet.age || 0,
            initialAgeUnit: pet.ageUnit || 'months',
            birthDate: pet.birthDate
          });
        } catch (ageError) {
          console.warn(`⚠️  Failed to create age tracker for pet ${pet.petCode}:`, ageError.message);
        }
      }

      // Generate female pets
      for (let i = 0; i < femaleCount; i++) {
        const PetCodeGenerator = require('../utils/petCodeGenerator');
        const petCode = await PetCodeGenerator.generateUniquePetCode();

        const pet = new PetInventoryItem({
          name: stock.name,
          petCode,
          speciesId: stock.speciesId,
          breedId: stock.breedId,
          gender: 'Female',
          age: stock.age,
          ageUnit: stock.ageUnit,
          color: stock.color,
          size: stock.size,
          price: stock.price,
          discountPrice: stock.discountPrice,
          storeId: stock.storeId,
          storeName: stock.storeName,
          createdBy: userData.id,
          imageIds: stock.femaleImageIds, // Share the same image for all female pets in this stock
          status: 'available_for_sale',
          stockId: stockId, // Link to the stock
          generatedFromStock: true
        });

        await pet.save();
        generatedPets.push(pet);

        // Register each generated pet in PetRegistry
        await this.registerPetInRegistry({
          petCode: pet.petCode,
          name: pet.name,
          speciesId: pet.speciesId,
          breedId: pet.breedId,
          imageIds: pet.imageIds || [],
          source: 'petshop',
          firstAddedSource: 'pet_shop',
          firstAddedBy: userData.id,
          currentOwnerId: userData.id, // Pet shop manager owns it initially
          currentLocation: 'at_petshop',
          currentStatus: pet.status || 'available_for_sale',
          gender: pet.gender,
          age: pet.age,
          ageUnit: pet.ageUnit,
          color: pet.color,
          sourceReferences: {
            petShopItemId: pet._id
          },
          actorUserId: userData.id
        });

        // Log the creation in audit trail
        await PetAuditService.logPetCreation({
          petCode: pet.petCode,
          module: 'petshop',
          performedBy: userData.id,
          details: {
            name: pet.name,
            speciesId: pet.speciesId,
            breedId: pet.breedId,
            price: pet.price,
            generatedFromStock: true,
            stockId: stockId
          },
          notes: 'Pet generated from stock (female)'
        });

        // Create age tracker for the generated pet
        try {
          await PetAgeService.createAgeTracker({
            petCode: pet.petCode,
            initialAgeValue: pet.age || 0,
            initialAgeUnit: pet.ageUnit || 'months',
            birthDate: pet.birthDate
          });
        } catch (ageError) {
          console.warn(`⚠️  Failed to create age tracker for pet ${pet.petCode}:`, ageError.message);
        }
      }

      // Update stock counts
      stock.maleCount -= maleCount;
      stock.femaleCount -= femaleCount;

      // Mark stock as released if this is the first generation
      if (!stock.isReleased) {
        stock.isReleased = true;
        stock.releasedAt = new Date();
      }

      await stock.save();

      return { generatedPets, stock };
    } catch (error) {
      console.error('Error generating pets from stock:', error);
      throw error;
    }
  }

  /**
   * Update pet location and status in PetRegistry
   * @param {String} petCode - Pet code
   * @param {String} location - New location
   * @param {String} status - New status
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Updated registry entry
   */
  static async updatePetLocationAndStatus(petCode, location, status, userData) {
    try {
      // Get current registry entry to capture previous location
      const currentRegistry = await PetRegistry.findOne({ petCode });
      if (!currentRegistry) {
        throw new Error(`Pet with code ${petCode} not found in registry`);
      }

      const updateData = {
        currentLocation: location,
        currentStatus: status,
        updatedBy: userData.id,
        lastSeenAt: new Date()
      };

      const registryEntry = await PetRegistry.findOneAndUpdate(
        { petCode },
        { $set: updateData },
        { new: true }
      );

      if (!registryEntry) {
        throw new Error(`Pet with code ${petCode} not found in registry`);
      }

      // Log the location/status change in audit trail
      await PetAuditService.logPetLocationChange({
        petCode: petCode,
        module: registryEntry.source || 'core',
        fromLocation: currentRegistry.currentLocation,
        toLocation: location,
        performedBy: userData.id,
        details: {
          previousStatus: currentRegistry.currentStatus,
          newStatus: status
        },
        notes: `Location changed from ${currentRegistry.currentLocation} to ${location}`
      });

      return registryEntry;
    } catch (error) {
      console.error('Error updating pet location and status:', error);
      throw error;
    }
  }

  /**
   * Mark a pet as deceased
   * @param {String} petCode - Pet code
   * @param {String} reason - Reason for death
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Updated registry entry
   */
  static async markPetAsDeceased(petCode, reason, userData) {
    try {
      const registry = await PetRegistry.findOne({ petCode });
      if (!registry) {
        throw new Error(`Pet with code ${petCode} not found in registry`);
      }

      // Mark pet as deceased using the model method
      await registry.markAsDeceased(reason, userData.id);

      // Log the death in audit trail
      await PetAuditService.logPetDeath({
        petCode: petCode,
        module: registry.source || 'core',
        performedBy: userData.id,
        details: {
          reason: reason
        },
        notes: `Pet marked as deceased: ${reason}`
      });

      return registry;
    } catch (error) {
      console.error('Error marking pet as deceased:', error);
      throw error;
    }
  }

  /**
   * Record ownership transfer in PetRegistry
   * @param {String} petCode - Pet code
   * @param {Object} transferData - Transfer data
   * @param {mongoose.Types.ObjectId} transferData.previousOwnerId - Previous owner
   * @param {mongoose.Types.ObjectId} transferData.newOwnerId - New owner
   * @param {String} transferData.transferType - Type of transfer
   * @param {Number} transferData.transferPrice - Transfer price
   * @param {String} transferData.transferReason - Reason for transfer
   * @param {String} transferData.source - Source of transfer
   * @param {String} transferData.notes - Additional notes
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Updated registry entry
   */
  static async recordOwnershipTransfer(petCode, transferData, userData) {
    try {
      const registry = await PetRegistry.findOne({ petCode });
      if (!registry) {
        throw new Error(`Pet with code ${petCode} not found in registry`);
      }

      // Record the transfer using instance method
      registry.recordOwnershipTransfer({
        previousOwnerId: transferData.previousOwnerId,
        newOwnerId: transferData.newOwnerId,
        transferType: transferData.transferType,
        transferPrice: transferData.transferPrice || 0,
        transferReason: transferData.transferReason || '',
        source: transferData.source || '',
        notes: transferData.notes || '',
        performedBy: userData.id
      });

      // Update location and status based on transfer type
      if (transferData.transferType === 'purchase' || transferData.transferType === 'adoption') {
        registry.currentLocation = 'at_owner';
        registry.currentStatus = transferData.transferType === 'purchase' ? 'sold' : 'adopted';
      } else if (transferData.transferType === 'hospital_admission') {
        registry.currentLocation = 'in_hospital';
        registry.currentStatus = 'in_hospital';
      } else if (transferData.transferType === 'hospital_discharge') {
        registry.currentLocation = 'at_owner';
        registry.currentStatus = 'owned';
      } else if (transferData.transferType === 'temporary_care_start') {
        registry.currentLocation = 'in_temporary_care';
        registry.currentStatus = 'in_temporary_care';
      } else if (transferData.transferType === 'temporary_care_end') {
        registry.currentLocation = 'at_owner';
        registry.currentStatus = 'owned';
      }

      await registry.save();

      // Log the transfer in audit trail
      await PetAuditService.logPetTransfer({
        petCode: petCode,
        module: transferData.source || 'core',
        fromLocation: registry.currentLocation, // Previous location
        toLocation: registry.currentLocation, // New location
        performedBy: userData.id,
        details: {
          transferType: transferData.transferType,
          transferPrice: transferData.transferPrice,
          transferReason: transferData.transferReason
        },
        notes: transferData.notes || ''
      });

      return registry;
    } catch (error) {
      console.error('Error recording ownership transfer:', error);
      throw error;
    }
  }
}

module.exports = UnifiedPetService;