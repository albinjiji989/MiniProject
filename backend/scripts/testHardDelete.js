const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Connect to database
const connectDB = require('../core/db');
connectDB();

// Import models
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
const Image = require('../core/models/Image');
const Document = require('../core/models/Document');

async function testHardDelete() {
  console.log('\n🔍 TESTING HARD DELETE FUNCTIONALITY\n');
  
  try {
    // Create a test pet with media
    console.log('Creating test pet...');
    const testPet = new AdoptionPet({
      name: 'Test Pet for Deletion',
      breed: 'Test Breed',
      species: 'Test Species',
      status: 'available',
      isActive: true,
      createdBy: '68f637e04954afb7ee202bfe' // Test user ID
    });
    
    const savedPet = await testPet.save();
    console.log(`✅ Created test pet with ID: ${savedPet._id}`);
    
    // Create test images
    const testImage = new Image({
      url: '/uploads/adoption/manager/image/test-image.jpg',
      caption: 'Test image',
      isPrimary: true,
      entityType: 'AdoptionPet',
      entityId: savedPet._id,
      uploadedBy: '68f637e04954afb7ee202bfe'
    });
    
    const savedImage = await testImage.save();
    savedPet.imageIds = [savedImage._id];
    await savedPet.save();
    console.log(`✅ Created test image with ID: ${savedImage._id}`);
    
    // Create test documents
    const testDocument = new Document({
      name: 'Test Document',
      type: 'application/pdf',
      url: '/uploads/adoption/manager/document/test-document.pdf',
      entityType: 'AdoptionPet',
      entityId: savedPet._id,
      uploadedBy: '68f637e04954afb7ee202bfe'
    });
    
    const savedDocument = await testDocument.save();
    savedPet.documentIds = [savedDocument._id];
    await savedPet.save();
    console.log(`✅ Created test document with ID: ${savedDocument._id}`);
    
    // Verify pet and media exist
    console.log('\n📋 BEFORE DELETION:');
    const petBefore = await AdoptionPet.findById(savedPet._id);
    const imageBefore = await Image.findById(savedImage._id);
    const documentBefore = await Document.findById(savedDocument._id);
    
    console.log(`   Pet exists: ${!!petBefore}`);
    console.log(`   Image exists: ${!!imageBefore}`);
    console.log(`   Document exists: ${!!documentBefore}`);
    
    // Perform hard delete (this would normally be done via API)
    console.log('\n🗑️  PERFORMING HARD DELETE...');
    
    // Import the delete function
    const petController = require('../modules/adoption/manager/controllers/petManagementController');
    
    // Mock request and response objects
    const mockReq = { params: { id: savedPet._id }, user: { id: '68f637e04954afb7ee202bfe' } };
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };
    
    // Call the delete function
    await petController.deletePet(mockReq, mockRes);
    
    console.log(`   Delete response status: ${mockRes.statusCode}`);
    console.log(`   Delete response data:`, mockRes.data);
    
    // Verify pet and media are deleted
    console.log('\n📋 AFTER DELETION:');
    const petAfter = await AdoptionPet.findById(savedPet._id);
    const imageAfter = await Image.findById(savedImage._id);
    const documentAfter = await Document.findById(savedDocument._id);
    
    console.log(`   Pet exists: ${!!petAfter}`);
    console.log(`   Image exists: ${!!imageAfter}`);
    console.log(`   Document exists: ${!!documentAfter}`);
    
    if (!petAfter && !imageAfter && !documentAfter) {
      console.log('\n✅ HARD DELETE TEST PASSED: All pet data successfully removed');
    } else {
      console.log('\n❌ HARD DELETE TEST FAILED: Some data still exists');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    mongoose.connection.close();
  }
}

testHardDelete();