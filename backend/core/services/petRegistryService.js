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
    metadata = {}
  }) {
    if (!petCode) throw new Error('petCode required for registry upsert')

    const update = {
      name,
      species,
      breed,
      source,
      images: Array.isArray(images) ? images : [],
      updatedBy: actorUserId || undefined,
      metadata
    }
    if (corePetId) update.corePetId = corePetId
    if (petShopItemId) update.petShopItemId = petShopItemId
    if (adoptionPetId) update.adoptionPetId = adoptionPetId

    const doc = await PetRegistry.findOneAndUpdate(
      { petCode },
      { $set: update, $setOnInsert: { petCode, createdBy: actorUserId || undefined } },
      { new: true, upsert: true }
    )
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
  }
}

module.exports = PetRegistryService
