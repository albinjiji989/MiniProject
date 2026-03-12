const NameChangeRequest = require('../models/NameChangeRequest');
const PetRegistry = require('../models/PetRegistry');
const AdoptionPet = require('../../modules/adoption/manager/models/AdoptionPet');
const PetInventoryItem = require('../../modules/petshop/manager/models/PetInventoryItem');

// User: Create a name change request
const createNameChangeRequest = async (req, res) => {
  try {
    const { petCode, newName, description } = req.body;
    const userId = req.user._id || req.user.id;

    if (!petCode || !newName) {
      return res.status(400).json({
        success: false,
        message: 'Pet code and new name are required'
      });
    }

    const trimmedName = newName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 50 characters'
      });
    }

    // Find the pet in registry
    const registry = await PetRegistry.findOne({ petCode })
      .populate('species', 'name displayName')
      .populate('breed', 'name');

    if (!registry) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found with this code'
      });
    }

    // Verify ownership
    if (!registry.currentOwnerId || registry.currentOwnerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not the owner of this pet'
      });
    }

    // Check if there's already a pending request for this pet by this user
    const existingRequest = await NameChangeRequest.findOne({
      petCode,
      requestedBy: userId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending name change request for this pet',
        existingRequest: {
          requestedName: existingRequest.requestedName,
          createdAt: existingRequest.createdAt
        }
      });
    }

    // Get primary image URL
    let images = [];
    if (registry.imageIds && registry.imageIds.length > 0) {
      images = registry.imageIds.slice(0, 3).map(img => 
        typeof img === 'object' && img.url ? img.url : img.toString()
      );
    }

    // Create the request
    const nameRequest = new NameChangeRequest({
      petCode,
      petRegistryId: registry._id,
      currentName: registry.name || '(unnamed)',
      requestedName: trimmedName,
      description: description?.trim() || '',
      requestedBy: userId,
      petSnapshot: {
        species: typeof registry.species === 'object' 
          ? (registry.species.displayName || registry.species.name) 
          : registry.species,
        breed: typeof registry.breed === 'object' 
          ? registry.breed.name 
          : registry.breed,
        gender: registry.gender,
        source: registry.source,
        currentLocation: registry.currentLocation,
        images
      }
    });

    await nameRequest.save();

    res.status(201).json({
      success: true,
      message: 'Name change request submitted successfully',
      data: {
        requestId: nameRequest._id,
        petCode,
        currentName: nameRequest.currentName,
        requestedName: nameRequest.requestedName,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error creating name change request:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending name change request for this pet'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create name change request',
      error: error.message
    });
  }
};

// User: Get my name change requests
const getMyRequests = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status } = req.query;

    const filter = { requestedBy: userId };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const requests = await NameChangeRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name email');

    res.json({
      success: true,
      data: { requests }
    });
  } catch (error) {
    console.error('Error fetching my requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests',
      error: error.message
    });
  }
};

// Admin: Get all name change requests
const getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const requests = await NameChangeRequest.find(filter)
      .sort({ status: 1, createdAt: -1 }) // pending first, then by date
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('requestedBy', 'name email phone')
      .populate('reviewedBy', 'name email');

    const total = await NameChangeRequest.countDocuments(filter);
    const pendingCount = await NameChangeRequest.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        },
        pendingCount
      }
    });
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests',
      error: error.message
    });
  }
};

// Admin: Approve name change request
const approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user._id || req.user.id;

    const request = await NameChangeRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}`
      });
    }

    // Find the pet registry
    const registry = await PetRegistry.findOne({ petCode: request.petCode });
    if (!registry) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found in registry'
      });
    }

    const oldName = registry.name || '';

    // Track previous name
    registry.previousNames = registry.previousNames || [];
    registry.previousNames.push({
      name: oldName,
      changedAt: new Date(),
      changedBy: adminId,
      changedByRole: 'admin'
    });

    // Update name in PetRegistry
    registry.name = request.requestedName;
    registry.nameSetAt = new Date();
    registry.updatedBy = adminId;
    await registry.save();

    // Update name in source table
    try {
      if (registry.source === 'adoption' && registry.adoptionPetId) {
        await AdoptionPet.findByIdAndUpdate(registry.adoptionPetId, { name: request.requestedName });
      } else if (registry.source === 'petshop' && registry.petShopItemId) {
        await PetInventoryItem.findByIdAndUpdate(registry.petShopItemId, { name: request.requestedName });
      } else if (registry.userPetId) {
        const Pet = require('../models/Pet');
        await Pet.findByIdAndUpdate(registry.userPetId, { name: request.requestedName });
      }
    } catch (sourceErr) {
      console.error('Failed to update source table:', sourceErr.message);
    }

    // Log to blockchain
    try {
      const nameEventData = {
        petId: registry._id,
        petCode: registry.petCode,
        oldName: oldName,
        newName: request.requestedName,
        requestId: request._id,
        requestedBy: request.requestedBy,
        approvedBy: adminId,
        source: registry.source,
        setByRole: 'admin',
        timestamp: new Date()
      };

      if (registry.source === 'petshop' || registry.petShopItemId) {
        const petshopBlockchain = require('../../modules/petshop/core/services/petshopBlockchainService');
        await petshopBlockchain.addBlock('pet_name_change_approved', nameEventData);
      } else {
        const BlockchainService = require('../services/blockchainService');
        await BlockchainService.addBlock({
          eventType: 'pet_name_change_approved',
          petId: registry._id.toString(),
          userId: adminId.toString(),
          data: nameEventData
        });
      }
      console.log(`🔗 Blockchain: Name change approval logged for ${request.petCode}`);
    } catch (blockchainErr) {
      console.error('Blockchain logging failed:', blockchainErr.message);
    }

    // Update request status
    request.status = 'approved';
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    request.adminNotes = adminNotes?.trim() || '';
    await request.save();

    res.json({
      success: true,
      message: 'Name change request approved',
      data: {
        requestId: request._id,
        petCode: request.petCode,
        oldName: oldName,
        newName: request.requestedName,
        status: 'approved'
      }
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve request',
      error: error.message
    });
  }
};

// Admin: Reject name change request
const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user._id || req.user.id;

    const request = await NameChangeRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}`
      });
    }

    // Update request status
    request.status = 'rejected';
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    request.adminNotes = adminNotes?.trim() || 'Request rejected by admin';
    await request.save();

    res.json({
      success: true,
      message: 'Name change request rejected',
      data: {
        requestId: request._id,
        petCode: request.petCode,
        status: 'rejected'
      }
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject request',
      error: error.message
    });
  }
};

// Get request details
const getRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id || req.user.id;
    const isAdmin = ['admin', 'manager'].includes(req.user.role);

    const request = await NameChangeRequest.findById(requestId)
      .populate('requestedBy', 'name email phone')
      .populate('reviewedBy', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check access - must be owner or admin
    if (!isAdmin && request.requestedBy._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { request }
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch request',
      error: error.message
    });
  }
};

module.exports = {
  createNameChangeRequest,
  getMyRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
  getRequestById
};
