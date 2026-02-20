/**
 * Test AI service with a sample image
 * This script demonstrates how to use the Python AI service
 * 
 * Usage:
 *   node test-ai-with-image.js path/to/image.jpg
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pythonAIService = require('./services/pythonAIService');

async function testWithImage(imagePath) {
  console.log('🧪 Testing Python AI Service with Image\n');
  
  // Check if image file exists
  if (!fs.existsSync(imagePath)) {
    console.error('❌ Error: Image file not found:', imagePath);
    console.log('\nUsage: node test-ai-with-image.js path/to/image.jpg');
    process.exit(1);
  }

  try {
    // Read image file
    console.log('📁 Reading image:', imagePath);
    const imageBuffer = fs.readFileSync(imagePath);
    const filename = path.basename(imagePath);
    console.log('✅ Image loaded:', filename, `(${imageBuffer.length} bytes)\n`);

    // Test 1: Health Check
    console.log('1️⃣ Testing health check...');
    const health = await pythonAIService.healthCheck();
    console.log('✅ Service is healthy\n');

    // Test 2: Identify Breed
    console.log('2️⃣ Testing breed identification...');
    const breedResult = await pythonAIService.identifyBreed(
      imageBuffer,
      filename,
      5,  // top 5 predictions
      false  // don't upload to Cloudinary
    );

    if (breedResult.success && breedResult.data) {
      console.log('✅ Breed identification successful!\n');
      console.log('Primary Prediction:');
      console.log('  Breed:', breedResult.data.primary_breed);
      console.log('  Species:', breedResult.data.primary_species);
      console.log('  Confidence:', (breedResult.data.predictions[0].confidence * 100).toFixed(2) + '%');
      console.log('\nTop 5 Predictions:');
      breedResult.data.predictions.forEach((pred, idx) => {
        console.log(`  ${idx + 1}. ${pred.breed} (${pred.species}) - ${(pred.confidence * 100).toFixed(2)}%`);
      });
      console.log('\nProcessing Time:', breedResult.data.processing_time, 'seconds');
    } else {
      console.log('❌ Breed identification failed');
    }

    console.log('\n3️⃣ Testing species identification...');
    const speciesResult = await pythonAIService.identifySpecies(
      imageBuffer,
      filename
    );

    if (speciesResult.success && speciesResult.data) {
      console.log('✅ Species identification successful!');
      console.log('  Species:', speciesResult.data.species);
      console.log('  Confidence:', (speciesResult.data.confidence * 100).toFixed(2) + '%');
    } else {
      console.log('❌ Species identification failed');
    }

    console.log('\n🎉 All tests completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure Python service is running');
    console.error('2. Check PYTHON_AI_SERVICE_URL in .env');
    console.error('3. Verify image file is valid (jpg, png, webp)');
    console.error('4. Check Railway deployment status');
    process.exit(1);
  }
}

// Get image path from command line
const imagePath = process.argv[2];

if (!imagePath) {
  console.log('Usage: node test-ai-with-image.js path/to/image.jpg');
  console.log('\nExample:');
  console.log('  node test-ai-with-image.js test-dog.jpg');
  console.log('  node test-ai-with-image.js ../images/cat.png');
  process.exit(1);
}

// Run test
testWithImage(imagePath);
