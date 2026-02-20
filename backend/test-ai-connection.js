/**
 * Test script to verify Python AI service connection
 * Run: node test-ai-connection.js
 */

require('dotenv').config();
const pythonAIService = require('./services/pythonAIService');

async function testConnection() {
  console.log('🧪 Testing Python AI Service Connection...\n');
  console.log(`📍 Service URL: ${process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000'}\n`);

  try {
    // Test health check
    console.log('1️⃣ Testing health check...');
    const health = await pythonAIService.healthCheck();
    console.log('✅ Health check passed!');
    console.log('   Status:', health.status);
    console.log('   Services:', JSON.stringify(health.services, null, 2));
    console.log('');

    console.log('🎉 All tests passed! Python AI service is connected.\n');
    console.log('Available endpoints:');
    console.log('  - POST /api/ai/identify-breed');
    console.log('  - POST /api/ai/identify-species');
    console.log('  - POST /api/ai/identify-adoption');
    console.log('  - GET  /api/ai/adoption-recommendations/:userId');
    console.log('  - GET  /api/ai/inventory/:productId');
    console.log('  - GET  /api/ai/inventory/critical');
    console.log('  - GET  /api/ai/ecommerce-recommendations/:userId');
    
  } catch (error) {
    console.error('❌ Connection test failed!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure Python service is running');
    console.error('2. Check PYTHON_AI_SERVICE_URL in .env file');
    console.error('3. Verify Railway deployment is active');
    console.error('4. Test Railway URL directly in browser');
    process.exit(1);
  }
}

// Run test
testConnection();
