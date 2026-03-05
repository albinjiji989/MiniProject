/**
 * ML Seed Data Controller
 * 
 * Internal endpoint (no auth) that provides real data from MongoDB
 * for Python ML service to use during bootstrap training.
 * 
 * Instead of training on 100% synthetic data, Python calls this on startup
 * to get:
 * - Real pets from database (for K-Means clustering)
 * - Real user adoption profiles (for XGBoost feature patterns)
 * - Real user-pet interactions (for SVD collaborative filtering)
 * 
 * This eliminates the "fake data" problem: models train on actual data
 * from your database from day one.
 */

const AdoptionPet = require('../manager/models/AdoptionPet');
const User = require('../../../core/models/User');
const UserPetInteraction = require('../models/UserPetInteraction');
const MLTrainingData = require('../models/MLTrainingData');

/**
 * Internal API key for ML service communication.
 * Set ML_INTERNAL_KEY in .env, or uses a default for local dev.
 * Python sends this in the X-Internal-Key header.
 */
const ML_INTERNAL_KEY = process.env.ML_INTERNAL_KEY || 'petconnect-ml-internal-2024';

/**
 * GET /api/adoption/internal/ml-seed-data
 * 
 * Returns real data from MongoDB for ML bootstrap training.
 * Protected by internal API key (not user auth — Python → Node on localhost).
 */
exports.getSeedData = async (req, res) => {
  try {
    // Verify internal API key
    const providedKey = req.headers['x-internal-key'];
    if (providedKey !== ML_INTERNAL_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid internal API key' });
    }
    
    const startTime = Date.now();
    
    // ---- 1. Real Pets (for K-Means) ----
    // Get ALL pets (including adopted ones) for richer clustering data
    const pets = await AdoptionPet.find({
      isActive: true,
      isDeleted: { $ne: true }
    })
    .select('name species breed compatibilityProfile temperamentTags status')
    .lean();

    const petProfiles = pets
      .filter(p => p.compatibilityProfile)  // Only pets with compatibility data
      .map(p => ({
        _id: p._id.toString(),
        name: p.name || 'Unknown',
        species: p.species || 'Dog',
        breed: p.breed || 'Mixed',
        status: p.status,
        compatibilityProfile: {
          energyLevel: Number(p.compatibilityProfile.energyLevel) || 3,
          size: p.compatibilityProfile.size || 'medium',
          trainedLevel: p.compatibilityProfile.trainedLevel || 'basic',
          childFriendlyScore: Number(p.compatibilityProfile.childFriendlyScore) || 5,
          petFriendlyScore: Number(p.compatibilityProfile.petFriendlyScore) || 5,
          noiseLevel: p.compatibilityProfile.noiseLevel || 'moderate',
          exerciseNeeds: p.compatibilityProfile.exerciseNeeds || 'moderate',
          groomingNeeds: p.compatibilityProfile.groomingNeeds || 'moderate',
          canLiveInApartment: p.compatibilityProfile.canLiveInApartment !== false,
          needsYard: Boolean(p.compatibilityProfile.needsYard),
          canBeLeftAlone: p.compatibilityProfile.canBeLeftAlone !== false,
          maxHoursAlone: Number(p.compatibilityProfile.maxHoursAlone) || 6,
          estimatedMonthlyCost: Number(p.compatibilityProfile.estimatedMonthlyCost) || 100,
          strangerFriendlyScore: Number(p.compatibilityProfile.strangerFriendlyScore) || 5,
          temperamentTags: p.compatibilityProfile.temperamentTags || p.temperamentTags || []
        }
      }));

    // ---- 2. Real Users with Adoption Profiles (for XGBoost) ----
    const users = await User.find({
      'adoptionProfile.profileComplete': true,
      isActive: true
    })
    .select('adoptionProfile')
    .lean();

    const userProfiles = users.map(u => {
      const ap = u.adoptionProfile || {};
      return {
        userId: u._id.toString(),
        homeType: ap.homeType || 'house',
        homeSize: Number(ap.homeSize) || 1000,
        hasYard: Boolean(ap.hasYard),
        yardSize: ap.yardSize || 'none',
        activityLevel: Number(ap.activityLevel) || 3,
        workSchedule: ap.workSchedule || 'full_time',
        hoursAlonePerDay: Number(ap.hoursAlonePerDay) || 8,
        experienceLevel: ap.experienceLevel || 'first_time',
        previousPets: Array.isArray(ap.previousPets) ? ap.previousPets.length : Number(ap.previousPets) || 0,
        hasChildren: Boolean(ap.hasChildren),
        hasOtherPets: Boolean(ap.hasOtherPets),
        monthlyBudget: Number(ap.monthlyBudget) || 100,
        maxAdoptionFee: Number(ap.maxAdoptionFee) || 500,
        preferredSize: Array.isArray(ap.preferredSize) && ap.preferredSize.length > 0
          ? ap.preferredSize[0] : (ap.preferredSize || 'medium'),
        preferredSpecies: ap.preferredSpecies || 'Dog'
      };
    });

    // ---- 3. Real Interactions (for SVD) ----
    // Get real user-pet interactions (views, favorites, clicks, applications)
    const interactions = await UserPetInteraction.find({
      petId: { $ne: null },
      interactionType: { $in: ['viewed', 'favorited', 'applied', 'adopted', 'clicked'] }
    })
    .sort({ timestamp: -1 })
    .limit(1000)  // Cap at 1000 most recent interactions
    .lean();

    const svdInteractions = interactions.map(i => ({
      userId: i.userId.toString(),
      petId: i.petId.toString(),
      interactionType: i.interactionType,
      implicitRating: i.implicitRating || _ratingFromType(i.interactionType),
      timestamp: i.timestamp ? new Date(i.timestamp).toISOString() : new Date().toISOString()
    }));

    // ---- 4. Real Adoption Outcomes (for XGBoost supervised labels) ----
    const trainingRecords = await MLTrainingData.find({ dataType: 'real' })
      .sort({ createdAt: -1 })
      .lean();

    const xgboostRecords = trainingRecords.map(d => ({
      userProfile: _normalizeUserProfile(d.userProfileSnapshot || {}),
      petProfile: _normalizePetProfile(d.petProfileSnapshot || {}),
      matchScore: d.matchScore || 50,
      successfulAdoption: d.successfulAdoption !== false
    }));

    const elapsed = Date.now() - startTime;

    console.log(`📦 ML Seed Data served: ${petProfiles.length} pets, ${userProfiles.length} users, ${svdInteractions.length} interactions, ${xgboostRecords.length} outcomes (${elapsed}ms)`);

    res.json({
      success: true,
      data: {
        pets: petProfiles,
        users: userProfiles,
        interactions: svdInteractions,
        adoptionOutcomes: xgboostRecords,
        counts: {
          pets: petProfiles.length,
          users: userProfiles.length,
          interactions: svdInteractions.length,
          adoptionOutcomes: xgboostRecords.length
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('ML Seed Data error:', error?.message || error);
    res.status(500).json({ success: false, error: error.message });
  }
};

function _ratingFromType(type) {
  const map = { viewed: 1, clicked: 1.5, favorited: 3, applied: 4, adopted: 5, returned: 0 };
  return map[type] || 1;
}

function _normalizeUserProfile(profile) {
  return {
    homeType: profile.homeType || 'house',
    homeSize: Number(profile.homeSize) || 1000,
    hasYard: Boolean(profile.hasYard),
    yardSize: profile.yardSize || 'none',
    activityLevel: Number(profile.activityLevel) || 3,
    workSchedule: profile.workSchedule || 'full_time',
    hoursAlonePerDay: Number(profile.hoursAlonePerDay) || 8,
    experienceLevel: profile.experienceLevel || 'first_time',
    previousPets: Array.isArray(profile.previousPets) ? profile.previousPets.length : Number(profile.previousPets) || 0,
    hasChildren: Boolean(profile.hasChildren),
    hasOtherPets: Boolean(profile.hasOtherPets),
    monthlyBudget: Number(profile.monthlyBudget) || 100,
    maxAdoptionFee: Number(profile.maxAdoptionFee) || 500,
    preferredSize: Array.isArray(profile.preferredSize) && profile.preferredSize.length > 0
      ? profile.preferredSize[0] : (profile.preferredSize || 'medium'),
    preferredSpecies: profile.preferredSpecies || 'Dog'
  };
}

function _normalizePetProfile(profile) {
  return {
    energyLevel: Number(profile.energyLevel) || 3,
    size: profile.size || 'medium',
    trainedLevel: profile.trainedLevel || 'basic',
    childFriendlyScore: Number(profile.childFriendlyScore) || 5,
    petFriendlyScore: Number(profile.petFriendlyScore) || 5,
    noiseLevel: profile.noiseLevel || 'moderate',
    exerciseNeeds: profile.exerciseNeeds || 'moderate',
    groomingNeeds: profile.groomingNeeds || 'moderate',
    canLiveInApartment: profile.canLiveInApartment !== false,
    needsYard: Boolean(profile.needsYard),
    canBeLeftAlone: profile.canBeLeftAlone !== false,
    maxHoursAlone: Number(profile.maxHoursAlone) || 6,
    estimatedMonthlyCost: Number(profile.estimatedMonthlyCost) || 100,
    strangerFriendlyScore: Number(profile.strangerFriendlyScore) || 5,
    temperamentTags: Array.isArray(profile.temperamentTags) ? profile.temperamentTags : []
  };
}
