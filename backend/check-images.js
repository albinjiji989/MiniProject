const mongoose = require('mongoose');
const Image = require('./core/models/Image');

mongoose.connect('mongodb://localhost:27017/petwelfare', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

setTimeout(async () => {
  try {
    const images = await Image.find({ entityType: 'PetInventoryItem' }).limit(5);
    console.log('Sample images:', images.map(i => ({ 
      id: i._id, 
      url: i.url, 
      entityType: i.entityType,
      entityId: i.entityId
    })));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}, 2000);