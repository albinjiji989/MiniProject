/**
 * Breed Default Profiles
 * 
 * When a manager creates a pet but doesn't fill in all compatibility fields,
 * these breed-aware defaults are applied instead of generic 3/5 for everything.
 * 
 * This ensures ML models get meaningful features even when data entry is incomplete.
 * 
 * HOW IT WORKS:
 * - If compatibility field is explicitly set → keep manager's value
 * - If field is missing/undefined → use breed-specific default
 * - If breed is unknown → fall back to species-level defaults (Dog/Cat)
 * 
 * NOTE: ML is breed-agnostic (uses these numeric features, not breed names).
 * So these defaults just improve data quality for ML training.
 */

const BREED_DEFAULTS = {
  // === DOGS ===
  'german shepherd': {
    size: 'large', energyLevel: 4, exerciseNeeds: 'high', trainingNeeds: 'moderate',
    trainedLevel: 'intermediate', childFriendlyScore: 7, petFriendlyScore: 5,
    strangerFriendlyScore: 4, needsYard: true, canLiveInApartment: false,
    groomingNeeds: 'moderate', estimatedMonthlyCost: 180, noiseLevel: 'moderate',
    canBeLeftAlone: true, maxHoursAlone: 5, requiresExperiencedOwner: false
  },
  'golden retriever': {
    size: 'large', energyLevel: 4, exerciseNeeds: 'high', trainingNeeds: 'moderate',
    trainedLevel: 'intermediate', childFriendlyScore: 10, petFriendlyScore: 9,
    strangerFriendlyScore: 9, needsYard: true, canLiveInApartment: false,
    groomingNeeds: 'high', estimatedMonthlyCost: 170, noiseLevel: 'moderate',
    canBeLeftAlone: true, maxHoursAlone: 5, requiresExperiencedOwner: false
  },
  'labrador': {
    size: 'large', energyLevel: 4, exerciseNeeds: 'high', trainingNeeds: 'moderate',
    trainedLevel: 'intermediate', childFriendlyScore: 10, petFriendlyScore: 9,
    strangerFriendlyScore: 9, needsYard: true, canLiveInApartment: false,
    groomingNeeds: 'moderate', estimatedMonthlyCost: 160, noiseLevel: 'moderate',
    canBeLeftAlone: true, maxHoursAlone: 5, requiresExperiencedOwner: false
  },
  'french bulldog': {
    size: 'small', energyLevel: 2, exerciseNeeds: 'minimal', trainingNeeds: 'moderate',
    trainedLevel: 'basic', childFriendlyScore: 9, petFriendlyScore: 7,
    strangerFriendlyScore: 8, needsYard: false, canLiveInApartment: true,
    groomingNeeds: 'low', estimatedMonthlyCost: 150, noiseLevel: 'moderate',
    canBeLeftAlone: true, maxHoursAlone: 6, requiresExperiencedOwner: false
  },
  'beagle': {
    size: 'medium', energyLevel: 4, exerciseNeeds: 'high', trainingNeeds: 'high',
    trainedLevel: 'basic', childFriendlyScore: 9, petFriendlyScore: 8,
    strangerFriendlyScore: 8, needsYard: true, canLiveInApartment: false,
    groomingNeeds: 'low', estimatedMonthlyCost: 120, noiseLevel: 'vocal',
    canBeLeftAlone: false, maxHoursAlone: 4, requiresExperiencedOwner: false
  },
  'poodle': {
    size: 'medium', energyLevel: 3, exerciseNeeds: 'moderate', trainingNeeds: 'moderate',
    trainedLevel: 'intermediate', childFriendlyScore: 8, petFriendlyScore: 7,
    strangerFriendlyScore: 7, needsYard: false, canLiveInApartment: true,
    groomingNeeds: 'high', estimatedMonthlyCost: 160, noiseLevel: 'moderate',
    canBeLeftAlone: true, maxHoursAlone: 6, requiresExperiencedOwner: false
  },
  'husky': {
    size: 'large', energyLevel: 5, exerciseNeeds: 'very_high', trainingNeeds: 'high',
    trainedLevel: 'basic', childFriendlyScore: 7, petFriendlyScore: 6,
    strangerFriendlyScore: 7, needsYard: true, canLiveInApartment: false,
    groomingNeeds: 'high', estimatedMonthlyCost: 200, noiseLevel: 'vocal',
    canBeLeftAlone: false, maxHoursAlone: 3, requiresExperiencedOwner: true
  },
  'rottweiler': {
    size: 'large', energyLevel: 3, exerciseNeeds: 'moderate', trainingNeeds: 'high',
    trainedLevel: 'intermediate', childFriendlyScore: 6, petFriendlyScore: 4,
    strangerFriendlyScore: 3, needsYard: true, canLiveInApartment: false,
    groomingNeeds: 'low', estimatedMonthlyCost: 190, noiseLevel: 'moderate',
    canBeLeftAlone: true, maxHoursAlone: 5, requiresExperiencedOwner: true
  },
  'corgi': {
    size: 'small', energyLevel: 4, exerciseNeeds: 'high', trainingNeeds: 'moderate',
    trainedLevel: 'intermediate', childFriendlyScore: 8, petFriendlyScore: 7,
    strangerFriendlyScore: 7, needsYard: false, canLiveInApartment: true,
    groomingNeeds: 'moderate', estimatedMonthlyCost: 120, noiseLevel: 'vocal',
    canBeLeftAlone: true, maxHoursAlone: 6, requiresExperiencedOwner: false
  },
  'border collie': {
    size: 'medium', energyLevel: 5, exerciseNeeds: 'very_high', trainingNeeds: 'high',
    trainedLevel: 'advanced', childFriendlyScore: 7, petFriendlyScore: 6,
    strangerFriendlyScore: 5, needsYard: true, canLiveInApartment: false,
    groomingNeeds: 'moderate', estimatedMonthlyCost: 150, noiseLevel: 'moderate',
    canBeLeftAlone: false, maxHoursAlone: 3, requiresExperiencedOwner: true
  },

  // === CATS ===
  'persian cat': {
    size: 'medium', energyLevel: 1, exerciseNeeds: 'minimal', trainingNeeds: 'low',
    trainedLevel: 'basic', childFriendlyScore: 6, petFriendlyScore: 6,
    strangerFriendlyScore: 4, needsYard: false, canLiveInApartment: true,
    groomingNeeds: 'high', estimatedMonthlyCost: 120, noiseLevel: 'quiet',
    canBeLeftAlone: true, maxHoursAlone: 10, requiresExperiencedOwner: false
  },
  'persian': {
    size: 'medium', energyLevel: 1, exerciseNeeds: 'minimal', trainingNeeds: 'low',
    trainedLevel: 'basic', childFriendlyScore: 6, petFriendlyScore: 6,
    strangerFriendlyScore: 4, needsYard: false, canLiveInApartment: true,
    groomingNeeds: 'high', estimatedMonthlyCost: 120, noiseLevel: 'quiet',
    canBeLeftAlone: true, maxHoursAlone: 10, requiresExperiencedOwner: false
  },
  'british shorthair': {
    size: 'medium', energyLevel: 2, exerciseNeeds: 'minimal', trainingNeeds: 'low',
    trainedLevel: 'basic', childFriendlyScore: 8, petFriendlyScore: 7,
    strangerFriendlyScore: 6, needsYard: false, canLiveInApartment: true,
    groomingNeeds: 'moderate', estimatedMonthlyCost: 100, noiseLevel: 'quiet',
    canBeLeftAlone: true, maxHoursAlone: 10, requiresExperiencedOwner: false
  },
  'siamese': {
    size: 'medium', energyLevel: 4, exerciseNeeds: 'moderate', trainingNeeds: 'moderate',
    trainedLevel: 'basic', childFriendlyScore: 7, petFriendlyScore: 5,
    strangerFriendlyScore: 5, needsYard: false, canLiveInApartment: true,
    groomingNeeds: 'low', estimatedMonthlyCost: 100, noiseLevel: 'vocal',
    canBeLeftAlone: true, maxHoursAlone: 8, requiresExperiencedOwner: false
  },
  'maine coon': {
    size: 'large', energyLevel: 3, exerciseNeeds: 'moderate', trainingNeeds: 'moderate',
    trainedLevel: 'basic', childFriendlyScore: 9, petFriendlyScore: 8,
    strangerFriendlyScore: 7, needsYard: false, canLiveInApartment: true,
    groomingNeeds: 'high', estimatedMonthlyCost: 140, noiseLevel: 'moderate',
    canBeLeftAlone: true, maxHoursAlone: 8, requiresExperiencedOwner: false
  },
  'ragdoll': {
    size: 'large', energyLevel: 2, exerciseNeeds: 'minimal', trainingNeeds: 'low',
    trainedLevel: 'basic', childFriendlyScore: 9, petFriendlyScore: 8,
    strangerFriendlyScore: 8, needsYard: false, canLiveInApartment: true,
    groomingNeeds: 'high', estimatedMonthlyCost: 130, noiseLevel: 'quiet',
    canBeLeftAlone: true, maxHoursAlone: 8, requiresExperiencedOwner: false
  },
  'bengal': {
    size: 'medium', energyLevel: 5, exerciseNeeds: 'high', trainingNeeds: 'moderate',
    trainedLevel: 'basic', childFriendlyScore: 7, petFriendlyScore: 5,
    strangerFriendlyScore: 5, needsYard: false, canLiveInApartment: true,
    groomingNeeds: 'low', estimatedMonthlyCost: 120, noiseLevel: 'vocal',
    canBeLeftAlone: true, maxHoursAlone: 6, requiresExperiencedOwner: true
  },
};

// Species-level fallbacks (when breed is unknown)
const SPECIES_DEFAULTS = {
  'dog': {
    size: 'medium', energyLevel: 3, exerciseNeeds: 'moderate', trainingNeeds: 'moderate',
    trainedLevel: 'basic', childFriendlyScore: 6, petFriendlyScore: 5,
    strangerFriendlyScore: 5, needsYard: false, canLiveInApartment: true,
    groomingNeeds: 'moderate', estimatedMonthlyCost: 150, noiseLevel: 'moderate',
    canBeLeftAlone: true, maxHoursAlone: 6, requiresExperiencedOwner: false
  },
  'cat': {
    size: 'small', energyLevel: 2, exerciseNeeds: 'minimal', trainingNeeds: 'low',
    trainedLevel: 'basic', childFriendlyScore: 6, petFriendlyScore: 5,
    strangerFriendlyScore: 5, needsYard: false, canLiveInApartment: true,
    groomingNeeds: 'moderate', estimatedMonthlyCost: 100, noiseLevel: 'quiet',
    canBeLeftAlone: true, maxHoursAlone: 10, requiresExperiencedOwner: false
  },
};

/**
 * Get breed-specific (or species-level) defaults for a compatibility profile.
 * 
 * @param {string} breed - Pet breed name
 * @param {string} species - Pet species name
 * @returns {Object} Default compatibility profile fields
 */
function getBreedDefaults(breed, species) {
  const breedKey = (breed || '').toLowerCase().trim();
  const speciesKey = (species || '').toLowerCase().trim();
  
  return BREED_DEFAULTS[breedKey] || SPECIES_DEFAULTS[speciesKey] || SPECIES_DEFAULTS['dog'];
}

/**
 * Apply breed defaults to a compatibility profile, only filling in MISSING fields.
 * Fields explicitly set by the manager are NEVER overwritten.
 * 
 * @param {Object} compatProfile - Existing compatibility profile (may be partial)
 * @param {string} breed - Pet breed
 * @param {string} species - Pet species
 * @returns {Object} Complete compatibility profile with defaults filled
 */
function applyBreedDefaults(compatProfile, breed, species) {
  const defaults = getBreedDefaults(breed, species);
  const merged = { ...(compatProfile || {}) };
  
  // Only fill in fields that are null, undefined, or missing
  for (const [key, defaultVal] of Object.entries(defaults)) {
    if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
      merged[key] = defaultVal;
    }
  }
  
  return merged;
}

module.exports = {
  BREED_DEFAULTS,
  SPECIES_DEFAULTS,
  getBreedDefaults,
  applyBreedDefaults
};
