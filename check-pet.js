const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use the same connection string as in your backend
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petwelfare', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Adoption Pet Model
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
  status: { type: String, default: 'available' },
  isActive: { type: Boolean, default: true },
  imageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adopterUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adoptionDate: Date,
}, { timestamps: true });

const AdoptionPet = mongoose.model('AdoptionPet', adoptionPetSchema);

// Check if a pet exists
const checkPet = async (petId) => {
  try {
    await connectDB();
    
    console.log(`Checking pet with ID: ${petId}`);
    
    // Try to find the pet
    const pet = await AdoptionPet.findById(petId);
    
    if (pet) {
      console.log('Pet found:');
      console.log(`  ID: ${pet._id}`);
      console.log(`  Name: ${pet.name}`);
      console.log(`  Status: ${pet.status}`);
      console.log(`  Active: ${pet.isActive}`);
      console.log(`  Species: ${pet.species}`);
      console.log(`  Breed: ${pet.breed}`);
    } else {
      console.log('Pet not found in database');
      
      // Let's check if there are any pets in the database
      const petCount = await AdoptionPet.countDocuments();
      console.log(`Total adoption pets in database: ${petCount}`);
      
      if (petCount > 0) {
        const samplePets = await AdoptionPet.find().limit(5).select('_id name status isActive');
        console.log('Sample pets:');
        samplePets.forEach(p => {
          console.log(`  ${p._id} - ${p.name} (status: ${p.status}, active: ${p.isActive})`);
        });
      }
    }
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error checking pet:', error.message);
    mongoose.connection.close();
  }
};

// Get the pet ID from command line arguments
const petId = process.argv[2] || '68f74a849867d88ea26b5b1b';

checkPet(petId);