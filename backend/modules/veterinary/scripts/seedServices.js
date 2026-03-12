const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Veterinary = require('../models/Veterinary');
const VeterinaryService = require('../models/VeterinaryService');
const User = require('../../../core/models/User');
const seedVeterinaryServices = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petcare', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    // Find or create a default admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.findOne({ role: 'veterinary_manager' });
    }
    if (!adminUser) {
      adminUser = await User.findOne();
    }
    
    if (!adminUser) {
      console.error('No user found in database. Please create a user first.');
      process.exit(1);
    }

    console.log('Using user:', adminUser.email);

    // Find or create default veterinary clinic
    let clinic = await Veterinary.findOne({ isActive: true });

    if (!clinic) {
      console.log('Creating default veterinary clinic...');
      clinic = new Veterinary({
        name: 'PetCare Veterinary Clinic',
        storeName: 'PetCare Veterinary Clinic',
        storeId: `VET-${Date.now()}`,
        address: {
          street: '123 Pet Care Street',
          city: 'Pet City',
          state: 'Pet State',
          zipCode: '12345',
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716] // Bangalore coordinates
        },
        contact: {
          phone: '+91-9876543210',
          email: 'info@petcareclinic.com',
          website: 'www.petcareclinic.com'
        },
        operatingHours: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '09:00', close: '14:00', closed: false },
          sunday: { open: '09:00', close: '13:00', closed: true }
        },
        isActive: true,
        createdBy: adminUser._id
      });
      await clinic.save();
      console.log('✓ Clinic created:', clinic.name);
    } else {
      console.log('✓ Using existing clinic:', clinic.name);
    }

    // Check if services already exist
    const existingServices = await VeterinaryService.find({ storeId: clinic.storeId });
    if (existingServices.length > 0) {
      console.log(`Found ${existingServices.length} existing services. Skipping seed.`);
      console.log('To re-seed, delete existing services first.');
      process.exit(0);
    }

    // Default services to seed
    const defaultServices = [
      {
        name: 'Medical Consultation',
        description: 'General health consultation and medical advice for your pet',
        price: 500,
        duration: 30,
        category: 'consultation',
        requirements: 'Bring previous medical records if available',
        benefits: ['Expert diagnosis', 'Treatment recommendations', 'Health advice']
      },
      {
        name: 'Vaccination',
        description: 'Vaccination and immunization services for disease prevention',
        price: 800,
        duration: 20,
        category: 'vaccination',
        requirements: 'Pet should be healthy at time of vaccination',
        benefits: ['Disease prevention', 'Vaccination certificate', 'Immunity boost']
      },
      {
        name: 'Health Checkup',
        description: 'Complete physical examination and health assessment',
        price: 1200,
        duration: 45,
        category: 'checkup',
        requirements: 'Fasting may be required for some tests',
        benefits: ['Comprehensive examination', 'Early disease detection', 'Health report']
      },
      {
        name: 'Emergency Care',
        description: 'Urgent medical attention and emergency treatment',
        price: 2000,
        duration: 60,
        category: 'emergency',
        requirements: 'Immediate attention for critical cases',
        benefits: ['24/7 availability', 'Immediate care', 'Life-saving treatment']
      },
      {
        name: 'Dental Checkup',
        description: 'Oral examination and dental care for your pet',
        price: 1000,
        duration: 30,
        category: 'dental',
        requirements: 'Pet may need to be sedated',
        benefits: ['Dental cleaning', 'Oral health assessment', 'Tooth extraction if needed']
      },
      {
        name: 'Grooming Service',
        description: 'Professional grooming and hygiene care',
        price: 600,
        duration: 60,
        category: 'grooming',
        requirements: 'Pet should be calm and cooperative',
        benefits: ['Bath and dry', 'Nail trimming', 'Ear cleaning', 'Coat brushing']
      },
      {
        name: 'Surgery Consultation',
        description: 'Pre-surgery consultation and planning',
        price: 1500,
        duration: 45,
        category: 'surgery',
        requirements: 'Previous medical records required',
        benefits: ['Surgery planning', 'Risk assessment', 'Post-op care guidance']
      },
      {
        name: 'Diagnostic Tests',
        description: 'Laboratory tests and diagnostic procedures',
        price: 1800,
        duration: 30,
        category: 'diagnostic',
        requirements: 'Fasting required for some tests',
        benefits: ['Blood tests', 'X-rays', 'Ultrasound', 'Lab reports']
      }
    ];

    // Create services
    console.log('\nCreating veterinary services...');
    for (const serviceData of defaultServices) {
      const service = new VeterinaryService({
        ...serviceData,
        storeId: clinic.storeId,
        storeName: clinic.name,
        createdBy: adminUser._id,
        status: 'active',
        isActive: true
      });
      await service.save();
      console.log(`✓ Created: ${service.name} - ₹${service.price} (${service.duration} mins)`);
    }

    console.log('\n✅ Successfully seeded veterinary services!');
    console.log(`Total services created: ${defaultServices.length}`);
    console.log(`Clinic: ${clinic.name}`);
    console.log(`Store ID: ${clinic.storeId}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding services:', error);
    process.exit(1);
  }
};

// Run the seed function
seedVeterinaryServices();
