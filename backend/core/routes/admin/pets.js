const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Pet = require('../../models/Pet');
const Species = require('../../models/Species');
const Breed = require('../../models/Breed');
const PetDetails = require('../../models/PetDetails');
const User = require('../../models/User');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/pets');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// @route   GET /api/admin/pets
// @desc    Get all pets with filtering and pagination
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      species = '',
      breed = '',
      owner = '',
      healthStatus = '',
      isActive = 'true',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (isActive === 'true') {
      filter.isActive = true;
    } else if (isActive === 'false') {
      filter.isActive = false;
    }

    if (status) {
      filter.currentStatus = status;
    }

    if (species) {
      filter.species = species;
    }

    if (breed) {
      filter.breed = breed;
    }

    if (owner) {
      filter.owner = owner;
    }

    if (healthStatus) {
      filter.healthStatus = healthStatus;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { color: { $regex: search, $options: 'i' } },
        { microchipId: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const pets = await Pet.find(filter)
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('petDetails', 'name')
      .populate('owner', 'name email phone')
      .populate('createdBy', 'name')
      .populate('lastUpdatedBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Pet.countDocuments(filter);
    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: pets,
      pagination: {
        current: parseInt(page),
        pages: pages,
        total: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/pets/:id
// @desc    Get pet by ID
// @access  Private (Admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id)
      .populate('species', 'name displayName description')
      .populate('breed', 'name description size temperament')
      .populate('petDetails', 'name description color ageRange weightRange typicalLifespan vaccinationRequirements careInstructions temperament specialNeeds')
      .populate('owner', 'name email phone address')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('customBreedRequest', 'name status');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    res.json({
      success: true,
      data: pet
    });
  } catch (error) {
    console.error('Get pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/pets
// @desc    Create new pet
// @access  Private (Admin only)
router.post('/', [
  auth,
  [
    check('name', 'Pet name is required').not().isEmpty(),
    check('species', 'Species is required').isMongoId(),
    check('breed', 'Breed is required').isMongoId(),
    check('petDetails', 'Pet details are required').isMongoId(),
    check('owner', 'Pet owner is required').isMongoId(),
    check('color', 'Pet color is required').not().isEmpty()
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      name,
      species,
      breed,
      petDetails,
      owner,
      customBreedName,
      customSpeciesName,
      customBreedRequest,
      gender = 'Unknown',
      dateOfBirth,
      age,
      ageUnit = 'months',
      color,
      weight,
      size = 'medium',
      currentStatus = 'Available',
      healthStatus = 'Good',
      isAdoptionReady = true,
      adoptionFee = 0,
      location,
      microchipId,
      temperament = [],
      behaviorNotes,
      specialNeeds = [],
      adoptionRequirements = [],
      tags = [],
      description
    } = req.body;

    // Verify species exists
    const speciesExists = await Species.findById(species);
    if (!speciesExists) {
      return res.status(400).json({
        success: false,
        message: 'Species not found'
      });
    }

    // Verify breed exists
    const breedExists = await Breed.findById(breed);
    if (!breedExists) {
      return res.status(400).json({
        success: false,
        message: 'Breed not found'
      });
    }

    // Verify pet details exist
    const petDetailsExists = await PetDetails.findById(petDetails);
    if (!petDetailsExists) {
      return res.status(400).json({
        success: false,
        message: 'Pet details not found'
      });
    }

    // Verify owner exists
    const ownerExists = await User.findById(owner);
    if (!ownerExists) {
      return res.status(400).json({
        success: false,
        message: 'Owner not found'
      });
    }

    // Check for duplicate microchip ID
    if (microchipId) {
      const existingPet = await Pet.findOne({ microchipId, isActive: true });
      if (existingPet) {
        return res.status(400).json({
          success: false,
          message: 'Microchip ID already exists'
        });
      }
    }

    const petData = {
      name,
      species,
      breed,
      petDetails,
      owner,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      age,
      ageUnit,
      color,
      weight,
      size,
      currentStatus,
      healthStatus,
      isAdoptionReady,
      adoptionFee,
      location,
      microchipId,
      temperament,
      behaviorNotes,
      specialNeeds,
      adoptionRequirements,
      tags,
      description,
      createdBy: req.user.id
    };

    // Add custom breed information if provided
    if (customBreedName) petData.customBreedName = customBreedName;
    if (customSpeciesName) petData.customSpeciesName = customSpeciesName;
    if (customBreedRequest) petData.customBreedRequest = customBreedRequest;

    const pet = new Pet(petData);
    await pet.save();

    // Populate the created pet
    await pet.populate([
      { path: 'species', select: 'name displayName' },
      { path: 'breed', select: 'name' },
      { path: 'petDetails', select: 'name' },
      { path: 'owner', select: 'name email' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      data: pet,
      message: 'Pet created successfully'
    });
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/pets/:id
// @desc    Update pet
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  [
    check('name', 'Pet name is required').not().isEmpty(),
    check('color', 'Pet color is required').not().isEmpty()
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    const updateData = { ...req.body };
    updateData.lastUpdatedBy = req.user.id;

    // Check for duplicate microchip ID if being updated
    if (updateData.microchipId && updateData.microchipId !== pet.microchipId) {
      const existingPet = await Pet.findOne({ 
        microchipId: updateData.microchipId, 
        isActive: true,
        _id: { $ne: req.params.id }
      });
      if (existingPet) {
        return res.status(400).json({
          success: false,
          message: 'Microchip ID already exists'
        });
      }
    }

    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'species', select: 'name displayName' },
      { path: 'breed', select: 'name' },
      { path: 'petDetails', select: 'name' },
      { path: 'owner', select: 'name email' },
      { path: 'lastUpdatedBy', select: 'name' }
    ]);

    res.json({
      success: true,
      data: updatedPet,
      message: 'Pet updated successfully'
    });
  } catch (error) {
    console.error('Update pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/pets/:id
// @desc    Delete pet (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    await pet.softDelete();

    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/admin/pets/:id/restore
// @desc    Restore deleted pet
// @access  Private (Admin only)
router.patch('/:id/restore', auth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    await pet.restore();

    res.json({
      success: true,
      message: 'Pet restored successfully'
    });
  } catch (error) {
    console.error('Restore pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/pets/import-csv
// @desc    Import pets from CSV file
// @access  Private (Admin only)
router.post('/import-csv', auth, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const results = [];
    const errors = [];
    let importedCount = 0;

    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          // Process each row
          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            
            try {
              // Find species by name
              const species = await Species.findOne({ 
                $or: [
                  { name: { $regex: new RegExp(`^${row.species}$`, 'i') } },
                  { displayName: { $regex: new RegExp(`^${row.species}$`, 'i') } }
                ]
              });

              if (!species) {
                errors.push(`Row ${i + 1}: Species '${row.species}' not found`);
                continue;
              }

              // Find breed by name and species
              const breed = await Breed.findOne({ 
                name: { $regex: new RegExp(`^${row.breed}$`, 'i') },
                speciesId: species._id
              });

              if (!breed) {
                errors.push(`Row ${i + 1}: Breed '${row.breed}' not found for species '${row.species}'`);
                continue;
              }

              // Find pet details
              const petDetails = await PetDetails.findOne({
                speciesId: species._id,
                breedId: breed._id
              });

              if (!petDetails) {
                errors.push(`Row ${i + 1}: Pet details not found for ${row.species} - ${row.breed}`);
                continue;
              }

              // Find owner by email
              const owner = await User.findOne({ 
                email: { $regex: new RegExp(`^${row.ownerEmail}$`, 'i') }
              });

              if (!owner) {
                errors.push(`Row ${i + 1}: Owner with email '${row.ownerEmail}' not found`);
                continue;
              }

              // Create pet data
              const petData = {
                name: row.name,
                species: species._id,
                breed: breed._id,
                petDetails: petDetails._id,
                owner: owner._id,
                gender: row.gender || 'Unknown',
                age: parseInt(row.age) || 0,
                ageUnit: row.ageUnit || 'months',
                color: row.color,
                weight: {
                  value: parseFloat(row.weight) || 0,
                  unit: row.weightUnit || 'kg'
                },
                size: row.size || 'medium',
                currentStatus: row.status || 'Available',
                healthStatus: row.healthStatus || 'Good',
                adoptionFee: parseFloat(row.adoptionFee) || 0,
                location: {
                  address: row.address || '',
                  city: row.city || '',
                  state: row.state || '',
                  country: row.country || '',
                  coordinates: row.longitude && row.latitude ? 
                    [parseFloat(row.longitude), parseFloat(row.latitude)] : undefined
                },
                tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : [],
                specialNeeds: row.specialNeeds ? row.specialNeeds.split(',').map(need => need.trim()) : [],
                behaviorNotes: row.behaviorNotes || '',
                createdBy: req.user.id
              };

              // Check for duplicate microchip ID
              if (row.microchipId) {
                const existingPet = await Pet.findOne({ 
                  microchipId: row.microchipId, 
                  isActive: true 
                });
                if (existingPet) {
                  errors.push(`Row ${i + 1}: Microchip ID '${row.microchipId}' already exists`);
                  continue;
                }
                petData.microchipId = row.microchipId;
              }

              const pet = new Pet(petData);
              await pet.save();
              importedCount++;

            } catch (error) {
              errors.push(`Row ${i + 1}: ${error.message}`);
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            data: {
              imported: importedCount,
              errors: errors.length,
              errorDetails: errors
            },
            message: `Import completed. ${importedCount} pets imported successfully.`
          });

        } catch (error) {
          console.error('CSV processing error:', error);
          res.status(500).json({
            success: false,
            message: 'Error processing CSV file'
          });
        }
      });
  } catch (error) {
    console.error('Import CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/pets/stats/overview
// @desc    Get pet statistics overview
// @access  Private (Admin only)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const [
      totalPets,
      availablePets,
      adoptedPets,
      underTreatmentPets,
      deceasedPets,
      fosteredPets,
      petsBySpecies,
      petsByHealthStatus,
      recentPets
    ] = await Promise.all([
      Pet.countDocuments({ isActive: true }),
      Pet.countDocuments({ currentStatus: 'Available', isActive: true }),
      Pet.countDocuments({ currentStatus: 'Adopted', isActive: true }),
      Pet.countDocuments({ currentStatus: 'Under Treatment', isActive: true }),
      Pet.countDocuments({ currentStatus: 'Deceased', isActive: true }),
      Pet.countDocuments({ currentStatus: 'Fostered', isActive: true }),
      Pet.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$species', count: { $sum: 1 } } },
        { $lookup: { from: 'species', localField: '_id', foreignField: '_id', as: 'species' } },
        { $unwind: '$species' },
        { $project: { species: '$species.displayName', count: 1 } },
        { $sort: { count: -1 } }
      ]),
      Pet.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$healthStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Pet.find({ isActive: true })
        .populate('species', 'displayName')
        .populate('breed', 'name')
        .populate('owner', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      data: {
        total: totalPets,
        available: availablePets,
        adopted: adoptedPets,
        underTreatment: underTreatmentPets,
        deceased: deceasedPets,
        fostered: fosteredPets,
        bySpecies: petsBySpecies,
        byHealthStatus: petsByHealthStatus,
        recent: recentPets
      }
    });
  } catch (error) {
    console.error('Get pet stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/pets/export-csv
// @desc    Export all pets to CSV
// @access  Private (Admin only)
router.get('/export-csv', auth, async (req, res) => {
  try {
    const pets = await Pet.find({ isActive: true })
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name displayName')
      .populate('petDetailsId', 'color ageRange')
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    // Create CSV headers
    const headers = [
      'Pet ID', 'Name', 'Species', 'Breed', 'Gender', 'Date of Birth', 'Age', 'Age Unit',
      'Color', 'Size', 'Weight (kg)', 'Description', 'Current Status', 'Adoption Fee',
      'Location', 'Temperament', 'Special Needs', 'Store ID', 'Store Name', 'Created At'
    ];

    // Create CSV rows
    const rows = pets.map(pet => [
      pet.petId,
      pet.name,
      pet.speciesId?.displayName || pet.speciesId?.name || '',
      pet.breedId?.displayName || pet.breedId?.name || '',
      pet.gender,
      pet.dateOfBirth ? new Date(pet.dateOfBirth).toISOString().split('T')[0] : '',
      pet.age,
      pet.ageUnit,
      pet.color,
      pet.size,
      pet.weightKg,
      pet.description,
      pet.currentStatus,
      pet.adoptionFee,
      pet.location,
      pet.temperament,
      pet.specialNeeds,
      pet.storeId,
      pet.storeName,
      new Date(pet.createdAt).toISOString()
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=pets-export-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export CSV Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export pets to CSV',
      error: error.message
    });
  }
});

// @route   GET /api/admin/pets/template-csv
// @desc    Download CSV template for pet import
// @access  Private (Admin only)
router.get('/template-csv', auth, async (req, res) => {
  try {
    // CSV template headers
    const headers = [
      'name', 'speciesId', 'breedId', 'gender', 'dateOfBirth', 'age', 'ageUnit',
      'color', 'size', 'weightKg', 'description', 'currentStatus', 'adoptionFee',
      'location', 'temperament', 'specialNeeds', 'storeId', 'storeName'
    ];
    
    // Create CSV content with just headers
    const csvContent = [headers]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=pet-import-template.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('Template CSV Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSV template',
      error: error.message
    });
  }
});

// @route   GET /api/admin/pets/stats/overview
// @desc    Get pets statistics overview
// @access  Private (Admin only)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const Pet = require('../../models/Pet');
    
    // Get total pets count
    const totalPets = await Pet.countDocuments();
    
    // Get active pets count
    const activePets = await Pet.countDocuments({ isActive: true });
    
    // Get available pets count (assuming available means currentStatus is 'available')
    const availablePets = await Pet.countDocuments({ currentStatus: 'available' });
    
    // Get adopted pets count
    const adoptedPets = await Pet.countDocuments({ currentStatus: 'adopted' });
    
    // Calculate growth rate (simplified - comparing with previous month)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const petsLastMonth = await Pet.countDocuments({ 
      createdAt: { $lt: oneMonthAgo }
    });
    
    const growthRate = totalPets > 0 ? 
      Math.round(((totalPets - petsLastMonth) / (petsLastMonth || 1)) * 100) : 0;
    
    // Get recent pets (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentPets = await Pet.find({ 
      createdAt: { $gte: oneWeekAgo }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name createdAt currentStatus')
    .lean();
    
    res.json({
      success: true,
      data: {
        totalPets,
        activePets,
        availablePets,
        adoptedPets,
        growthRate,
        recentPets
      }
    });
  } catch (error) {
    console.error('Get pets stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;