const PetRegistryService = require('./petRegistryService');

/**
 * Pet Status Service
 * Handles updating pet locations and statuses with proper tracking
 */
const PetStatusService = {
  /**
   * Move a pet to hospital
   * @param {String} petCode - Pet code
   * @param {Object} options - Options
   * @param {String} options.reason - Reason for hospital admission
   * @param {mongoose.Types.ObjectId} options.performedBy - User who performed the action
   * @param {String} options.notes - Additional notes
   */
  async admitToHospital(petCode, { reason, performedBy, notes }) {
    // Update location and status
    await PetRegistryService.updateLocationAndStatus({
      petCode,
      currentLocation: 'in_hospital',
      currentStatus: 'in_hospital',
      actorUserId: performedBy
    });

    // Record ownership transfer
    const registry = await PetRegistryService.recordOwnershipTransfer({
      petCode,
      newOwnerId: null, // Hospital doesn't own the pet
      transferType: 'hospital_admission',
      transferReason: reason,
      notes: notes,
      performedBy: performedBy
    });

    return registry;
  },

  /**
   * Discharge a pet from hospital
   * @param {String} petCode - Pet code
   * @param {Object} options - Options
   * @param {mongoose.Types.ObjectId} options.ownerId - Owner ID
   * @param {String} options.reason - Reason for discharge
   * @param {mongoose.Types.ObjectId} options.performedBy - User who performed the action
   * @param {String} options.notes - Additional notes
   */
  async dischargeFromHospital(petCode, { ownerId, reason, performedBy, notes }) {
    // Update location and status
    await PetRegistryService.updateLocationAndStatus({
      petCode,
      currentLocation: 'at_owner',
      currentStatus: 'owned',
      actorUserId: performedBy
    });

    // Record ownership transfer
    const registry = await PetRegistryService.recordOwnershipTransfer({
      petCode,
      newOwnerId: ownerId,
      transferType: 'hospital_discharge',
      transferReason: reason,
      notes: notes,
      performedBy: performedBy
    });

    return registry;
  },

  /**
   * Place a pet in temporary care
   * @param {String} petCode - Pet code
   * @param {Object} options - Options
   * @param {String} options.reason - Reason for temporary care
   * @param {mongoose.Types.ObjectId} options.caretakerId - Caretaker ID
   * @param {mongoose.Types.ObjectId} options.performedBy - User who performed the action
   * @param {String} options.notes - Additional notes
   */
  async placeInTemporaryCare(petCode, { reason, caretakerId, performedBy, notes }) {
    // Update location and status
    await PetRegistryService.updateLocationAndStatus({
      petCode,
      currentLocation: 'in_temporary_care',
      currentStatus: 'in_temporary_care',
      actorUserId: performedBy
    });

    // Record ownership transfer
    const registry = await PetRegistryService.recordOwnershipTransfer({
      petCode,
      newOwnerId: caretakerId,
      transferType: 'temporary_care_start',
      transferReason: reason,
      notes: notes,
      performedBy: performedBy
    });

    return registry;
  },

  /**
   * End temporary care and return pet to owner
   * @param {String} petCode - Pet code
   * @param {Object} options - Options
   * @param {mongoose.Types.ObjectId} options.ownerId - Owner ID
   * @param {String} options.reason - Reason for ending temporary care
   * @param {mongoose.Types.ObjectId} options.performedBy - User who performed the action
   * @param {String} options.notes - Additional notes
   */
  async endTemporaryCare(petCode, { ownerId, reason, performedBy, notes }) {
    // Update location and status
    await PetRegistryService.updateLocationAndStatus({
      petCode,
      currentLocation: 'at_owner',
      currentStatus: 'owned',
      actorUserId: performedBy
    });

    // Record ownership transfer
    const registry = await PetRegistryService.recordOwnershipTransfer({
      petCode,
      newOwnerId: ownerId,
      transferType: 'temporary_care_end',
      transferReason: reason,
      notes: notes,
      performedBy: performedBy
    });

    return registry;
  },

  /**
   * Mark a pet as deceased
   * @param {String} petCode - Pet code
   * @param {Object} options - Options
   * @param {String} options.reason - Reason for marking as deceased
   * @param {mongoose.Types.ObjectId} options.performedBy - User who performed the action
   * @param {String} options.notes - Additional notes
   */
  async markAsDeceased(petCode, { reason, performedBy, notes }) {
    // Update location and status
    await PetRegistryService.updateLocationAndStatus({
      petCode,
      currentLocation: 'deceased',
      currentStatus: 'deceased',
      actorUserId: performedBy
    });

    // Record ownership transfer
    const registry = await PetRegistryService.recordOwnershipTransfer({
      petCode,
      newOwnerId: null,
      transferType: 'return', // Using return as the closest match
      transferReason: reason,
      notes: notes,
      performedBy: performedBy
    });

    return registry;
  }
};

module.exports = PetStatusService;