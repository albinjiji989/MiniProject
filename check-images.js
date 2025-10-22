const mongoose = require('mongoose');
const path = require('path');

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/petcare';
console.log('Connecting to:', mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
  console.log('Connected to database');
  
  // Define simplified schemas
  const imageSchema = new mongoose.Schema({
    url: String,
    caption: String,
    isPrimary: Boolean,
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    module: String,
    role: String,
    uploadedBy: mongoose.Schema.Types.ObjectId
  }, { timestamps: true });
  
  const adoptionPetSchema = new mongoose.Schema({
    name: String,
    breed: String,
    species: String,
    age: Number,
    ageUnit: String,
    gender: String,
    color: String,
    weight: Number,
    healthStatus: String,
    vaccinationStatus: String,
    temperament: String,
    description: String,
    adoptionFee: Number,
    petCode: String,
    imageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
    documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    status: String,
    isActive: Boolean,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }, { timestamps: true });
  
  // Add virtuals
  adoptionPetSchema.virtual('images', {
    ref: 'Image',
    localField: 'imageIds',
    foreignField: '_id',
    justOne: false
  });
  
  const Image = mongoose.model('Image', imageSchema);
  const AdoptionPet = mongoose.model('AdoptionPet', adoptionPetSchema);
  
  try {
    // Check all images
    const images = await Image.find({ entityType: 'AdoptionPet' });
    console.log(`Found ${images.length} adoption images:`);
    images.forEach(img => {
      console.log(`- ${img.url} (entityId: ${img.entityId})`);
    });
    
    // Check a specific pet
    const petId = '68f7c4f4014593ee83a598b4';
    const pet = await AdoptionPet.findById(petId);
    
    if (pet) {
      console.log(`\nPet ${pet.name} (${pet._id}):`);
      console.log(`Image IDs:`, pet.imageIds);
      console.log(`Image IDs count:`, pet.imageIds ? pet.imageIds.length : 0);
      
      // Try to populate images
      await pet.populate('images');
      console.log(`Populated images:`, pet.images);
      console.log(`Populated images count:`, pet.images ? pet.images.length : 0);
    } else {
      console.log('Pet not found');
    }
    
    // Check all pets with imageIds
    const petsWithImageIds = await AdoptionPet.find({ 
      imageIds: { $exists: true, $ne: [] } 
    }).select('_id name imageIds');
    
    console.log(`\nPets with image IDs:`);
    petsWithImageIds.forEach(p => {
      console.log(`${p.name} (${p._id}): ${p.imageIds.length} images`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
});