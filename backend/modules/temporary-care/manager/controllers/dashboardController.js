const User = require('../../../../core/models/User');
const TemporaryCareApplication = require('../../models/TemporaryCareApplication');
const Pet = require('../../../../core/models/Pet');
const AdoptionPet = require('../../../adoption/manager/models/AdoptionPet');
const Species = require('../../../../core/models/Species');
const Breed = require('../../../../core/models/Breed');
const TemporaryCareCenter = require('../models/TemporaryCareCenter');

// Get temporary care manager dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const managerId = req.user.id;

    // Mock stats for now - you can connect to real data later
    const stats = {
      activeBookings: 24,
      pendingBookings: 7,
      totalCapacity: 50,
      caregiversCount: 12,
      occupancyRate: 72,
      monthlyRevenue: 38000,
      weeklyBookings: [
        { day: 'Mon', count: 8 },
        { day: 'Tue', count: 10 },
        { day: 'Wed', count: 7 },
        { day: 'Thu', count: 12 },
        { day: 'Fri', count: 9 },
        { day: 'Sat', count: 15 },
        { day: 'Sun', count: 11 }
      ],
      recentBookings: []
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Temporary care dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
};

// Get bookings list
const getBookings = async (req, res) => {
  try {
    // Mock data - replace with real database query
    const bookings = [];

    res.json({
      success: true,
      data: {
        bookings,
        total: 0
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
};

// Get facilities list
const getFacilities = async (req, res) => {
  try {
    // Mock data - replace with real database query
    const facilities = [
      { _id: '1', name: 'Room A', capacity: 5, occupied: 3, type: 'Standard', status: 'active' },
      { _id: '2', name: 'Room B', capacity: 8, occupied: 6, type: 'Deluxe', status: 'active' },
      { _id: '3', name: 'Room C', capacity: 10, occupied: 8, type: 'Premium', status: 'active' },
      { _id: '4', name: 'Room D', capacity: 4, occupied: 2, type: 'Standard', status: 'active' }
    ];

    res.json({
      success: true,
      data: {
        facilities,
        total: facilities.length
      }
    });
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch facilities'
    });
  }
};

// Get caregivers list
const getCaregivers = async (req, res) => {
  try {
    // Mock data - replace with real database query
    const caregivers = [];

    res.json({
      success: true,
      data: {
        caregivers,
        total: 0
      }
    });
  } catch (error) {
    console.error('Get caregivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch caregivers'
    });
  }
};

// Get all pets currently in care (inboard pets)
const getInboardPets = async (req, res) => {
  console.log('🚀 getInboardPets API CALLED');
  try {
    // Get manager's center - use req.user._id like in applicationManagerController
    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    
    if (!center) {
      console.log('⚠️  No center found for manager:', req.user._id);
      return res.json({
        success: true,
        data: {
          pets: [],
          total: 0,
          centers: [],
          message: 'No care center found. Please set up your center first.'
        }
      });
    }

    console.log('✅ Manager:', req.user._id);
    console.log('✅ Found center:', center.name, 'ID:', center._id.toString());

    // DEBUG: Check ALL applications with active_care status (regardless of center)
    const allActiveApps = await TemporaryCareApplication.find({ status: 'active_care' });
    console.log(`🔍 Total active_care applications in database: ${allActiveApps.length}`);
    allActiveApps.forEach(app => {
      console.log(`   - App ${app.applicationNumber}: centerId=${app.centerId?.toString()}, pets=${app.pets?.length}`);
    });

    // Find all active care applications in manager's center
    const applications = await TemporaryCareApplication.find({
      centerId: center._id,
      status: 'active_care'
    }).populate('userId', 'name email phone')
      .populate('centerId', 'name address')
      .sort({ careStartDate: -1 });
    
    console.log(`📋 Found ${applications.length} active_care applications for center ${center._id.toString()}`);

    // Fetch pet details for each application
    const petsInCare = [];
    
    for (const application of applications) {
      for (const petEntry of application.pets) {
        // Try to find pet in Pet collection first, then AdoptionPet
        let pet = await Pet.findOne({ petCode: petEntry.petId })
          .populate('speciesId', 'name')
          .populate('breedId', 'name');
        
        if (!pet) {
          pet = await AdoptionPet.findOne({ petCode: petEntry.petId })
            .populate('species', 'name')
            .populate('breed', 'name');
        }

        if (pet) {
          petsInCare.push({
            petCode: petEntry.petId,
            petName: pet.name || petEntry.petName,
            species: pet.speciesId?.name || pet.species?.name || 'Unknown',
            breed: pet.breedId?.name || pet.breed?.name || 'Unknown',
            category: pet.category || 'Unknown',
            age: pet.age,
            ageUnit: pet.ageUnit,
            gender: pet.gender,
            images: pet.images || pet.imageIds || [],
            // Application details
            applicationId: application._id,
            applicationNumber: application.applicationNumber,
            startDate: application.careStartDate,
            expectedEndDate: application.expectedEndDate,
            // User details
            ownerName: application.userId.name,
            ownerEmail: application.userId.email,
            ownerPhone: application.userId.phone,
            // Center details
            centerName: application.centerId.name,
            // Special instructions
            specialInstructions: {
              food: petEntry.specialInstructions?.food || '',
              medicine: petEntry.specialInstructions?.medicine || '',
              behavior: petEntry.specialInstructions?.behavior || '',
              allergies: petEntry.specialInstructions?.allergies || ''
            },
            // Payment details
            advanceAmount: application.pricing?.advanceAmount || 0,
            totalAmount: application.pricing?.totalAmount || 0,
            paymentStatus: application.paymentStatus
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        pets: petsInCare,
        total: petsInCare.length,
        centers: [{ id: center._id, name: center.name }]
      }
    });
  } catch (error) {
    console.error('Get inboard pets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inboard pets',
      error: error.message
    });
  }
};

// Get detailed information for a specific pet in care
const getInboardPetDetails = async (req, res) => {
  try {
    const { petCode } = req.params;

    // Get manager's center - use req.user._id
    const center = await TemporaryCareCenter.findOne({ owner: req.user._id, isActive: true });
    
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Care center not found'
      });
    }

    // Find application with this pet
    const application = await TemporaryCareApplication.findOne({
      centerId: center._id,
      'pets.petId': petCode,
      status: 'active_care'
    }).populate('userId', 'name email phone address')
      .populate('centerId', 'name address phone email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found in your care centers'
      });
    }

    // Find the specific pet entry in application
    const petEntry = application.pets.find(p => p.petCode === petCode);

    // Get full pet details
    let pet = await Pet.findOne({ petCode })
      .populate('speciesId', 'name')
      .populate('breedId', 'name')
      .populate('imageIds');
    
    if (!pet) {
      pet = await AdoptionPet.findOne({ petCode })
        .populate('species', 'name')
        .populate('breed', 'name');
    }

    res.json({
      success: true,
      data: {
        // Pet information
        pet: {
          petCode: pet.petCode,
          name: pet.name,
          species: pet.speciesId?.name || pet.species?.name,
          breed: pet.breedId?.name || pet.breed?.name,
          age: pet.age,
          ageUnit: pet.ageUnit,
          gender: pet.gender,
          color: pet.color,
          weight: pet.weight,
          images: pet.images || pet.imageIds || [],
          specialNeeds: pet.specialNeeds || []
        },
        // Owner information
        owner: {
          name: application.userId.name,
          email: application.userId.email,
          phone: application.userId.phone,
          address: application.userId.address
        },
        // Application information
        application: {
          id: application._id,
          applicationNumber: application.applicationNumber,
          status: application.status,
          startDate: application.careStartDate,
          expectedEndDate: application.expectedEndDate,
          actualDays: petEntry.actualDays,
          specialInstructions: petEntry.specialInstructions
        },
        // Payment information
        payment: {
          advanceAmount: application.pricing?.advanceAmount || 0,
          totalAmount: application.pricing?.totalAmount || 0,
          dailyRate: application.pricing?.dailyRate || 0,
          advanceStatus: application.paymentStatus.advance,
          finalStatus: application.paymentStatus.final
        },
        // Center information
        center: {
          name: application.centerId.name,
          address: application.centerId.address,
          phone: application.centerId.phone,
          email: application.centerId.email
        }
      }
    });
  } catch (error) {
    console.error('Get inboard pet details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet details',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getBookings,
  getFacilities,
  getCaregivers,
  getInboardPets,
  getInboardPetDetails
};
