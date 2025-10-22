const mongoose = require('mongoose')
const PetRegistry = require('../models/PetRegistry')

/**
 * Pet Registry Service
 * Central place to upsert registry entries from any module (core/adoption/petshop)
 */
const PetRegistryService = {
  /**
   * Upsert by petCode; sets identity and basic attributes
   */
  async upsertIdentity({
    petCode,
    name,
    species,
    breed,
    images = [],
    source,
    corePetId,
    petShopItemId,
    adoptionPetId,
    actorUserId,
    metadata = {},
    firstAddedSource,
    firstAddedBy
  }) {
    if (!petCode) throw new Error('petCode required for registry upsert')
    
    // Handle images: if they're Image model references, extract IDs
    // If they're plain objects with imageId, use those
    // If they're plain objects without imageId, we'll store them as embedded docs (for backward compatibility)
    let imageIds = []
    if (Array.isArray(images) && images.length > 0) {
      // If images are already ObjectIds or have _id, use them
      imageIds = images
        .filter(img => img)
        .map(img => {
          if (typeof img === 'string' || img instanceof require('mongoose').Types.ObjectId) {
            return img
          }
          if (img._id) {
            return img._id
          }
          // For backward compatibility, skip embedded image objects
          return null
        })
        .filter(Boolean)
    }

    const update = {
      name,
      species,
      breed,
      source,
      updatedBy: actorUserId || undefined,
      metadata
    }
    
    // Only update imageIds if we have valid IDs
    if (imageIds.length > 0) {
      update.imageIds = imageIds
    }
    
    if (corePetId) update.corePetId = corePetId
    if (petShopItemId) update.petShopItemId = petShopItemId
    if (adoptionPetId) update.adoptionPetId = adoptionPetId

    // Set source label based on source
    const sourceLabels = {
      'core': 'User Added',
      'petshop': 'Pet Shop',
      'adoption': 'Adoption Center'
    }
    update.sourceLabel = sourceLabels[source] || source

    const insertFields = {
      petCode,
      createdBy: actorUserId || undefined
    }
    
    // Set first added info only on creation
    if (firstAddedSource) {
      insertFields.firstAddedSource = firstAddedSource
      insertFields.firstAddedAt = new Date()
    }
    if (firstAddedBy) {
      insertFields.firstAddedBy = firstAddedBy
    }

    const doc = await PetRegistry.findOneAndUpdate(
      { petCode },
      { $set: update, $setOnInsert: insertFields },
      { new: true, upsert: true }
    ).populate('images')
    
    return doc
  },

  /**
   * Update ownership/location/status for a given petCode
   */
  async updateState({
    petCode,
    currentOwnerId,
    currentLocation,
    currentStatus,
    actorUserId,
    lastTransferAt
  }) {
    if (!petCode) throw new Error('petCode required for registry state update')
    const update = {
      updatedBy: actorUserId || undefined,
      lastSeenAt: new Date()
    }
    if (typeof currentOwnerId !== 'undefined') update.currentOwnerId = currentOwnerId
    if (typeof currentLocation !== 'undefined') update.currentLocation = currentLocation
    if (typeof currentStatus !== 'undefined') update.currentStatus = currentStatus
    if (lastTransferAt) update.lastTransferAt = lastTransferAt

    const doc = await PetRegistry.findOneAndUpdate(
      { petCode },
      { $set: update },
      { new: true }
    )
    return doc
  },

  /**
   * Convenience: upsert identity then apply state change in one call
   */
  async upsertAndSetState(identity, state) {
    const doc = await this.upsertIdentity(identity)
    if (state) {
      await this.updateState({ petCode: identity.petCode, ...state })
    }
    return doc
  },

  /**
   * Record ownership transfer (purchase, adoption, sale)
   */
  async recordOwnershipTransfer({
    petCode,
    previousOwnerId,
    newOwnerId,
    transferType, // 'purchase', 'adoption', 'transfer', 'return'
    transferPrice = 0,
    transferReason = '',
    source = '', // 'petshop', 'adoption', 'user'
    notes = '',
    performedBy
  }) {
    if (!petCode) throw new Error('petCode required for ownership transfer')
    if (!newOwnerId) throw new Error('newOwnerId required for ownership transfer')

    const registry = await PetRegistry.findOne({ petCode })
    if (!registry) throw new Error(`Pet with code ${petCode} not found in registry`)

    // Record the transfer using instance method
    registry.recordOwnershipTransfer({
      previousOwnerId,
      newOwnerId,
      transferType,
      transferPrice,
      transferReason,
      source,
      notes,
      performedBy
    })

    // Update location and status based on transfer type
    if (transferType === 'purchase' || transferType === 'adoption') {
      registry.currentLocation = 'at_owner'
      registry.currentStatus = transferType === 'purchase' ? 'sold' : 'adopted'
    }

    await registry.save()
    return registry
  },

  /**
   * Get complete ownership history for a pet
   */
  async getOwnershipHistory(petCode) {
    if (!petCode) throw new Error('petCode required')
    
    const registry = await PetRegistry.findOne({ petCode })
      .populate('ownershipHistory.previousOwnerId', 'name email')
      .populate('ownershipHistory.newOwnerId', 'name email')
      .populate('ownershipHistory.performedBy', 'name role')
      .populate('firstAddedBy', 'name email')

    if (!registry) throw new Error(`Pet with code ${petCode} not found in registry`)

    return {
      petCode: registry.petCode,
      petName: registry.name,
      firstAddedSource: registry.firstAddedSource,
      firstAddedAt: registry.firstAddedAt,
      firstAddedBy: registry.firstAddedBy,
      sourceLabel: registry.sourceLabel,
      ownershipHistory: registry.ownershipHistory,
      summary: registry.getOwnershipSummary()
    }
  }
}

module.exports = PetRegistryService
