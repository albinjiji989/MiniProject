/**
 * Test script to verify smart matching functionality
 * Run with: node test-smart-matching.js
 */

const axios = require('axios');

// Your hosted Python service URL
const PYTHON_SERVICE_URL = 'https://petconnect-ztg6.onrender.com';

async function testSmartMatching() {
  console.log('🧪 Testing Smart Matching Integration...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing Python service health...');
    const healthResponse = await axios.get(`${PYTHON_SERVICE_URL}/api/adoption/health`, {
      timeout: 30000
    });
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test 2: Calculate match endpoint
    console.log('\n2️⃣ Testing match calculation...');
    const matchResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/adoption/match/calculate`, {
      userProfile: {
        homeType: 'apartment',
        activityLevel: 'moderate',
        experienceLevel: 'beginner',
        hasChildren: false,
        hasOtherPets: false,
        preferredSpecies: 'dog',
        preferredSize: 'medium',
        monthlyBudget: 500
      },
      petProfile: {
        species: 'dog',
        breed: 'Golden Retriever',
        age: 2,
        size: 'large',
        energyLevel: 'high',
        goodWithKids: true,
        goodWithPets: true,
        specialNeeds: false
      }
    }, {
      timeout: 30000
    });
    console.log('✅ Match calculation passed:', matchResponse.data);
    
    // Test 3: Hybrid ML recommendations
    console.log('\n3️⃣ Testing hybrid ML recommendations...');
    const hybridResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/adoption/ml/recommend/hybrid`, {
      userId: 'test-user-123',
      userProfile: {
        homeType: 'house',
        activityLevel: 'high',
        experienceLevel: 'intermediate',
        hasChildren: true,
        hasOtherPets: false,
        preferredSpecies: 'dog',
        preferredSize: 'medium',
        monthlyBudget: 800
      },
      availablePets: [
        {
          _id: 'pet1',
          species: 'dog',
          breed: 'Labrador',
          age: 3,
          size: 'large',
          energyLevel: 'high',
          goodWithKids: true,
          goodWithPets: true,
          specialNeeds: false
        },
        {
          _id: 'pet2',
          species: 'cat',
          breed: 'Persian',
          age: 1,
          size: 'small',
          energyLevel: 'low',
          goodWithKids: true,
          goodWithPets: false,
          specialNeeds: false
        }
      ],
      topN: 5,
      algorithm: 'hybrid'
    }, {
      timeout: 30000
    });
    console.log('✅ Hybrid recommendations passed:', hybridResponse.data);
    
    console.log('\n🎉 All tests passed! Smart matching is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Suggestion: Make sure your Python service is running and accessible.');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Suggestion: The endpoint might not be available. Check your Python service routes.');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Suggestion: Check if the service URL is correct and accessible.');
    }
  }
}

// Run the test
testSmartMatching();