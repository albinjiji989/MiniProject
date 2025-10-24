const mongoose = require('mongoose');

// Connect to database
const connectDB = require('./core/db');
connectDB().then(async () => {
  // Load models
  require('./core/models/Image');
  require('./modules/petshop/manager/models/PetInventoryItem');
  
  const Image = mongoose.model('Image');
  const PetInventoryItem = mongoose.model('PetInventoryItem');
  
  // Check images
  console.log('=== Checking Images ===');
  const images = await Image.find({ entityType: 'PetInventoryItem' }).limit(5);
  console.log('Found images:', images.length);
  images.forEach(img => {
    console.log(`- Image ID: ${img._id}`);
    console.log(`  URL: ${img.url}`);
    console.log(`  Entity ID: ${img.entityId}`);
    console.log(`  File exists: ${require('fs').existsSync(__dirname + '/..' + img.url) ? 'Yes' : 'No'}`);
    console.log('---');
  });
  
  // Check inventory items with images
  console.log('=== Checking Inventory Items ===');
  const items = await PetInventoryItem.find({ imageIds: { $exists: true, $ne: [] } })
    .populate('imageIds')
    .limit(3);
  console.log('Found items with images:', items.length);
  items.forEach(item => {
    console.log(`- Item ID: ${item._id}`);
    console.log(`  Name: ${item.name || 'Unnamed'}`);
    console.log(`  Status: ${item.status}`);
    console.log(`  Images count: ${item.imageIds ? item.imageIds.length : 0}`);
    if (item.imageIds && item.imageIds.length > 0) {
      item.imageIds.forEach((img, idx) => {
        console.log(`  Image ${idx + 1}: ${img.url}`);
      });
    }
    console.log('---');
  });
  
  process.exit(0);
});