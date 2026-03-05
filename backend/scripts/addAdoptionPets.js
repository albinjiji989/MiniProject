/**
 * Bulk Add 15 Adoption Pets Script
 * Breeds: British Shorthair, Persian Cat, German Shepherd, Golden Retriever
 * 
 * Usage: node backend/scripts/addAdoptionPets.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
const Image = require('../core/models/Image');
const Document = require('../core/models/Document');
const User = require('../core/models/User');

// ==================== CONFIGURATION ====================
// Update this to your manager email
const MANAGER_EMAIL = 'albinjiji001@gmail.com';

// ==================== PET DATA ====================
const PETS_TO_ADD = [
  // ========== BRITISH SHORTHAIR CATS ==========
  {
    species: 'Cat',
    breed: 'British Shorthair',
    gender: 'male',
    ageInMonths: 24,
    weight: 5.5,
    color: 'Blue-Gray',
    adoptionFee: 250,
    description: 'Calm and affectionate British Shorthair with beautiful blue-gray coat.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Healthy, all vaccinations up to date.',
    specialNeeds: [],
    photos: [
      'https://images.unsplash.com/photo-1556582305-0c2c3c6c6d4d?w=800',
      'https://images.unsplash.com/photo-1548546738-8509cb246ed1?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'
    ],
    compatibilityProfile: {
      size: 'medium',
      energyLevel: 2,
      exerciseNeeds: 'minimal',
      trainingNeeds: 'low',
      trainedLevel: 'basic',
      childFriendlyScore: 8,
      petFriendlyScore: 7,
      strangerFriendlyScore: 6,
      needsYard: false,
      canLiveInApartment: true,
      groomingNeeds: 'moderate',
      estimatedMonthlyCost: 100,
      temperamentTags: ['calm', 'gentle', 'independent'],
      noiseLevel: 'quiet',
      canBeLeftAlone: true,
      maxHoursAlone: 10,
      requiresExperiencedOwner: false
    }
  },
  {
    species: 'Cat',
    breed: 'British Shorthair',
    gender: 'female',
    ageInMonths: 18,
    weight: 4.8,
    color: 'Silver Tabby',
    adoptionFee: 280,
    description: 'Sweet and playful British Shorthair with stunning silver tabby markings.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Excellent health, spayed.',
    specialNeeds: [],
    photos: [
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800',
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
    ],
    compatibilityProfile: {
      size: 'medium',
      energyLevel: 3,
      exerciseNeeds: 'minimal',
      trainingNeeds: 'low',
      trainedLevel: 'basic',
      childFriendlyScore: 9,
      petFriendlyScore: 8,
      strangerFriendlyScore: 7,
      needsYard: false,
      canLiveInApartment: true,
      groomingNeeds: 'moderate',
      estimatedMonthlyCost: 110,
      temperamentTags: ['playful', 'affectionate', 'social'],
      noiseLevel: 'quiet',
      canBeLeftAlone: true,
      maxHoursAlone: 8,
      requiresExperiencedOwner: false
    }
  },
  {
    species: 'Cat',
    breed: 'British Shorthair',
    gender: 'male',
    ageInMonths: 36,
    weight: 6.2,
    color: 'Cream',
    adoptionFee: 220,
    description: 'Mature and dignified British Shorthair with creamy coat.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Healthy, neutered.',
    specialNeeds: [],
    photos: [
      'https://images.unsplash.com/photo-1573865526739-10c1d3a1e8d4?w=800',
      'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'
    ],
    compatibilityProfile: {
      size: 'medium',
      energyLevel: 2,
      exerciseNeeds: 'minimal',
      trainingNeeds: 'low',
      trainedLevel: 'intermediate',
      childFriendlyScore: 7,
      petFriendlyScore: 6,
      strangerFriendlyScore: 5,
      needsYard: false,
      canLiveInApartment: true,
      groomingNeeds: 'moderate',
      estimatedMonthlyCost: 95,
      temperamentTags: ['calm', 'reserved', 'gentle'],
      noiseLevel: 'quiet',
      canBeLeftAlone: true,
      maxHoursAlone: 12,
      requiresExperiencedOwner: false
    }
  },
  {
    species: 'Cat',
    breed: 'British Shorthair',
    gender: 'female',
    ageInMonths: 12,
    weight: 4.2,
    color: 'Black',
    adoptionFee: 300,
    description: 'Young and energetic British Shorthair with sleek black coat.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'All vaccinations completed.',
    specialNeeds: [],
    photos: [
      'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
    ],
    compatibilityProfile: {
      size: 'medium',
      energyLevel: 4,
      exerciseNeeds: 'moderate',
      trainingNeeds: 'moderate',
      trainedLevel: 'basic',
      childFriendlyScore: 8,
      petFriendlyScore: 7,
      strangerFriendlyScore: 6,
      needsYard: false,
      canLiveInApartment: true,
      groomingNeeds: 'low',
      estimatedMonthlyCost: 105,
      temperamentTags: ['playful', 'curious', 'energetic'],
      noiseLevel: 'moderate',
      canBeLeftAlone: true,
      maxHoursAlone: 6,
      requiresExperiencedOwner: false
    }
  },

  // ========== PERSIAN CATS ==========
  {
    species: 'Cat',
    breed: 'Persian Cat',
    gender: 'female',
    ageInMonths: 30,
    weight: 4.5,
    color: 'White',
    adoptionFee: 350,
    description: 'Elegant Persian with luxurious white coat and sweet personality.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Healthy, requires regular grooming.',
    specialNeeds: ['Regular grooming'],
    photos: [
      'https://images.unsplash.com/photo-1568152950566-c1bf43f4ab28?w=800',
      'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
    ],
    compatibilityProfile: {
      size: 'medium',
      energyLevel: 1,
      exerciseNeeds: 'minimal',
      trainingNeeds: 'low',
      trainedLevel: 'basic',
      childFriendlyScore: 6,
      petFriendlyScore: 5,
      strangerFriendlyScore: 4,
      needsYard: false,
      canLiveInApartment: true,
      groomingNeeds: 'high',
      estimatedMonthlyCost: 150,
      temperamentTags: ['calm', 'gentle', 'quiet'],
      noiseLevel: 'quiet',
      canBeLeftAlone: true,
      maxHoursAlone: 8,
      requiresExperiencedOwner: false
    }
  },
  {
    species: 'Cat',
    breed: 'Persian Cat',
    gender: 'male',
    ageInMonths: 24,
    weight: 5.0,
    color: 'Orange Tabby',
    adoptionFee: 320,
    description: 'Stunning Persian with orange tabby coat and calm demeanor.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Healthy, neutered.',
    specialNeeds: ['Daily brushing'],
    photos: [
      'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400'
    ],
    compatibilityProfile: {
      size: 'medium',
      energyLevel: 2,
      exerciseNeeds: 'minimal',
      trainingNeeds: 'low',
      trainedLevel: 'basic',
      childFriendlyScore: 7,
      petFriendlyScore: 6,
      strangerFriendlyScore: 5,
      needsYard: false,
      canLiveInApartment: true,
      groomingNeeds: 'high',
      estimatedMonthlyCost: 145,
      temperamentTags: ['calm', 'affectionate', 'laid-back'],
      noiseLevel: 'quiet',
      canBeLeftAlone: true,
      maxHoursAlone: 10,
      requiresExperiencedOwner: false
    }
  },
  {
    species: 'Cat',
    breed: 'Persian Cat',
    gender: 'female',
    ageInMonths: 15,
    weight: 4.0,
    color: 'Silver',
    adoptionFee: 380,
    description: 'Beautiful young Persian with silver coat and bright eyes.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Excellent health, all shots current.',
    specialNeeds: ['Professional grooming recommended'],
    photos: [
      'https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=800',
      'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
    ],
    compatibilityProfile: {
      size: 'medium',
      energyLevel: 2,
      exerciseNeeds: 'minimal',
      trainingNeeds: 'low',
      trainedLevel: 'untrained',
      childFriendlyScore: 8,
      petFriendlyScore: 7,
      strangerFriendlyScore: 6,
      needsYard: false,
      canLiveInApartment: true,
      groomingNeeds: 'high',
      estimatedMonthlyCost: 160,
      temperamentTags: ['gentle', 'docile', 'sweet'],
      noiseLevel: 'quiet',
      canBeLeftAlone: true,
      maxHoursAlone: 8,
      requiresExperiencedOwner: false
    }
  },
  {
    species: 'Cat',
    breed: 'Persian Cat',
    gender: 'male',
    ageInMonths: 42,
    weight: 5.5,
    color: 'Chocolate',
    adoptionFee: 290,
    description: 'Mature Persian with rich chocolate coat and serene temperament.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Healthy senior, well-maintained.',
    specialNeeds: [],
    photos: [
      'https://images.unsplash.com/photo-1571988840298-3b5301d5109b?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400'
    ],
    compatibilityProfile: {
      size: 'medium',
      energyLevel: 1,
      exerciseNeeds: 'minimal',
      trainingNeeds: 'low',
      trainedLevel: 'intermediate',
      childFriendlyScore: 6,
      petFriendlyScore: 5,
      strangerFriendlyScore: 4,
      needsYard: false,
      canLiveInApartment: true,
      groomingNeeds: 'high',
      estimatedMonthlyCost: 140,
      temperamentTags: ['calm', 'mature', 'reserved'],
      noiseLevel: 'quiet',
      canBeLeftAlone: true,
      maxHoursAlone: 10,
      requiresExperiencedOwner: false
    }
  },

  // ========== GERMAN SHEPHERD DOGS ==========
  {
    species: 'Dog',
    breed: 'German Shepherd',
    gender: 'male',
    ageInMonths: 36,
    weight: 35,
    color: 'Black and Tan',
    adoptionFee: 400,
    description: 'Intelligent and loyal German Shepherd with excellent training.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Healthy, all vaccinations current, neutered.',
    specialNeeds: [],
    photos: [
      'https://images.unsplash.com/photo-1568572933382-74d440642117?w=800',
      'https://images.unsplash.com/photo-1590005024862-6b67679a729b?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400'
    ],
    compatibilityProfile: {
      size: 'large',
      energyLevel: 4,
      exerciseNeeds: 'high',
      trainingNeeds: 'moderate',
      trainedLevel: 'advanced',
      childFriendlyScore: 8,
      petFriendlyScore: 6,
      strangerFriendlyScore: 5,
      needsYard: true,
      canLiveInApartment: false,
      groomingNeeds: 'moderate',
      estimatedMonthlyCost: 180,
      temperamentTags: ['intelligent', 'loyal', 'protective'],
      noiseLevel: 'moderate',
      canBeLeftAlone: true,
      maxHoursAlone: 4,
      requiresExperiencedOwner: true
    }
  },
  {
    species: 'Dog',
    breed: 'German Shepherd',
    gender: 'female',
    ageInMonths: 24,
    weight: 28,
    color: 'Sable',
    adoptionFee: 420,
    description: 'Active and alert German Shepherd female with great temperament.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Excellent health, spayed.',
    specialNeeds: [],
    photos: [
      'https://images.unsplash.com/photo-1544699544-1f89b02cc94c?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400'
    ],
    compatibilityProfile: {
      size: 'large',
      energyLevel: 5,
      exerciseNeeds: 'very_high',
      trainingNeeds: 'high',
      trainedLevel: 'intermediate',
      childFriendlyScore: 7,
      petFriendlyScore: 6,
      strangerFriendlyScore: 4,
      needsYard: true,
      canLiveInApartment: false,
      groomingNeeds: 'moderate',
      estimatedMonthlyCost: 200,
      temperamentTags: ['energetic', 'intelligent', 'alert'],
      noiseLevel: 'vocal',
      canBeLeftAlone: false,
      maxHoursAlone: 3,
      requiresExperiencedOwner: true
    }
  },
  {
    species: 'Dog',
    breed: 'German Shepherd',
    gender: 'male',
    ageInMonths: 60,
    weight: 38,
    color: 'Black',
    adoptionFee: 350,
    description: 'Mature German Shepherd with calm demeanor and excellent manners.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Senior dog in good health.',
    specialNeeds: [],
    photos: [
      'https://images.unsplash.com/photo-1582456891923-a600b4f08632?w=800',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1558203728-00f45181dd84?w=400'
    ],
    compatibilityProfile: {
      size: 'large',
      energyLevel: 3,
      exerciseNeeds: 'moderate',
      trainingNeeds: 'low',
      trainedLevel: 'advanced',
      childFriendlyScore: 9,
      petFriendlyScore: 7,
      strangerFriendlyScore: 6,
      needsYard: true,
      canLiveInApartment: false,
      groomingNeeds: 'moderate',
      estimatedMonthlyCost: 170,
      temperamentTags: ['calm', 'loyal', 'gentle'],
      noiseLevel: 'moderate',
      canBeLeftAlone: true,
      maxHoursAlone: 6,
      requiresExperiencedOwner: false
    }
  },
  {
    species: 'Dog',
    breed: 'German Shepherd',
    gender: 'female',
    ageInMonths: 18,
    weight: 26,
    color: 'Black and Tan',
    adoptionFee: 450,
    description: 'Young, energetic German Shepherd ready for training and adventures.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Healthy young dog, all shots current.',
    specialNeeds: [],
    photos: [
      'https://images.unsplash.com/photo-1598429419236-0b0b0b0b0b0b?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1597223557154-721c1cecc4b0?w=400'
    ],
    compatibilityProfile: {
      size: 'large',
      energyLevel: 5,
      exerciseNeeds: 'very_high',
      trainingNeeds: 'high',
      trainedLevel: 'basic',
      childFriendlyScore: 8,
      petFriendlyScore: 7,
      strangerFriendlyScore: 5,
      needsYard: true,
      canLiveInApartment: false,
      groomingNeeds: 'moderate',
      estimatedMonthlyCost: 190,
      temperamentTags: ['playful', 'energetic', 'trainable'],
      noiseLevel: 'moderate',
      canBeLeftAlone: false,
      maxHoursAlone: 4,
      requiresExperiencedOwner: true
    }
  },

  // ========== GOLDEN RETRIEVER DOGS ==========
  {
    species: 'Dog',
    breed: 'Golden Retriever',
    gender: 'male',
    ageInMonths: 30,
    weight: 32,
    color: 'Golden',
    adoptionFee: 380,
    description: 'Friendly and affectionate Golden Retriever, great family dog.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Healthy, neutered, loves everyone.',
    specialNeeds: [],
    photos: [
      'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800',
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=400',
      'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400'
    ],
    compatibilityProfile: {
      size: 'large',
      energyLevel: 4,
      exerciseNeeds: 'high',
      trainingNeeds: 'moderate',
      trainedLevel: 'intermediate',
      childFriendlyScore: 10,
      petFriendlyScore: 9,
      strangerFriendlyScore: 10,
      needsYard: true,
      canLiveInApartment: false,
      groomingNeeds: 'moderate',
      estimatedMonthlyCost: 175,
      temperamentTags: ['friendly', 'gentle', 'playful'],
      noiseLevel: 'moderate',
      canBeLeftAlone: true,
      maxHoursAlone: 5,
      requiresExperiencedOwner: false
    }
  },
  {
    species: 'Dog',
    breed: 'Golden Retriever',
    gender: 'female',
    ageInMonths: 20,
    weight: 28,
    color: 'Light Golden',
    adoptionFee: 400,
    description: 'Sweet and playful Golden Retriever puppy with tons of energy.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Healthy, spayed, loves to play.',
    specialNeeds: [],
    photos: [
      'https://images.unsplash.com/photo-1612536019276-eaf430747675?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400'
    ],
    compatibilityProfile: {
      size: 'large',
      energyLevel: 5,
      exerciseNeeds: 'very_high',
      trainingNeeds: 'moderate',
      trainedLevel: 'basic',
      childFriendlyScore: 10,
      petFriendlyScore: 10,
      strangerFriendlyScore: 10,
      needsYard: true,
      canLiveInApartment: false,
      groomingNeeds: 'moderate',
      estimatedMonthlyCost: 185,
      temperamentTags: ['playful', 'energetic', 'friendly'],
      noiseLevel: 'moderate',
      canBeLeftAlone: true,
      maxHoursAlone: 4,
      requiresExperiencedOwner: false
    }
  },
  {
    species: 'Dog',
    breed: 'Golden Retriever',
    gender: 'male',
    ageInMonths: 48,
    weight: 34,
    color: 'Dark Golden',
    adoptionFee: 340,
    description: 'Mature and calm Golden Retriever, perfect companion.',
    vaccinationStatus: 'up_to_date',
    healthHistory: 'Senior dog in excellent condition.',
    specialNeeds: [],
    photos: [
      'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800',
      'https://images.unsplash.com/photo-1554224311-beee298c02d8?w=800'
    ],
    documents: [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'
    ],
    compatibilityProfile: {
      size: 'large',
      energyLevel: 3,
      exerciseNeeds: 'moderate',
      trainingNeeds: 'low',
      trainedLevel: 'advanced',
      childFriendlyScore: 10,
      petFriendlyScore: 9,
      strangerFriendlyScore: 9,
      needsYard: true,
      canLiveInApartment: false,
      groomingNeeds: 'moderate',
      estimatedMonthlyCost: 165,
      temperamentTags: ['calm', 'gentle', 'loyal'],
      noiseLevel: 'quiet',
      canBeLeftAlone: true,
      maxHoursAlone: 6,
      requiresExperiencedOwner: false
    }
  }
];

// ==================== HELPER FUNCTIONS ====================

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petconnect');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Generate unique pet code (3 letters + 5 digits)
const generatePetCode = (name, species) => {
  const letters = (name || species.substring(0, 3)).substring(0, 3).toUpperCase().padEnd(3, 'X');
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `${letters}${digits}`;
};

// Calculate date of birth from age in months
const calculateDOB = (ageInMonths) => {
  const dob = new Date();
  dob.setMonth(dob.getMonth() - ageInMonths);
  return dob;
};

// Upload image from URL
const uploadImageFromURL = async (url, altText = '') => {
  try {
    const image = new Image({
      url: url,
      caption: altText || 'Pet photo',
      entityType: 'AdoptionPet',
      module: 'adoption',
      role: 'manager',
      uploadedAt: new Date(),
      isPrimary: false
    });
    await image.save();
    return image._id;
  } catch (error) {
    console.error('❌ Error uploading image:', error.message);
    return null;
  }
};

// Upload document from URL (images used as documents)
const uploadDocumentFromURL = async (url, name = 'Document', type = 'image/jpeg') => {
  try {
    const document = new Document({
      url: url,
      name: name,
      type: type,
      entityType: 'AdoptionPet',
      uploadedAt: new Date()
    });
    await document.save();
    return document._id;
  } catch (error) {
    console.error('❌ Error uploading document:', error.message);
    return null;
  }
};

// Add a single pet
const addPet = async (petData, manager) => {
  try {
    console.log(`\n📝 Adding pet: ${petData.species} - ${petData.breed}...`);
    
    // Calculate DOB from age
    const dateOfBirth = calculateDOB(petData.ageInMonths);
    
    // Generate pet code
    const petCode = generatePetCode(petData.breed, petData.species);
    
    // Upload photos
    const imageIds = [];
    if (petData.photos && petData.photos.length > 0) {
      console.log(`📸 Processing ${petData.photos.length} photos...`);
      for (const photoUrl of petData.photos) {
        const imageId = await uploadImageFromURL(photoUrl, `${petData.breed} photo`);
        if (imageId) imageIds.push(imageId);
      }
      console.log(`✅ Uploaded ${imageIds.length} photos`);
    }
    
    // Upload documents
    const documentIds = [];
    if (petData.documents && petData.documents.length > 0) {
      console.log(`📄 Processing ${petData.documents.length} documents...`);
      for (let i = 0; i < petData.documents.length; i++) {
        const docUrl = petData.documents[i];
        const documentId = await uploadDocumentFromURL(
          docUrl, 
          `${petData.breed} Document ${i + 1}`,
          'image/jpeg'
        );
        if (documentId) documentIds.push(documentId);
      }
      console.log(`✅ Uploaded ${documentIds.length} documents`);
    }
    
    // Create pet
    const pet = new AdoptionPet({
      name: '', // No name as per requirement
      species: petData.species,
      breed: petData.breed,
      gender: petData.gender,
      dateOfBirth: dateOfBirth,
      dobAccuracy: 'estimated',
      weight: petData.weight,
      color: petData.color,
      adoptionFee: petData.adoptionFee,
      description: petData.description,
      vaccinationStatus: petData.vaccinationStatus,
      healthHistory: petData.healthHistory,
      specialNeeds: petData.specialNeeds || [],
      compatibilityProfile: petData.compatibilityProfile,
      imageIds: imageIds,
      documentIds: documentIds,
      status: 'available',
      petCode: petCode,
      createdBy: manager._id,
      isActive: true
    });
    
    await pet.save();
    
    console.log(`🎉 Successfully added: ${petData.breed}`);
    console.log(`   - Species: ${petData.species}`);
    console.log(`   - Breed: ${petData.breed}`);
    console.log(`   - Gender: ${petData.gender}`);
    console.log(`   - Age: ${petData.ageInMonths} months`);
    console.log(`   - Weight: ${petData.weight} kg`);
    console.log(`   - Adoption Fee: $${petData.adoptionFee}`);
    console.log(`   - Energy Level: ${petData.compatibilityProfile.energyLevel}/5`);
    console.log(`   - Child Friendly: ${petData.compatibilityProfile.childFriendlyScore}/10`);
    console.log(`   - Pet Code: ${petCode}`);
    console.log(`   - Photos: ${imageIds.length}`);
    console.log(`   - Documents: ${documentIds.length}`);
    
    return { success: true, pet, petCode };
  } catch (error) {
    console.error(`❌ Error adding pet:`, error.message);
    return { success: false, error: error.message };
  }
};

// ==================== MAIN SCRIPT ====================
const main = async () => {
  try {
    console.log('\n🚀 Starting bulk pet addition script...\n');
    
    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await connectDB();
    
    // Find manager
    console.log(`\n👤 Looking for manager: ${MANAGER_EMAIL}...`);
    const manager = await User.findOne({ email: MANAGER_EMAIL });
    
    if (!manager) {
      console.error(`❌ Manager not found with email: ${MANAGER_EMAIL}`);
      console.log('\n💡 Please update MANAGER_EMAIL in the script or create a manager account first.');
      process.exit(1);
    }
    
    console.log(`✅ Found manager: ${manager.name} (${manager.email})`);
    
    // Add pets
    console.log(`\n📋 Adding ${PETS_TO_ADD.length} pets...`);
    console.log('═'.repeat(60));
    
    const results = [];
    const addedPets = [];
    
    for (const petData of PETS_TO_ADD) {
      const result = await addPet(petData, manager);
      results.push(result);
      if (result.success) {
        addedPets.push({
          breed: petData.breed,
          species: petData.species,
          code: result.petCode
        });
      }
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    const successCount = results.filter(r => r.success).length;
    console.log(`\n🎉 SUMMARY: Successfully added ${successCount} out of ${PETS_TO_ADD.length} pets!`);
    
    if (addedPets.length > 0) {
      console.log('\n📊 Added pets:');
      addedPets.forEach((pet, index) => {
        console.log(`   ${index + 1}. ${pet.breed} (${pet.species}) - Code: ${pet.code}`);
      });
    }
    
    const failedCount = results.filter(r => !r.success).length;
    if (failedCount > 0) {
      console.log(`\n⚠️  Failed to add ${failedCount} pets.`);
    }
    
    console.log('\n✅ Script completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Visit http://localhost:5173/manager/adoption/pets to view pets');
    console.log('   2. Users can now see these pets in Smart Matches');
    console.log('   3. Once you have 30+ pets, train K-Means clustering');
    console.log('   4. Generate interactions to train collaborative filtering');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    console.log('\n👋 Database connection closed');
    await mongoose.connection.close();
  }
};

// Run the script
main();