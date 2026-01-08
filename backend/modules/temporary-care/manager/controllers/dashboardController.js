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
  try {
    const managerId = req.user.id;

    // Find manager's centers
    const centers = await TemporaryCareCenter.find({
      managerId,
      isActive: true
    });

    const centerIds = centers.map(c => c._id);

    // Find all active care applications in manager's centers
    const applications = await TemporaryCareApplication.find({
      centerId: { $in: centerIds },
      status: 'active_care'
    }).populate('userId', 'name email phone')
      .populate('centerId', 'name address')
      .sort({ careStartDate: -1 });

    // Fetch pet details for each application
    const petsInCare = [];
    
    for (const application of applications) {
      for (const petEntry of application.pets) {
        // Try to find pet in Pet collection first, then AdoptionPet
        let pet = await Pet.findOne({ petCode: petEntry.petCode })
          .populate('speciesId', 'name')
          .populate('breedId', 'name');
        
        if (!pet) {
          pet = await AdoptionPet.findOne({ petCode: petEntry.petCode })
            .populate('species', 'name')
            .populate('breed', 'name');
        }

        if (pet) {
          petsInCare.push({
            petCode: petEntry.petCode,
            petName: pet.name || petEntry.petName,
            species: pet.speciesId?.name || pet.species?.name || 'Unknown',
            breed: pet.breedId?.name || pet.breed?.name || 'Unknown',
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
        centers: centers.map(c => ({ id: c._id, name: c.name }))
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
    const managerId = req.user.id;

    // Find manager's centers
    const centers = await TemporaryCareCenter.find({
      managerId,
      isActive: true
    });

    const centerIds = centers.map(c => c._id);

    // Find application with this pet
    const application = await TemporaryCareApplication.findOne({
      centerId: { $in: centerIds },
      'pets.petCode': petCode,
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
