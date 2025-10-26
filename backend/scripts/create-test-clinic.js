// Script to create a test clinic
require('dotenv').config();
const mongoose = require('mongoose');
const Veterinary = require('../modules/veterinary/models/Veterinary');

// Use the same connection logic as the main app
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env file');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const createTestClinic = async () => {
  try {
    console.log('Creating test clinic...');
    
    const clinicData = {
      name: 'Paws Vet Clinic',
      address: {
        street: '123 Animal Street',
        city: 'Pet City',
        state: 'Pet State',
        zipCode: '12345',
        country: 'Pet Country'
      },
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716] // Bangalore coordinates as example
      },
      contact: {
        phone: '+1234567890',
        email: 'clinic@example.com'
      },
      services: ['General Checkup', 'Vaccination', 'Surgery'],
      storeId: 'VET195159',
      storeName: 'Paws Vet',
      isActive: true
    };
    
    const clinic = new Veterinary(clinicData);
    await clinic.save();
    
    console.log('Test clinic created successfully:', clinic._id);
    console.log('Clinic name:', clinic.name);
    console.log('Store ID:', clinic.storeId);
    console.log('Store Name:', clinic.storeName);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test clinic:', error);
    process.exit(1);
  }
};

// Connect to database and create clinic
connectDB().then(() => {
  createTestClinic();
});