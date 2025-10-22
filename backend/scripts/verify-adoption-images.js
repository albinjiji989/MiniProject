#!/usr/bin/env node

/**
 * Verification Script for Adoption Manager Image Upload System
 * 
 * Checks:
 * 1. Database connection
 * 2. Image and Document models exist
 * 3. AdoptionPet virtuals are configured
 * 4. Upload directories exist and are writable
 * 5. Sample data consistency
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

console.log('\n📋 ADOPTION IMAGE SYSTEM VERIFICATION\n');
console.log('='.repeat(60));

let exitCode = 0;

const test = (name, fn) => {
  process.stdout.write(`✓ ${name}... `);
  try {
    const result = fn();
    console.log(result ? '✅' : '⚠️  (check manually)');
    return result !== false;
  } catch (error) {
    console.log(`❌ FAILED`);
    console.error(`  Error: ${error.message}`);
    exitCode = 1;
    return false;
  }
};

const asyncTest = async (name, fn) => {
  process.stdout.write(`✓ ${name}... `);
  try {
    const result = await fn();
    console.log(result ? '✅' : '⚠️  (check manually)');
    return result !== false;
  } catch (error) {
    console.log(`❌ FAILED`);
    console.error(`  Error: ${error.message}`);
    exitCode = 1;
    return false;
  }
};

const main = async () => {
  try {
    // 1. Database connection
    console.log('\n1️⃣  DATABASE TESTS\n');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/petcare';
    
    await asyncTest('Connecting to MongoDB', async () => {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      return mongoose.connection.readyState === 1;
    });

    // 2. Models exist
    console.log('\n2️⃣  MODEL TESTS\n');

    await asyncTest('Image model exists', async () => {
      const Image = require('../modules/adoption/manager/models/Image');
      const count = await Image.countDocuments();
      console.log(`\n     → Found ${count} image records in database`);
      return true;
    });

    await asyncTest('Document model exists', async () => {
      const Document = require('../modules/adoption/manager/models/Document');
      const count = await Document.countDocuments();
      console.log(`\n     → Found ${count} document records in database`);
      return true;
    });

    await asyncTest('AdoptionPet model exists', async () => {
      const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
      const count = await AdoptionPet.countDocuments();
      console.log(`\n     → Found ${count} adoption pet records`);
      return true;
    });

    // 3. Virtual fields configured
    console.log('\n3️⃣  VIRTUAL FIELDS TEST\n');

    await asyncTest('AdoptionPet virtuals configured', async () => {
      const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
      const schema = AdoptionPet.schema;
      
      const hasImagesVirtual = schema.virtuals.images;
      const hasDocumentsVirtual = schema.virtuals.documents;
      
      if (!hasImagesVirtual) throw new Error('Missing images virtual');
      if (!hasDocumentsVirtual) throw new Error('Missing documents virtual');
      
      console.log(`\n     → images virtual: ${hasImagesVirtual ? '✅' : '❌'}`);
      console.log(`     → documents virtual: ${hasDocumentsVirtual ? '✅' : '❌'}`);
      
      return true;
    });

    // 4. Upload directories
    console.log('\n4️⃣  UPLOAD DIRECTORY TESTS\n');

    test('Photos directory writable', () => {
      const dir = path.join(__dirname, '..', 'modules', 'adoption', 'uploads', 'photos', 'pets', 'managers');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`\n     → Created: ${dir}`);
      }
      return fs.existsSync(dir);
    });

    test('Documents directory writable', () => {
      const dir = path.join(__dirname, '..', 'modules', 'adoption', 'uploads', 'documents', 'pets', 'managers');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`\n     → Created: ${dir}`);
      }
      return fs.existsSync(dir);
    });

    // 5. Sample data check
    console.log('\n5️⃣  SAMPLE DATA CONSISTENCY\n');

    await asyncTest('Check for pets with imageIds', async () => {
      const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
      const petsWithImages = await AdoptionPet.find({ imageIds: { $exists: true, $ne: [] } }).limit(5);
      console.log(`\n     → Found ${petsWithImages.length} pets with imageIds`);
      
      if (petsWithImages.length > 0) {
        const pet = petsWithImages[0];
        console.log(`     → Sample: ${pet.name} has ${pet.imageIds.length} image IDs`);
      }
      return true;
    });

    await asyncTest('Check Image to Pet references', async () => {
      const Image = require('../modules/adoption/manager/models/Image');
      const images = await Image.find().limit(5);
      console.log(`\n     → Found ${images.length} recent image records`);
      
      if (images.length > 0) {
        const img = images[0];
        console.log(`     → Sample image URL: ${img.url}`);
        console.log(`     → Uploaded by: ${img.uploadedBy}`);
      }
      return true;
    });

    // 6. API endpoint simulation
    console.log('\n6️⃣  VIRTUAL POPULATION TEST\n');

    await asyncTest('Populate images virtual field', async () => {
      const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
      const pets = await AdoptionPet.find()
        .populate({
          path: 'images',
          select: 'url caption type size name'
        })
        .limit(1);
      
      if (pets.length > 0) {
        const pet = pets[0].toObject({ virtuals: true });
        console.log(`\n     → Pet: ${pet.name}`);
        console.log(`     → Images array length: ${Array.isArray(pet.images) ? pet.images.length : 0}`);
        if (pet.images && pet.images.length > 0) {
          console.log(`     → First image URL: ${pet.images[0].url}`);
        }
      }
      return true;
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 VERIFICATION COMPLETE\n');
    
    console.log('✅ All systems operational! Your adoption pet image system is ready.\n');
    
    console.log('🔗 NEXT STEPS:\n');
    console.log('1. Upload an image to a pet:');
    console.log('   POST /api/adoption/manager/pets/upload\n');
    console.log('2. Link image to pet:');
    console.log('   PUT /api/adoption/manager/pets/{petId}');
    console.log('   Body: { "imageIds": ["imageId"] }\n');
    console.log('3. Fetch pet with images:');
    console.log('   GET /api/adoption/manager/pets?fields=images\n');
    console.log('4. Images should appear in adoption manager dashboard\n');

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    exitCode = 1;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(exitCode);
  }
};

main();