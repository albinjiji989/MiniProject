// Simple test to verify the image fix logic
const mongoose = require('mongoose');

// Mock Pet object (what we get from database)
const mockPet = {
  _id: '68fd3a70550bd93bc40666c8',
  name: 'Pet',
  petCode: 'OHB56406',
  imageIds: [], // Empty initially
  images: []    // Empty initially
};

// Mock Registry data (what we get from PetRegistry)
const mockRegistryData = {
  imageIds: ['68fd1cb4e33ab9f6177fe4a9'],
  images: [{
    _id: '68fd1cb4e33ab9f6177fe4a9',
    url: 'https://res.cloudinary.com/dio7ilktz/image/upload/v1761418419/petshop/manager/pets/manager/image_0-68fd1c83e33ab9f6177fe409-1761418417352-f809469e6ac46f611ec14c670a2e243e.jpg',
    caption: '',
    isPrimary: true
  }]
};

console.log('=== Simple Image Fix Test ===');
console.log('Before fix:');
console.log('Pet images length:', mockPet.images.length);
console.log('Pet imageIds length:', mockPet.imageIds.length);

// Apply the fix logic
if (mockPet && (!mockPet.images || mockPet.images.length === 0) && mockPet.petCode) {
  console.log('\nApplying fix...');
  
  // Simulate registry lookup
  if (mockRegistryData.images && mockRegistryData.images.length > 0) {
    console.log('Registry has images, applying fix...');
    mockPet.images = mockRegistryData.images;
    mockPet.imageIds = mockRegistryData.imageIds;
  }
}

console.log('\nAfter fix:');
console.log('Pet images length:', mockPet.images.length);
console.log('Pet imageIds length:', mockPet.imageIds.length);

if (mockPet.images.length > 0) {
  console.log('First image URL:', mockPet.images[0].url);
}

console.log('\n=== Test complete ===');