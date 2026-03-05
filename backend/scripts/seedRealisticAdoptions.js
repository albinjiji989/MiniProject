/**
 * Realistic Adoption Seed Script
 * 
 * Creates realistic fake adoption data based on real-world patterns:
 * - Real-world user profiles (families, singles, retirees, etc.)
 * - Pets with INDIVIDUAL personalities (same breed, different character)
 * - Realistic adoption matching (good matches succeed, bad matches fail)
 * - Breed-specific tendencies but with individual variation
 * 
 * BREEDS: German Shepherd, Golden Retriever, Persian Cat, British Shorthair
 * Each pet has a UNIQUE personality even within the same breed.
 * 
 * Usage:
 *   cd backend
 *   node scripts/seedRealisticAdoptions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
const User = require('../core/models/User');
const MLTrainingData = require('../modules/adoption/models/MLTrainingData');
const UserPetInteraction = require('../modules/adoption/models/UserPetInteraction');
const bcrypt = require('bcryptjs');

// ============================================================================
// BREED KNOWLEDGE BASE
// Real-world breed tendencies from which individual pets VARY
// ============================================================================

/**
 * Each breed has a BASE personality profile.
 * Individual pets DEVIATE from this base randomly, because:
 * - Every German Shepherd is different
 * - A lazy Golden Retriever exists
 * - Some Persians are energetic
 * 
 * The compatibilityProfile features (energy, child-friendly, etc.) 
 * are what ML actually uses — NOT the breed name.
 * So when admin adds "Husky" later, its features will cluster naturally
 * with similar-energy pets. No retraining needed.
 */
const BREED_BASE_PROFILES = {
  'German Shepherd': {
    species: 'Dog',
    size: 'large',
    baseEnergy: 4,
    baseChildFriendly: 7,
    basePetFriendly: 5,
    baseStrangerFriendly: 4,
    baseTrainedLevel: 'intermediate',
    baseExerciseNeeds: 'high',
    baseGroomingNeeds: 'moderate',
    baseNoiseLevel: 'moderate',
    baseNeedsYard: true,
    baseCanLiveInApartment: false,
    baseCanBeLeftAlone: true,
    baseMaxHoursAlone: 5,
    baseMonthlyCost: 180,
    baseRequiresExperienced: false,
    weightRange: [25, 40],
    typicalTemperaments: ['loyal', 'protective', 'intelligent', 'alert', 'confident', 'obedient', 'watchful'],
    colors: ['Black and Tan', 'Sable', 'All Black', 'Black and Red'],
  },
  'Golden Retriever': {
    species: 'Dog',
    size: 'large',
    baseEnergy: 4,
    baseChildFriendly: 10,
    basePetFriendly: 9,
    baseStrangerFriendly: 9,
    baseTrainedLevel: 'intermediate',
    baseExerciseNeeds: 'high',
    baseGroomingNeeds: 'high',
    baseNoiseLevel: 'moderate',
    baseNeedsYard: true,
    baseCanLiveInApartment: false,
    baseCanBeLeftAlone: true,
    baseMaxHoursAlone: 5,
    baseMonthlyCost: 170,
    baseRequiresExperienced: false,
    weightRange: [25, 35],
    typicalTemperaments: ['friendly', 'gentle', 'playful', 'devoted', 'patient', 'eager-to-please', 'social'],
    colors: ['Golden', 'Light Golden', 'Dark Golden', 'Cream'],
  },
  'Persian Cat': {
    species: 'Cat',
    size: 'medium',
    baseEnergy: 1,
    baseChildFriendly: 6,
    basePetFriendly: 6,
    baseStrangerFriendly: 4,
    baseTrainedLevel: 'basic',
    baseExerciseNeeds: 'minimal',
    baseGroomingNeeds: 'high',
    baseNoiseLevel: 'quiet',
    baseNeedsYard: false,
    baseCanLiveInApartment: true,
    baseCanBeLeftAlone: true,
    baseMaxHoursAlone: 10,
    baseMonthlyCost: 120,
    baseRequiresExperienced: false,
    weightRange: [3, 6],
    typicalTemperaments: ['calm', 'affectionate', 'quiet', 'gentle', 'docile', 'reserved', 'lap-cat'],
    colors: ['White', 'Silver', 'Blue', 'Cream', 'Black Smoke'],
  },
  'British Shorthair': {
    species: 'Cat',
    size: 'medium',
    baseEnergy: 2,
    baseChildFriendly: 8,
    basePetFriendly: 7,
    baseStrangerFriendly: 6,
    baseTrainedLevel: 'basic',
    baseExerciseNeeds: 'minimal',
    baseGroomingNeeds: 'moderate',
    baseNoiseLevel: 'quiet',
    baseNeedsYard: false,
    baseCanLiveInApartment: true,
    baseCanBeLeftAlone: true,
    baseMaxHoursAlone: 10,
    baseMonthlyCost: 100,
    baseRequiresExperienced: false,
    weightRange: [4, 8],
    typicalTemperaments: ['easygoing', 'calm', 'adaptable', 'independent', 'loyal', 'patient', 'dignified'],
    colors: ['Blue', 'Lilac', 'Cream', 'Silver Tabby', 'White'],
  },
};

// ============================================================================
// INDIVIDUAL PET DEFINITIONS (unique personalities within breeds)
// ============================================================================

const PET_DEFINITIONS = [
  // --- German Shepherds (5 with DIFFERENT personalities) ---
  {
    name: 'Rex', breed: 'German Shepherd', age: { years: 2 }, gender: 'male',
    personality: 'classic_protector',
    overrides: { energy: 5, childFriendly: 6, strangerFriendly: 3, trainedLevel: 'advanced', noiseLevel: 'vocal' },
    temperaments: ['protective', 'loyal', 'alert', 'watchful', 'courageous'],
    description: 'Rex is a classic German Shepherd - fiercely loyal and protective. He bonds deeply with his family but is cautious with strangers. Needs an experienced handler.',
    requiresExperienced: true
  },
  {
    name: 'Luna', breed: 'German Shepherd', age: { years: 1, months: 6 }, gender: 'female',
    personality: 'gentle_giant',
    overrides: { energy: 3, childFriendly: 9, strangerFriendly: 7, petFriendly: 8, trainedLevel: 'intermediate' },
    temperaments: ['gentle', 'calm', 'friendly', 'patient', 'obedient'],
    description: 'Luna breaks the stereotype - she is an unusually gentle and calm GSD who loves children and other pets. Perfect family dog.'
  },
  {
    name: 'Thor', breed: 'German Shepherd', age: { years: 4 }, gender: 'male',
    personality: 'high_drive_working',
    overrides: { energy: 5, childFriendly: 4, petFriendly: 3, exerciseNeeds: 'very_high', trainedLevel: 'advanced', canBeLeftAlone: false, maxHoursAlone: 2 },
    temperaments: ['driven', 'intense', 'intelligent', 'focused', 'energetic'],
    description: 'Thor is a high-drive working line GSD. He needs a job to do. Not ideal for first-time owners or small children. Best for active, experienced owners.',
    requiresExperienced: true
  },
  {
    name: 'Bella', breed: 'German Shepherd', age: { months: 8 }, gender: 'female',
    personality: 'playful_puppy',
    overrides: { energy: 5, childFriendly: 8, petFriendly: 7, strangerFriendly: 8, trainedLevel: 'untrained', groomingNeeds: 'low', maxHoursAlone: 3 },
    temperaments: ['playful', 'curious', 'social', 'bouncy', 'clumsy'],
    description: 'Bella is a bouncy GSD puppy who loves everyone and everything. She needs training and patience but will be an amazing companion.'
  },
  {
    name: 'Shadow', breed: 'German Shepherd', age: { years: 7 }, gender: 'male',
    personality: 'senior_calm',
    overrides: { energy: 2, childFriendly: 8, petFriendly: 7, strangerFriendly: 6, trainedLevel: 'advanced', exerciseNeeds: 'moderate', noiseLevel: 'quiet', maxHoursAlone: 6, monthlyCost: 220 },
    temperaments: ['calm', 'wise', 'loyal', 'gentle', 'relaxed'],
    description: 'Shadow is a wise senior GSD who has settled into a calm, dignified personality. Low energy but very loyal. May have higher vet costs due to age.'
  },

  // --- Golden Retrievers (5 with different personalities) ---
  {
    name: 'Buddy', breed: 'Golden Retriever', age: { years: 3 }, gender: 'male',
    personality: 'classic_golden',
    overrides: { energy: 4, childFriendly: 10, petFriendly: 10, strangerFriendly: 10, trainedLevel: 'intermediate' },
    temperaments: ['friendly', 'gentle', 'devoted', 'social', 'eager-to-please'],
    description: 'Buddy is the quintessential Golden - friendly to absolutely everyone. He lives to make people happy.'
  },
  {
    name: 'Daisy', breed: 'Golden Retriever', age: { years: 1 }, gender: 'female',
    personality: 'hyper_athletic',
    overrides: { energy: 5, exerciseNeeds: 'very_high', childFriendly: 8, trainedLevel: 'basic', canBeLeftAlone: false, maxHoursAlone: 3 },
    temperaments: ['energetic', 'athletic', 'playful', 'exuberant', 'restless'],
    description: 'Daisy is a high-energy Golden who needs serious exercise. She will destroy furniture if bored. Needs an active owner with a yard.'
  },
  {
    name: 'Max', breed: 'Golden Retriever', age: { years: 5 }, gender: 'male',
    personality: 'therapy_dog',
    overrides: { energy: 2, childFriendly: 10, petFriendly: 9, strangerFriendly: 10, trainedLevel: 'advanced', exerciseNeeds: 'moderate', noiseLevel: 'quiet', maxHoursAlone: 7 },
    temperaments: ['calm', 'empathetic', 'patient', 'gentle', 'intuitive'],
    description: 'Max is a former therapy dog. Incredibly gentle and intuitive around people. Low energy, high affection. Perfect for families or elderly.'
  },
  {
    name: 'Charlie', breed: 'Golden Retriever', age: { months: 5 }, gender: 'male',
    personality: 'wild_puppy',
    overrides: { energy: 5, childFriendly: 7, petFriendly: 8, trainedLevel: 'untrained', exerciseNeeds: 'very_high', noiseLevel: 'vocal', canBeLeftAlone: false, maxHoursAlone: 2 },
    temperaments: ['wild', 'playful', 'mouthy', 'curious', 'destructive'],
    description: 'Charlie is a Golden puppy with LOTS of energy. He chews everything, jumps on people, and needs significant training. Adorable but a handful.'
  },
  {
    name: 'Goldie', breed: 'Golden Retriever', age: { years: 8 }, gender: 'female',
    personality: 'senior_sweetheart',
    overrides: { energy: 1, childFriendly: 10, petFriendly: 8, trainedLevel: 'advanced', exerciseNeeds: 'minimal', noiseLevel: 'quiet', maxHoursAlone: 8, monthlyCost: 230 },
    temperaments: ['sweet', 'mellow', 'affectionate', 'loyal', 'gentle'],
    description: 'Goldie is a senior Golden who just wants a warm lap and a quiet home. Very low maintenance but may need more vet visits. Pure love.'
  },

  // --- Persian Cats (5 with different personalities) ---
  {
    name: 'Princess', breed: 'Persian Cat', age: { years: 3 }, gender: 'female',
    personality: 'classic_persian',
    overrides: { energy: 1, childFriendly: 5, petFriendly: 4, strangerFriendly: 3, noiseLevel: 'quiet', groomingNeeds: 'high' },
    temperaments: ['regal', 'aloof', 'calm', 'quiet', 'reserved'],
    description: 'Princess is a classic Persian - elegant and aloof. She prefers a quiet home with adults only. Daily grooming is a must.'
  },
  {
    name: 'Mochi', breed: 'Persian Cat', age: { years: 1 }, gender: 'male',
    personality: 'playful_persian',
    overrides: { energy: 3, childFriendly: 8, petFriendly: 8, strangerFriendly: 7, trainedLevel: 'basic', noiseLevel: 'moderate' },
    temperaments: ['playful', 'curious', 'social', 'affectionate', 'mischievous'],
    description: 'Mochi defies Persian stereotypes - he is playful, social, and loves children. A surprisingly active cat for the breed.'
  },
  {
    name: 'Pearl', breed: 'Persian Cat', age: { years: 6 }, gender: 'female',
    personality: 'anxious_persian',
    overrides: { energy: 1, childFriendly: 2, petFriendly: 2, strangerFriendly: 1, canBeLeftAlone: false, maxHoursAlone: 4 },
    temperaments: ['nervous', 'shy', 'sensitive', 'anxious', 'hiding'],
    description: 'Pearl is a rescued Persian with anxiety. She hides from children and loud noises. Needs a patient, quiet owner with NO kids or other pets.',
    requiresExperienced: true
  },
  {
    name: 'Simba', breed: 'Persian Cat', age: { years: 2 }, gender: 'male',
    personality: 'lap_cat',
    overrides: { energy: 1, childFriendly: 7, petFriendly: 6, strangerFriendly: 6, trainedLevel: 'basic', maxHoursAlone: 9 },
    temperaments: ['cuddly', 'lazy', 'affectionate', 'docile', 'lap-cat'],
    description: 'Simba is the ultimate lap cat. He spends 20 hours a day sleeping and the rest purring on someone\'s lap. Easy-going and low maintenance (except grooming).'
  },
  {
    name: 'Cleo', breed: 'Persian Cat', age: { years: 4 }, gender: 'female',
    personality: 'independent_queen',
    overrides: { energy: 2, childFriendly: 4, petFriendly: 3, strangerFriendly: 3, canBeLeftAlone: true, maxHoursAlone: 12 },
    temperaments: ['independent', 'proud', 'territorial', 'dignified', 'solitary'],
    description: 'Cleo is an independent, territorial Persian. She does NOT like other cats. Best as the only pet in a quiet household.'
  },

  // --- British Shorthairs (5 with different personalities) ---
  {
    name: 'Winston', breed: 'British Shorthair', age: { years: 3 }, gender: 'male',
    personality: 'classic_british',
    overrides: { energy: 2, childFriendly: 8, petFriendly: 7, strangerFriendly: 6, trainedLevel: 'basic' },
    temperaments: ['easygoing', 'calm', 'dignified', 'patient', 'adaptable'],
    description: 'Winston is a classic British Shorthair - calm, dignified, and adaptable. Gets along with everyone. The perfect apartment cat.'
  },
  {
    name: 'Nala', breed: 'British Shorthair', age: { months: 6 }, gender: 'female',
    personality: 'kitten_energy',
    overrides: { energy: 4, childFriendly: 9, petFriendly: 9, strangerFriendly: 8, trainedLevel: 'untrained', noiseLevel: 'moderate', canBeLeftAlone: false, maxHoursAlone: 4 },
    temperaments: ['playful', 'curious', 'energetic', 'social', 'adventurous'],
    description: 'Nala is a kitten with boundless energy. She plays with everything and everyone. She will calm down with age but needs attention now.'
  },
  {
    name: 'Oscar', breed: 'British Shorthair', age: { years: 5 }, gender: 'male',
    personality: 'couch_potato',
    overrides: { energy: 1, childFriendly: 9, petFriendly: 8, strangerFriendly: 7, trainedLevel: 'basic', exerciseNeeds: 'minimal', maxHoursAlone: 12, noiseLevel: 'quiet' },
    temperaments: ['lazy', 'gentle', 'tolerant', 'easygoing', 'sleepy'],
    description: 'Oscar is the laziest cat you will ever meet. He tolerates everything including toddlers climbing on him. Zero maintenance personality.'
  },
  {
    name: 'Misty', breed: 'British Shorthair', age: { years: 2 }, gender: 'female',
    personality: 'shy_sweetheart',
    overrides: { energy: 2, childFriendly: 5, petFriendly: 4, strangerFriendly: 2, maxHoursAlone: 8 },
    temperaments: ['shy', 'sweet', 'timid', 'loving', 'cautious'],
    description: 'Misty is shy with strangers but incredibly sweet once she trusts you. She needs a calm environment and patient owner.'
  },
  {
    name: 'Leo', breed: 'British Shorthair', age: { years: 1 }, gender: 'male',
    personality: 'confident_hunter',
    overrides: { energy: 3, childFriendly: 7, petFriendly: 5, strangerFriendly: 5, exerciseNeeds: 'moderate', noiseLevel: 'moderate' },
    temperaments: ['confident', 'hunter', 'athletic', 'bold', 'independent'],
    description: 'Leo is an unusually active British Shorthair with a strong hunting instinct. He wants to play and chase toys constantly. Not your typical lazy cat.'
  },
];

// ============================================================================
// USER DEFINITIONS (real-world user archetypes)
// ============================================================================

const USER_DEFINITIONS = [
  {
    name: 'Rahul Sharma', email: 'rahul.sharma.seed@example.com', role: 'user',
    archetype: 'young_professional',
    profile: {
      homeType: 'apartment', homeSize: 700, hasYard: false, yardSize: 'none',
      activityLevel: 3, workSchedule: 'full_time', hoursAlonePerDay: 9,
      experienceLevel: 'first_time', previousPets: [],
      hasChildren: false, childrenAges: [], hasOtherPets: false, otherPetsTypes: [],
      monthlyBudget: 120, maxAdoptionFee: 300,
      preferredSpecies: ['Cat'], preferredSize: ['small', 'medium'],
      preferredEnergyLevel: 2, willingToTrainPet: false, canHandleSpecialNeeds: false,
    }
  },
  {
    name: 'Priya Patel', email: 'priya.patel.seed@example.com', role: 'user',
    archetype: 'family_with_kids',
    profile: {
      homeType: 'house', homeSize: 1800, hasYard: true, yardSize: 'large',
      activityLevel: 4, workSchedule: 'part_time', hoursAlonePerDay: 4,
      experienceLevel: 'some_experience', previousPets: ['dog'],
      hasChildren: true, childrenAges: [5, 8], hasOtherPets: false, otherPetsTypes: [],
      monthlyBudget: 200, maxAdoptionFee: 500,
      preferredSpecies: ['Dog'], preferredSize: ['medium', 'large'],
      preferredEnergyLevel: 4, willingToTrainPet: true, canHandleSpecialNeeds: false,
    }
  },
  {
    name: 'Amit Kumar', email: 'amit.kumar.seed@example.com', role: 'user',
    archetype: 'retired_couple',
    profile: {
      homeType: 'house', homeSize: 1500, hasYard: true, yardSize: 'medium',
      activityLevel: 2, workSchedule: 'home_all_day', hoursAlonePerDay: 1,
      experienceLevel: 'experienced', previousPets: ['dog', 'dog', 'cat'],
      hasChildren: false, childrenAges: [], hasOtherPets: false, otherPetsTypes: [],
      monthlyBudget: 300, maxAdoptionFee: 800,
      preferredSpecies: ['Dog', 'Cat'], preferredSize: ['medium', 'large'],
      preferredEnergyLevel: 2, willingToTrainPet: true, canHandleSpecialNeeds: true,
    }
  },
  {
    name: 'Sneha Reddy', email: 'sneha.reddy.seed@example.com', role: 'user',
    archetype: 'active_single',
    profile: {
      homeType: 'house', homeSize: 1200, hasYard: true, yardSize: 'medium',
      activityLevel: 5, workSchedule: 'part_time', hoursAlonePerDay: 3,
      experienceLevel: 'experienced', previousPets: ['dog', 'dog'],
      hasChildren: false, childrenAges: [], hasOtherPets: false, otherPetsTypes: [],
      monthlyBudget: 250, maxAdoptionFee: 600,
      preferredSpecies: ['Dog'], preferredSize: ['large'],
      preferredEnergyLevel: 5, willingToTrainPet: true, canHandleSpecialNeeds: true,
    }
  },
  {
    name: 'Kavita Joshi', email: 'kavita.joshi.seed@example.com', role: 'user',
    archetype: 'elderly_single',
    profile: {
      homeType: 'apartment', homeSize: 500, hasYard: false, yardSize: 'none',
      activityLevel: 1, workSchedule: 'home_all_day', hoursAlonePerDay: 2,
      experienceLevel: 'experienced', previousPets: ['cat', 'cat', 'cat'],
      hasChildren: false, childrenAges: [], hasOtherPets: false, otherPetsTypes: [],
      monthlyBudget: 120, maxAdoptionFee: 250,
      preferredSpecies: ['Cat'], preferredSize: ['small', 'medium'],
      preferredEnergyLevel: 1, willingToTrainPet: false, canHandleSpecialNeeds: false,
    }
  },
  {
    name: 'Vikram Singh', email: 'vikram.singh.seed@example.com', role: 'user',
    archetype: 'farm_owner',
    profile: {
      homeType: 'farm', homeSize: 3000, hasYard: true, yardSize: 'large',
      activityLevel: 5, workSchedule: 'home_all_day', hoursAlonePerDay: 1,
      experienceLevel: 'expert', previousPets: ['dog', 'dog', 'dog', 'cat'],
      hasChildren: true, childrenAges: [10, 14], hasOtherPets: true, otherPetsTypes: ['dog'],
      monthlyBudget: 400, maxAdoptionFee: 1000,
      preferredSpecies: ['Dog'], preferredSize: ['large'],
      preferredEnergyLevel: 5, willingToTrainPet: true, canHandleSpecialNeeds: true,
    }
  },
  {
    name: 'Ananya Gupta', email: 'ananya.gupta.seed@example.com', role: 'user',
    archetype: 'college_student',
    profile: {
      homeType: 'apartment', homeSize: 400, hasYard: false, yardSize: 'none',
      activityLevel: 3, workSchedule: 'full_time', hoursAlonePerDay: 8,
      experienceLevel: 'first_time', previousPets: [],
      hasChildren: false, childrenAges: [], hasOtherPets: false, otherPetsTypes: [],
      monthlyBudget: 80, maxAdoptionFee: 200,
      preferredSpecies: ['Cat'], preferredSize: ['small'],
      preferredEnergyLevel: 2, willingToTrainPet: false, canHandleSpecialNeeds: false,
    }
  },
  {
    name: 'Deepak Mehta', email: 'deepak.mehta.seed@example.com', role: 'user',
    archetype: 'family_no_kids',
    profile: {
      homeType: 'condo', homeSize: 1000, hasYard: false, yardSize: 'none',
      activityLevel: 3, workSchedule: 'full_time', hoursAlonePerDay: 8,
      experienceLevel: 'some_experience', previousPets: ['cat'],
      hasChildren: false, childrenAges: [], hasOtherPets: true, otherPetsTypes: ['cat'],
      monthlyBudget: 180, maxAdoptionFee: 400,
      preferredSpecies: ['Cat', 'Dog'], preferredSize: ['small', 'medium'],
      preferredEnergyLevel: 3, willingToTrainPet: true, canHandleSpecialNeeds: false,
    }
  },
];

// ============================================================================
// REALISTIC ADOPTION SCENARIOS
// Each scenario defines WHO adopted WHICH pet and WHY it succeeded/failed
// ============================================================================

const ADOPTION_SCENARIOS = [
  // --- SUCCESSFUL adoptions (good matches) ---
  {
    userName: 'Priya Patel', petName: 'Buddy', 
    outcome: 'adopted', success: true, rating: 5,
    reason: 'Family with kids + Golden Retriever = perfect match. Buddy loves children.',
  },
  {
    userName: 'Sneha Reddy', petName: 'Rex',
    outcome: 'adopted', success: true, rating: 5,
    reason: 'Experienced active owner + protective GSD = great working dog match.',
  },
  {
    userName: 'Kavita Joshi', petName: 'Simba',
    outcome: 'adopted', success: true, rating: 5,
    reason: 'Elderly person alone at home + lazy lap cat = purr-fect companionship.',
  },
  {
    userName: 'Amit Kumar', petName: 'Shadow',
    outcome: 'adopted', success: true, rating: 5,
    reason: 'Retired experienced owner + senior calm GSD = peaceful companions.',
  },
  {
    userName: 'Vikram Singh', petName: 'Thor',
    outcome: 'adopted', success: true, rating: 4,
    reason: 'Farm expert owner with space + high-drive working GSD = ideal working dog.',
  },
  {
    userName: 'Deepak Mehta', petName: 'Winston',
    outcome: 'adopted', success: true, rating: 5,
    reason: 'Condo with existing cat + easygoing British Shorthair = great companion.',
  },
  {
    userName: 'Ananya Gupta', petName: 'Oscar',
    outcome: 'adopted', success: true, rating: 5,
    reason: 'Small apartment student + lazy tolerant cat = perfect low-maintenance pet.',
  },

  // --- FAILED adoptions (bad matches - realistic problems) ---
  {
    userName: 'Rahul Sharma', petName: 'Thor',
    outcome: 'returned', success: false, rating: 1,
    reason: 'First-time owner in apartment + high-drive working GSD = disaster. Destroyed furniture, barked all day.',
  },
  {
    userName: 'Ananya Gupta', petName: 'Daisy',
    outcome: 'returned', success: false, rating: 1,
    reason: 'Student 400sqft apartment + hyper Golden = impossible. Dog needs a yard and constant exercise.',
  },
  {
    userName: 'Kavita Joshi', petName: 'Bella',
    outcome: 'returned', success: false, rating: 2,
    reason: 'Elderly person + bouncy untrained GSD puppy = too much energy. Puppy knocked her over twice.',
  },
  {
    userName: 'Rahul Sharma', petName: 'Pearl',
    outcome: 'returned', success: false, rating: 1,
    reason: 'First-time owner gone 9 hours + anxious cat that needs constant presence = cat stopped eating from stress.',
  },

  // --- INTERACTIONS (browsed but didn't adopt) ---
  {
    userName: 'Priya Patel', petName: 'Luna',
    outcome: 'favorited', success: null, rating: null,
    reason: 'Family browsing GSDs, liked Lunas gentle nature, but adopted Buddy instead.',
  },
  {
    userName: 'Sneha Reddy', petName: 'Daisy',
    outcome: 'favorited', success: null, rating: null,
    reason: 'Active owner liked Daisys energy but chose Rex for more training potential.',
  },
  {
    userName: 'Amit Kumar', petName: 'Max',
    outcome: 'viewed', success: null, rating: null,
    reason: 'Retired couple considered therapy dog Max, but preferred Shadow who was older.',
  },
  {
    userName: 'Amit Kumar', petName: 'Goldie',
    outcome: 'viewed', success: null, rating: null,
    reason: 'Retired couple browsed senior Golden too.',
  },
  {
    userName: 'Deepak Mehta', petName: 'Misty',
    outcome: 'viewed', success: null, rating: null,
    reason: 'Considered shy BSH but worried about existing cat compatibility.',
  },
  {
    userName: 'Vikram Singh', petName: 'Luna',
    outcome: 'viewed', success: null, rating: null,
    reason: 'Farm owner looked at gentle GSD Luna but wanted more drive.',
  },
];


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generatePetCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l = () => letters[Math.floor(Math.random() * 26)];
  const d = () => Math.floor(Math.random() * 10);
  return `${l()}${l()}${l()}${d()}${d()}${d()}${d()}${d()}`;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/**
 * Build a pet's compatibilityProfile from breed base + individual overrides.
 * This is the KEY function that creates individual variation:
 * Same breed → different energy, different child-friendliness, etc.
 */
function buildCompatibilityProfile(petDef) {
  const base = BREED_BASE_PROFILES[petDef.breed];
  const ov = petDef.overrides || {};
  
  return {
    size: base.size,
    energyLevel: clamp(ov.energy ?? base.baseEnergy, 1, 5),
    exerciseNeeds: ov.exerciseNeeds || base.baseExerciseNeeds,
    trainingNeeds: ov.trainingNeeds || 'moderate',
    trainedLevel: ov.trainedLevel || base.baseTrainedLevel,
    childFriendlyScore: clamp(ov.childFriendly ?? base.baseChildFriendly, 0, 10),
    petFriendlyScore: clamp(ov.petFriendly ?? base.basePetFriendly, 0, 10),
    strangerFriendlyScore: clamp(ov.strangerFriendly ?? base.baseStrangerFriendly, 0, 10),
    minHomeSize: base.size === 'large' ? 800 : 300,
    needsYard: ov.needsYard ?? base.baseNeedsYard,
    canLiveInApartment: ov.canLiveInApartment ?? base.baseCanLiveInApartment,
    groomingNeeds: ov.groomingNeeds || base.baseGroomingNeeds,
    estimatedMonthlyCost: ov.monthlyCost || base.baseMonthlyCost,
    temperamentTags: petDef.temperaments || [],
    noiseLevel: ov.noiseLevel || base.baseNoiseLevel,
    canBeLeftAlone: ov.canBeLeftAlone ?? base.baseCanBeLeftAlone,
    maxHoursAlone: ov.maxHoursAlone ?? base.baseMaxHoursAlone,
    requiresExperiencedOwner: petDef.requiresExperienced || base.baseRequiresExperienced,
  };
}

function getDateOfBirth(ageDef) {
  const now = new Date();
  const years = ageDef.years || 0;
  const months = ageDef.months || 0;
  const dob = new Date(now.getFullYear() - years, now.getMonth() - months, 15);
  return dob;
}


// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function seed() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoURI) {
      console.error('❌ No MONGODB_URI or MONGO_URI in .env');
      process.exit(1);
    }
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // --- Get a manager user for createdBy ---
    let manager = await User.findOne({ role: 'adoption_manager', isActive: true });
    if (!manager) {
      manager = await User.findOne({ role: 'admin', isActive: true });
    }
    if (!manager) {
      console.error('❌ No adoption_manager or admin user found. Please create one first.');
      process.exit(1);
    }
    console.log(`📋 Using manager: ${manager.name} (${manager.email})`);

    // ============================
    // STEP 1: Create users
    // ============================
    console.log('\n👥 Creating seed users...');
    const userMap = {};
    
    for (const ud of USER_DEFINITIONS) {
      // Check if user already exists
      let user = await User.findOne({ email: ud.email });
      if (user) {
        console.log(`   ⏭️  ${ud.name} already exists`);
      } else {
        const hashedPw = await bcrypt.hash('SeedUser123!', 10);
        user = await User.create({
          name: ud.name,
          email: ud.email,
          password: hashedPw,
          role: ud.role,
          isActive: true,
          adoptionProfile: {
            ...ud.profile,
            profileComplete: true,
            profileCompletedAt: new Date(),
          }
        });
        console.log(`   ✅ Created ${ud.name} (${ud.archetype})`);
      }
      // Always update adoption profile to ensure it matches our definition
      if (user.adoptionProfile && !user.adoptionProfile.profileComplete) {
        user.adoptionProfile = { ...ud.profile, profileComplete: true, profileCompletedAt: new Date() };
        await user.save();
      }
      userMap[ud.name] = user;
    }

    // ============================
    // STEP 2: Create pets
    // ============================
    console.log('\n🐾 Creating seed pets with individual personalities...');
    const petMap = {};
    
    for (const pd of PET_DEFINITIONS) {
      // Check if pet already exists (by name + breed)
      let pet = await AdoptionPet.findOne({ name: pd.name, breed: pd.breed });
      if (pet) {
        console.log(`   ⏭️  ${pd.name} (${pd.breed}) already exists`);
      } else {
        const base = BREED_BASE_PROFILES[pd.breed];
        const color = base.colors[Math.floor(Math.random() * base.colors.length)];
        const weight = Math.round(randomBetween(base.weightRange[0], base.weightRange[1]) * 10) / 10;
        
        pet = await AdoptionPet.create({
          name: pd.name,
          breed: pd.breed,
          species: base.species,
          dateOfBirth: getDateOfBirth(pd.age),
          dobAccuracy: 'estimated',
          gender: pd.gender,
          color: color,
          weight: weight,
          vaccinationStatus: 'up_to_date',
          description: pd.description,
          status: 'available',
          adoptionFee: base.species === 'Dog' ? Math.round(randomBetween(200, 500)) : Math.round(randomBetween(100, 300)),
          petCode: generatePetCode(),
          compatibilityProfile: buildCompatibilityProfile(pd),
          isActive: true,
          createdBy: manager._id,
        });
        console.log(`   ✅ ${pd.name} (${pd.breed} - ${pd.personality}) [energy:${pet.compatibilityProfile.energyLevel}, child:${pet.compatibilityProfile.childFriendlyScore}]`);
      }
      petMap[pd.name] = pet;
    }

    // ============================
    // STEP 3: Create adoption scenarios (interactions + outcomes)
    // ============================
    console.log('\n📊 Creating realistic adoption scenarios...');
    let adoptedCount = 0;
    let returnedCount = 0;
    let interactionCount = 0;

    for (const scenario of ADOPTION_SCENARIOS) {
      const user = userMap[scenario.userName];
      const pet = petMap[scenario.petName];
      
      if (!user || !pet) {
        console.log(`   ⚠️  Skipping: ${scenario.userName} → ${scenario.petName} (not found)`);
        continue;
      }

      if (scenario.outcome === 'adopted' || scenario.outcome === 'returned') {
        // Create MLTrainingData record (real adoption outcome)
        const existing = await MLTrainingData.findOne({ userId: user._id, petId: pet._id });
        if (!existing) {
          await MLTrainingData.create({
            userId: user._id,
            petId: pet._id,
            userProfileSnapshot: user.adoptionProfile,
            petProfileSnapshot: {
              species: pet.species,
              breed: pet.breed,
              name: pet.name,
              ...(pet.compatibilityProfile?.toObject ? pet.compatibilityProfile.toObject() : pet.compatibilityProfile),
            },
            matchScore: scenario.rating ? scenario.rating * 20 : 50,
            algorithmUsed: 'none',
            outcome: scenario.success ? 'adopted' : 'returned',
            successfulAdoption: scenario.success,
            dataType: 'real',  // Treated as real data for ML training
            adoptionDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // random date in past 60 days
            implicitRating: scenario.rating || (scenario.success ? 5 : 1),
            metadata: { reason: scenario.reason, source: 'seed_script', archetype: USER_DEFINITIONS.find(u => u.name === scenario.userName)?.archetype }
          });

          if (scenario.success) {
            adoptedCount++;
            // Mark pet as adopted
            pet.status = 'adopted';
            pet.adopterUserId = user._id;
            pet.adoptionDate = new Date();
            await pet.save();
          } else {
            returnedCount++;
          }
          console.log(`   ${scenario.success ? '✅' : '❌'} ${scenario.userName} ${scenario.success ? 'adopted' : 'RETURNED'} ${scenario.petName}: ${scenario.reason.substring(0, 80)}...`);
        } else {
          console.log(`   ⏭️  ${scenario.userName} → ${scenario.petName} outcome already exists`);
        }
      }

      // Create UserPetInteraction record
      const interactionType = scenario.outcome === 'adopted' ? 'adopted' :
                              scenario.outcome === 'returned' ? 'returned' :
                              scenario.outcome;
      
      const existingInteraction = await UserPetInteraction.findOne({ 
        userId: user._id, petId: pet._id, interactionType 
      });
      
      if (!existingInteraction) {
        const ratingMap = { viewed: 1, clicked: 1.5, favorited: 3, applied: 4, adopted: 5, returned: 0 };
        await UserPetInteraction.create({
          userId: user._id,
          petId: pet._id,
          interactionType: interactionType,
          matchScore: scenario.rating ? scenario.rating * 20 : null,
          algorithmUsed: 'none',
          implicitRating: ratingMap[interactionType] || 1,
          metadata: { reason: scenario.reason, source: 'seed_script' }
        });
        interactionCount++;
      }

      // Also create "viewed" interaction for all adoption/return scenarios (they viewed first)
      if (scenario.outcome === 'adopted' || scenario.outcome === 'returned') {
        const existingView = await UserPetInteraction.findOne({ 
          userId: user._id, petId: pet._id, interactionType: 'viewed' 
        });
        if (!existingView) {
          await UserPetInteraction.create({
            userId: user._id, petId: pet._id,
            interactionType: 'viewed',
            implicitRating: 1,
            metadata: { source: 'seed_script' }
          });
          interactionCount++;
        }
      }
    }

    // ============================
    // SUMMARY
    // ============================
    const totalPets = await AdoptionPet.countDocuments({ isActive: true });
    const availablePets = await AdoptionPet.countDocuments({ status: 'available', isActive: true });
    const totalUsers = await User.countDocuments({ 'adoptionProfile.profileComplete': true });
    const totalTraining = await MLTrainingData.countDocuments({ dataType: 'real' });
    const totalInteractions = await UserPetInteraction.countDocuments();

    console.log('\n' + '='.repeat(60));
    console.log('🏆 SEED DATA COMPLETE');
    console.log('='.repeat(60));
    console.log(`   👥 Users with profiles:  ${totalUsers}`);
    console.log(`   🐾 Total pets:           ${totalPets} (${availablePets} available)`);
    console.log(`   ✅ Successful adoptions:  ${adoptedCount}`);
    console.log(`   ❌ Failed returns:        ${returnedCount}`);
    console.log(`   👀 Interactions logged:   ${interactionCount} new (${totalInteractions} total)`);
    console.log(`   🧠 ML training records:   ${totalTraining}`);
    console.log('');
    console.log('   BREED DISTRIBUTION:');
    for (const breed of Object.keys(BREED_BASE_PROFILES)) {
      const count = PET_DEFINITIONS.filter(p => p.breed === breed).length;
      console.log(`     ${breed}: ${count} pets (each with unique personality)`);
    }
    console.log('');
    console.log('   WHY THIS IS BETTER THAN RANDOM SYNTHETIC DATA:');
    console.log('   • K-Means trains on REAL pet personality features (not random templates)');
    console.log('   • XGBoost learns from REALISTIC match outcomes (family+kid-friendly pet = success)');
    console.log('   • SVD learns from REALISTIC user behavior (active user favorites energetic dogs)');
    console.log('   • Each pet has INDIVIDUAL personality even within same breed');
    console.log('   • When admin adds new breeds, ML uses features NOT breed names');
    console.log('');
    console.log('   NEXT: Restart Python service → it will auto-train on this real data');
    console.log('='.repeat(60));

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Seed script failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
