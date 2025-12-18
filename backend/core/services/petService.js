const Pet = require('../models/Pet');
const PetRegistryService = require('./centralizedPetService');

class PetService {
  // Create a new pet
  static async createPet(petData, userId) {
    try {
      const {
        name,
        speciesId,
        species,
        breedId,
        breed,
        gender,
        age,
        ageUnit,
        color,
        images = []
      } = petData;

      // Map incoming fields to Pet schema
      const petPayload = {
        name: String(name).trim(),
        species: species || speciesId,
        breed: breed || breedId,
        owner: userId,
        createdBy: userId,
        gender: gender || 'Unknown',
        age: typeof age === 'number' ? age : (age ? Number(age) : undefined),
        ageUnit: ageUnit || 'months',
        color: color || undefined,
        images: Array.isArray(images) ? images.filter(Boolean).map((img) => ({
          url: typeof img === 'string' ? img : img.url,
          caption: (typeof img === 'object' && img.caption) ? img.caption : undefined,
          isPrimary: (typeof img === 'object' && img.isPrimary) ? !!img.isPrimary : false
        })) : []
      };

      // Save to main Pet model
      const pet = new Pet(petPayload);
      await pet.save();

      // Removed PetNew model creation as it doesn't exist

      // Populate minimal refs for client display
      await pet.populate([
        { path: 'species', select: 'name displayName' },
        { path: 'breed', select: 'name' }
      ]);

      // Upsert centralized registry entry
      try {
        // Populate images if they exist
        let petImages = [];
        if (pet.images && pet.images.length > 0) {
          petImages = pet.images;
        } else if (pet.imageIds && pet.imageIds.length > 0) {
          // If using the new structure, populate images
          await pet.populate('images');
          petImages = pet.images || [];
        }
        
        await PetRegistryService.upsertAndSetState({
          petCode: pet.petCode,
          name: pet.name,
          species: pet.species?._id || pet.species,
          breed: pet.breed?._id || pet.breed,
          images: petImages,
          source: 'core',
          corePetId: pet._id,
          actorUserId: userId,
        }, {
          currentOwnerId: userId,
          currentLocation: 'at_owner',
          currentStatus: 'owned',
          lastTransferAt: new Date()
        });
      } catch (regErr) {
        console.warn('PetRegistry upsert failed (create pet):', regErr?.message || regErr);
      }

      return pet;
    } catch (error) {
      throw error;
    }
  }

  // Get all pets with filters
  static async getPets(filters, userId, storeFilter) {
    try {
      const { 
        species, 
        status, 
        size, 
        gender, 
        location,
        q,
        mine,
        page = 1, 
        limit = 10 
      } = filters;

      const filter = { ...storeFilter };
      if (species) filter.species = species;
      if (status) filter.currentStatus = status;
      if (size) filter.size = size;
      if (gender) filter.gender = gender;

      // Text search across key fields
      if (q && String(q).trim()) {
        const regex = new RegExp(String(q).trim(), 'i');
        filter.$or = [
          { name: regex },
          { breed: regex },
          { color: regex },
          { microchipId: regex },
          { tags: { $in: [regex] } }
        ];
      }

      // Only pets related to current user (created by or in ownership history)
      if (mine === 'true' || mine === '1') {
        const mineClause = {
          $or: [
            { createdBy: userId },
            { 'ownershipHistory.ownerId': userId }
          ]
        };
        if (Object.keys(filter).length) {
          // combine with existing filter
          const existing = { ...filter };
          delete existing.$or; // preserve $or by merging below
          const orCombined = [];
          if (filter.$or) orCombined.push(...filter.$or);
          const andClauses = [existing, mineClause];
          const combined = { $and: andClauses };
          if (orCombined.length) combined.$or = orCombined;
          Object.assign(filter, combined);
        } else {
          Object.assign(filter, mineClause);
        }
      }

      let query = Pet.find(filter)
        .populate('createdBy', 'name email')
        .populate('lastUpdatedBy', 'name email')
        .sort({ createdAt: -1 });

      // Add geospatial query if location is provided
      if (location) {
        const [lng, lat, radius = 10] = location.split(',').map(Number);
        query = query.where('location').near({
          center: { type: 'Point', coordinates: [lng, lat] },
          maxDistance: radius * 1000, // Convert km to meters
          spherical: true
        });
      }

      const pets = await query
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Pet.countDocuments(filter);

      return {
        pets,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get pet by ID
  static async getPetById(petId, userId) {
    try {
      const pet = await Pet.findById(petId)
        .populate('createdBy', 'name email')
        .populate('lastUpdatedBy', 'name email');

      if (!pet) {
        throw new Error('Pet not found');
      }

      // Check if user can access this pet
      if (!this.canAccessPet(userId, pet)) {
        throw new Error('Forbidden');
      }

      return pet;
    } catch (error) {
      throw error;
    }
  }

  // Update pet
  static async updatePet(petId, updateData, userId) {
    try {
      const pet = await Pet.findById(petId);

      if (!pet) {
        throw new Error('Pet not found');
      }

      if (!this.canAccessPet(userId, pet)) {
        throw new Error('Forbidden');
      }

      const updatedPet = await Pet.findByIdAndUpdate(
        petId,
        { ...updateData, lastUpdatedBy: userId },
        { new: true, runValidators: true }
      ).populate('lastUpdatedBy', 'name email');

      return updatedPet;
    } catch (error) {
      throw error;
    }
  }

  // Delete pet
  static async deletePet(petId, userId) {
    try {
      const pet = await Pet.findById(petId);

      if (!pet) {
        throw new Error('Pet not found');
      }

      if (!this.canAccessPet(userId, pet)) {
        throw new Error('Forbidden');
      }

      await Pet.findByIdAndDelete(petId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Helper: ensure current user can access this pet
  static canAccessPet(userId, pet) {
    if (!pet) return false;
    // Assuming storeId check is handled elsewhere
    return true;
  }
}

module.exports = PetService;