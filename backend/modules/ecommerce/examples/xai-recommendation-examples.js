/**
 * XAI Recommendation System - API Usage Examples
 * 
 * This file contains practical examples of how to use the XAI recommendation API
 * in various scenarios.
 */

const axios = require('axios');

// Base configuration
const API_BASE_URL = 'http://localhost:5000/api/ecommerce';
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// ============================================================================
// EXAMPLE 1: Get Personalized Recommendations
// ============================================================================

async function getPersonalizedRecommendations() {
  console.log('\n📋 EXAMPLE 1: Getting Personalized Recommendations\n');
  
  try {
    const response = await apiClient.get('/recommendations', {
      params: {
        limit: 10,
        include: 'analytics,history'
      }
    });
    
    console.log('✅ Success!');
    console.log(`Found ${response.data.count} recommendations\n`);
    
    // Display first recommendation
    const firstRec = response.data.recommendations[0];
    console.log('Top Recommendation:');
    console.log(`  Product: ${firstRec.product.name}`);
    console.log(`  Score: ${firstRec.recommendationScore}%`);
    console.log(`  Primary Reason: ${firstRec.explanation.primary}`);
    console.log(`  Confidence: ${firstRec.explanation.confidence}`);
    console.log('\n  Feature Contributions:');
    
    Object.entries(firstRec.featureImportance).forEach(([feature, data]) => {
      console.log(`    - ${feature}: ${data.contribution.toFixed(1)}%`);
    });
    
    if (response.data.analytics) {
      console.log('\n  Your Analytics:');
      console.log(`    - Total recommendations shown: ${response.data.analytics.total}`);
      console.log(`    - Click rate: ${response.data.analytics.clickRate}%`);
      console.log(`    - Purchase rate: ${response.data.analytics.purchaseRate}%`);
    }
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 2: Track Product View (for building user profile)
// ============================================================================

async function trackProductView(productId) {
  console.log('\n📋 EXAMPLE 2: Tracking Product View\n');
  
  try {
    const response = await apiClient.post(`/products/${productId}/view`, {
      source: 'category',
      viewDuration: 45, // seconds
      sessionId: `session-${Date.now()}`
    });
    
    console.log('✅ Product view tracked successfully!');
    console.log('   This will help improve future recommendations.\n');
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 3: Track Recommendation Interaction
// ============================================================================

async function trackRecommendationClick(productId, sessionId) {
  console.log('\n📋 EXAMPLE 3: Tracking Recommendation Click\n');
  
  try {
    // Track that user clicked on a recommended product
    const response = await apiClient.post(`/recommendations/${productId}/track`, {
      action: 'clicked',
      sessionId: sessionId
    });
    
    console.log('✅ Interaction tracked successfully!');
    console.log('   Action: clicked');
    console.log('   This helps us measure recommendation effectiveness.\n');
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 4: Provide Feedback on Recommendation
// ============================================================================

async function provideFeedback(productId, rating, comment) {
  console.log('\n📋 EXAMPLE 4: Providing Feedback on Recommendation\n');
  
  try {
    const response = await apiClient.post(`/recommendations/${productId}/feedback`, {
      score: rating, // 1-5
      comment: comment,
      sessionId: `session-${Date.now()}`
    });
    
    console.log('✅ Thank you for your feedback!');
    console.log(`   Rating: ${rating}/5`);
    console.log(`   Comment: "${comment}"\n`);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 5: Get Recommendation Analytics
// ============================================================================

async function getRecommendationAnalytics(days = 30) {
  console.log('\n📋 EXAMPLE 5: Getting Recommendation Analytics\n');
  
  try {
    const response = await apiClient.get('/recommendations/analytics', {
      params: { days }
    });
    
    const { acceptanceRate, featureImportance } = response.data.analytics;
    
    console.log('✅ Analytics Retrieved!\n');
    console.log(`Period: Last ${days} days\n`);
    
    console.log('Acceptance Rate:');
    console.log(`  Total Recommendations: ${acceptanceRate.total}`);
    console.log(`  Clicked: ${acceptanceRate.clicked} (${acceptanceRate.clickRate}%)`);
    console.log(`  Purchased: ${acceptanceRate.purchased} (${acceptanceRate.purchaseRate}%)`);
    
    console.log('\nAverage Feature Importance:');
    console.log(`  Pet Match: ${featureImportance.avgPetMatchContribution?.toFixed(1)}%`);
    console.log(`  Purchase History: ${featureImportance.avgPurchaseHistoryContribution?.toFixed(1)}%`);
    console.log(`  Viewing History: ${featureImportance.avgViewingHistoryContribution?.toFixed(1)}%`);
    console.log(`  Popularity: ${featureImportance.avgPopularityContribution?.toFixed(1)}%`);
    console.log(`  Price Match: ${featureImportance.avgPriceMatchContribution?.toFixed(1)}%`);
    console.log('');
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 6: Understand Recommendation Methodology (Public Endpoint)
// ============================================================================

async function explainMethodology() {
  console.log('\n📋 EXAMPLE 6: Understanding Recommendation Methodology\n');
  
  try {
    // This endpoint doesn't require authentication
    const response = await axios.get(`${API_BASE_URL}/recommendations/explain-weights`);
    
    const { methodology } = response.data;
    
    console.log('✅ Methodology Explained!\n');
    console.log(`System: ${methodology.name}`);
    console.log(`Version: ${methodology.version}`);
    console.log(`Description: ${methodology.description}\n`);
    
    console.log('Feature Weights:');
    Object.entries(methodology.features).forEach(([feature, data]) => {
      console.log(`\n  ${feature.toUpperCase()}: ${data.weightPercentage}`);
      console.log(`  Description: ${data.description}`);
      console.log('  Scoring Criteria:');
      data.scoringCriteria.forEach(criteria => {
        console.log(`    - ${criteria}`);
      });
    });
    
    console.log('\nEthical Principles:');
    methodology.ethicalPrinciples.forEach((principle, index) => {
      console.log(`  ${index + 1}. ${principle}`);
    });
    console.log('');
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 7: Complete User Journey
// ============================================================================

async function completeUserJourney(productId) {
  console.log('\n📋 EXAMPLE 7: Complete User Journey\n');
  console.log('Simulating a complete user journey with recommendations...\n');
  
  const sessionId = `session-${Date.now()}`;
  
  try {
    // Step 1: Get recommendations
    console.log('Step 1: Getting recommendations...');
    const recommendations = await apiClient.get('/recommendations', {
      params: { limit: 5 }
    });
    console.log(`   ✓ Received ${recommendations.data.count} recommendations\n`);
    
    // Step 2: User views a product
    console.log('Step 2: User views a product...');
    await apiClient.post(`/products/${productId}/view`, {
      source: 'recommendation',
      viewDuration: 60,
      sessionId: sessionId
    });
    console.log('   ✓ Product view tracked\n');
    
    // Step 3: Track recommendation shown
    console.log('Step 3: Tracking recommendation shown...');
    await apiClient.post(`/recommendations/${productId}/track`, {
      action: 'shown',
      sessionId: sessionId
    });
    console.log('   ✓ Recommendation shown tracked\n');
    
    // Step 4: User clicks on recommendation
    console.log('Step 4: User clicks on recommended product...');
    await apiClient.post(`/recommendations/${productId}/track`, {
      action: 'clicked',
      sessionId: sessionId
    });
    console.log('   ✓ Click tracked\n');
    
    // Step 5: User purchases the product
    console.log('Step 5: User purchases the product...');
    await apiClient.post(`/recommendations/${productId}/track`, {
      action: 'purchased',
      sessionId: sessionId
    });
    console.log('   ✓ Purchase tracked\n');
    
    // Step 6: User provides feedback
    console.log('Step 6: User provides feedback...');
    await apiClient.post(`/recommendations/${productId}/feedback`, {
      score: 5,
      comment: 'Great recommendation! My dog loves it.',
      sessionId: sessionId
    });
    console.log('   ✓ Feedback recorded\n');
    
    console.log('✅ Complete user journey tracked successfully!');
    console.log('   This data will improve future recommendations.\n');
    
  } catch (error) {
    console.error('❌ Error in user journey:', error.response?.data?.message || error.message);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 8: Analyze Recommendation Quality
// ============================================================================

async function analyzeRecommendationQuality() {
  console.log('\n📋 EXAMPLE 8: Analyzing Recommendation Quality\n');
  
  try {
    const response = await apiClient.get('/recommendations', {
      params: { limit: 10 }
    });
    
    const recommendations = response.data.recommendations;
    
    // Calculate average score
    const avgScore = recommendations.reduce((sum, rec) => sum + rec.recommendationScore, 0) / recommendations.length;
    
    // Count by confidence level
    const confidenceCounts = recommendations.reduce((counts, rec) => {
      counts[rec.explanation.confidence] = (counts[rec.explanation.confidence] || 0) + 1;
      return counts;
    }, {});
    
    // Find top contributing feature
    const featureContributions = {};
    recommendations.forEach(rec => {
      Object.entries(rec.featureImportance).forEach(([feature, data]) => {
        if (!featureContributions[feature]) {
          featureContributions[feature] = { total: 0, count: 0 };
        }
        featureContributions[feature].total += data.contribution;
        featureContributions[feature].count += 1;
      });
    });
    
    console.log('✅ Recommendation Quality Analysis\n');
    console.log(`Total Recommendations: ${recommendations.length}`);
    console.log(`Average Score: ${avgScore.toFixed(2)}%\n`);
    
    console.log('Confidence Distribution:');
    Object.entries(confidenceCounts).forEach(([level, count]) => {
      console.log(`  ${level}: ${count} (${(count / recommendations.length * 100).toFixed(1)}%)`);
    });
    
    console.log('\nAverage Feature Contributions:');
    Object.entries(featureContributions)
      .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))
      .forEach(([feature, data]) => {
        const avg = data.total / data.count;
        console.log(`  ${feature}: ${avg.toFixed(1)}%`);
      });
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    throw error;
  }
}

// ============================================================================
// Main execution
// ============================================================================

async function runExamples() {
  console.log('\n' + '='.repeat(70));
  console.log('  XAI RECOMMENDATION SYSTEM - API USAGE EXAMPLES');
  console.log('='.repeat(70));
  
  try {
    // Example 1: Get recommendations
    await getPersonalizedRecommendations();
    
    // Example 2: Track product view
    // await trackProductView('PRODUCT_ID_HERE');
    
    // Example 3: Track recommendation interaction
    // await trackRecommendationClick('PRODUCT_ID_HERE', 'session-123');
    
    // Example 4: Provide feedback
    // await provideFeedback('PRODUCT_ID_HERE', 5, 'Excellent recommendation!');
    
    // Example 5: Get analytics
    // await getRecommendationAnalytics(30);
    
    // Example 6: Explain methodology (public endpoint)
    await explainMethodology();
    
    // Example 7: Complete user journey
    // await completeUserJourney('PRODUCT_ID_HERE');
    
    // Example 8: Analyze recommendation quality
    // await analyzeRecommendationQuality();
    
    console.log('='.repeat(70));
    console.log('  ✅ Examples completed successfully!');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Example execution failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = {
  getPersonalizedRecommendations,
  trackProductView,
  trackRecommendationClick,
  provideFeedback,
  getRecommendationAnalytics,
  explainMethodology,
  completeUserJourney,
  analyzeRecommendationQuality
};

// Run examples if executed directly
if (require.main === module) {
  runExamples();
}
