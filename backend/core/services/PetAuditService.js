const PetRegistry = require('../models/PetRegistry');

/**
 * Pet Audit Service
 * Tracks all movements and changes to pets across modules
 */
class PetAuditService {
  /**
   * Log a pet movement or change
   * @param {Object} auditData - Audit data
   * @param {String} auditData.petCode - Pet code
   * @param {String} auditData.action - Action performed (created, moved, transferred, updated, deceased)
   * @param {String} auditData.module - Module where action occurred (adoption, petshop, core)
   * @param {String} auditData.fromLocation - Previous location (if applicable)
   * @param {String} auditData.toLocation - New location (if applicable)
   * @param {mongoose.Types.ObjectId} auditData.performedBy - User who performed the action
   * @param {Object} auditData.details - Additional details about the action
   * @param {String} auditData.notes - Notes about the action
   * @returns {Promise<Object>} Created audit log entry
   */
  static async logPetMovement(auditData) {
    try {
      const {
        petCode,
        action,
        module,
        fromLocation,
        toLocation,
        performedBy,
        details = {},
        notes = ''
      } = auditData;

      // Get the pet registry entry
      const petRegistry = await PetRegistry.findOne({ petCode });
      if (!petRegistry) {
        throw new Error(`Pet with code ${petCode} not found in registry`);
      }

      // For ownership transfers (not creation), create audit log entry in the ownership history
      if (action !== 'created') {
        const OwnershipHistory = require('../models/OwnershipHistory');
        
        const auditEntry = {
          pet: petRegistry._id,
          previousOwner: petRegistry.currentOwnerId,
          newOwner: details.newOwnerId || petRegistry.currentOwnerId,
          transferType: action,
          transferDate: new Date(),
          transferPrice: details.transferPrice || 0,
          transferReason: details.reason || 'No reason provided',
          source: module,
          notes: notes,
          createdBy: performedBy
        };

        // Create a new ownership history entry
        const ownershipHistoryEntry = new OwnershipHistory(auditEntry);
        await ownershipHistoryEntry.save();
      }
      
      // Update last seen timestamp
      petRegistry.lastSeenAt = new Date();
      
      // Update location if provided
      if (toLocation) {
        petRegistry.currentLocation = toLocation;
      }
      
      await petRegistry.save();

      // Also update the metadata with audit information
      if (!petRegistry.metadata) {
        petRegistry.metadata = {};
      }
      
      if (!petRegistry.metadata.auditTrail) {
        petRegistry.metadata.auditTrail = [];
      }
      
      petRegistry.metadata.auditTrail.push({
        timestamp: new Date(),
        action: action,
        module: module,
        fromLocation: fromLocation,
        toLocation: toLocation,
        performedBy: performedBy,
        details: details,
        notes: notes
      });
      
      await petRegistry.save();

      return { action, module, performedBy, details, notes };
    } catch (error) {
      console.error('Error logging pet movement:', error);
      throw error;
    }
  }

  /**
   * Log pet creation
   * @param {Object} creationData - Creation data
   * @returns {Promise<Object>} Created audit log entry
   */
  static async logPetCreation(creationData) {
    return await this.logPetMovement({
      ...creationData,
      action: 'created'
    });
  }

  /**
   * Log pet transfer between owners
   * @param {Object} transferData - Transfer data
   * @returns {Promise<Object>} Created audit log entry
   */
  static async logPetTransfer(transferData) {
    return await this.logPetMovement({
      ...transferData,
      action: 'transferred'
    });
  }

  /**
   * Log pet status update
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Created audit log entry
   */
  static async logPetStatusUpdate(updateData) {
    return await this.logPetMovement({
      ...updateData,
      action: 'status_updated'
    });
  }

  /**
   * Log pet location change
   * @param {Object} locationData - Location data
   * @returns {Promise<Object>} Created audit log entry
   */
  static async logPetLocationChange(locationData) {
    return await this.logPetMovement({
      ...locationData,
      action: 'location_changed'
    });
  }

  /**
   * Log pet death
   * @param {Object} deathData - Death data
   * @returns {Promise<Object>} Created audit log entry
   */
  static async logPetDeath(deathData) {
    return await this.logPetMovement({
      ...deathData,
      action: 'deceased'
    });
  }

  /**
   * Get audit trail for a specific pet
   * @param {String} petCode - Pet code
   * @returns {Promise<Array>} Audit trail entries
   */
  static async getPetAuditTrail(petCode) {
    try {
      const petRegistry = await PetRegistry.findOne({ petCode })
        .populate('ownershipHistory.previousOwnerId', 'name email')
        .populate('ownershipHistory.newOwnerId', 'name email')
        .populate('ownershipHistory.performedBy', 'name email role');

      if (!petRegistry) {
        throw new Error(`Pet with code ${petCode} not found in registry`);
      }

      // Return both ownership history and audit trail from metadata
      return {
        ownershipHistory: petRegistry.ownershipHistory || [],
        auditTrail: petRegistry.metadata?.auditTrail || []
      };
    } catch (error) {
      console.error('Error getting pet audit trail:', error);
      throw error;
    }
  }

  /**
   * Get all audit entries for a specific user
   * @param {mongoose.Types.ObjectId} userId - User ID
   * @returns {Promise<Array>} Audit entries
   */
  static async getUserAuditEntries(userId) {
    try {
      const pets = await PetRegistry.find({
        $or: [
          { 'ownershipHistory.performedBy': userId },
          { 'metadata.auditTrail.performedBy': userId }
        ]
      }).populate('ownershipHistory.performedBy', 'name email role');

      const auditEntries = [];
      
      for (const pet of pets) {
        // Add ownership history entries
        if (pet.ownershipHistory) {
          for (const entry of pet.ownershipHistory) {
            if (entry.performedBy && entry.performedBy.toString() === userId.toString()) {
              auditEntries.push({
                petCode: pet.petCode,
                petName: pet.name,
                ...entry.toObject(),
                type: 'ownership_history'
              });
            }
          }
        }
        
        // Add audit trail entries from metadata
        if (pet.metadata?.auditTrail) {
          for (const entry of pet.metadata.auditTrail) {
            if (entry.performedBy && entry.performedBy.toString() === userId.toString()) {
              auditEntries.push({
                petCode: pet.petCode,
                petName: pet.name,
                ...entry,
                type: 'audit_trail'
              });
            }
          }
        }
      }

      // Sort by timestamp descending
      auditEntries.sort((a, b) => new Date(b.timestamp || b.transferDate) - new Date(a.timestamp || a.transferDate));
      
      return auditEntries;
    } catch (error) {
      console.error('Error getting user audit entries:', error);
      throw error;
    }
  }

  /**
   * Get audit summary for a pet
   * @param {String} petCode - Pet code
   * @returns {Promise<Object>} Audit summary
   */
  static async getPetAuditSummary(petCode) {
    try {
      const petRegistry = await PetRegistry.findOne({ petCode });
      
      if (!petRegistry) {
        throw new Error(`Pet with code ${petCode} not found in registry`);
      }

      const ownershipHistory = petRegistry.ownershipHistory || [];
      const auditTrail = petRegistry.metadata?.auditTrail || [];
      
      // Count different types of actions
      const actionCounts = {};
      const locations = new Set();
      
      // Count ownership history actions
      for (const entry of ownershipHistory) {
        const action = entry.transferType;
        actionCounts[action] = (actionCounts[action] || 0) + 1;
        if (entry.previousLocation) locations.add(entry.previousLocation);
        if (entry.newLocation) locations.add(entry.newLocation);
      }
      
      // Count audit trail actions
      for (const entry of auditTrail) {
        const action = entry.action;
        actionCounts[action] = (actionCounts[action] || 0) + 1;
        if (entry.fromLocation) locations.add(entry.fromLocation);
        if (entry.toLocation) locations.add(entry.toLocation);
      }

      return {
        petCode: petRegistry.petCode,
        petName: petRegistry.name,
        totalActions: ownershipHistory.length + auditTrail.length,
        actionCounts: actionCounts,
        uniqueLocations: Array.from(locations),
        firstRecorded: petRegistry.firstAddedAt,
        lastActivity: petRegistry.lastSeenAt,
        currentLocation: petRegistry.currentLocation,
        currentStatus: petRegistry.currentStatus,
        isDeceased: petRegistry.isDeceased,
        totalOwners: new Set(ownershipHistory.map(h => h.newOwnerId?.toString())).size
      };
    } catch (error) {
      console.error('Error getting pet audit summary:', error);
      throw error;
    }
  }
}

module.exports = PetAuditService;