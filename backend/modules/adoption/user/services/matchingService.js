const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_ML_SERVICE_URL || 'http://localhost:5001';

/**
 * Calculate compatibility match between user and pet
 */
async function calculateMatch(userProfile, petProfile) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/adoption/match/calculate`, {
      userProfile,
      petProfile
    });
    return response.data;
  } catch (error) {
    console.error('Error calling AI matching service:', error.message);
    throw new Error('AI matching service unavailable');
  }
}

/**
 * Rank all pets by compatibility for a user
 */
async function rankPets(userProfile, pets) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/adoption/match/rank`, {
      userProfile,
      pets
    });
    return response.data;
  } catch (error) {
    console.error('Error calling AI ranking service:', error.message);
    throw new Error('AI ranking service unavailable');
  }
}

/**
 * Get top N best matches for a user
 */
async function getTopMatches(userProfile, pets, topN = 5) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/adoption/match/top-matches`, {
      userProfile,
      pets,
      topN
    });
    return response.data;
  } catch (error) {
    console.error('Error calling AI top matches service:', error.message);
    throw new Error('AI matching service unavailable');
  }
}

module.exports = {
  calculateMatch,
  rankPets,
  getTopMatches
};
