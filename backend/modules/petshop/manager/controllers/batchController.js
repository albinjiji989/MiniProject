/**
 * Batch Controller
 * Handles batch-related operations (CRUD, publishing, reservations, purchases)
 */

const PetBatch = require('../models/PetBatch');
const PetInventoryItem = require('../models/PetInventoryItem');
const ErrorHandler = require('../../../../core/utils/errorHandler');
const logger = require('../../../../core/utils/logger');

// ============= PUBLIC (USER) ENDPOINTS =============

/**
 * List all published batches with filtering and pagination
 * GET /api/petshop/batches?shopId=&species=&breed=&status=published&page=1&limit=12
 */
exports.listBatches = async (req, res) => {
  try {
    const {
      shopId,
      speciesId,
      breedId,
      status = 'published',
      category,
      page = 1,
      limit = 12,
      sort = '-createdAt'
    } = req.query;

    const filter = { status };

    if (shopId) filter.shopId = shopId;
    if (speciesId) filter.speciesId = speciesId;
    if (breedId) filter.breedId = breedId;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const batches = await PetBatch.find(filter)
      .populate('shopId', 'name code address')
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await PetBatch.countDocuments(filter);

    res.json({
      success: true,
      data: batches,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      message: 'Batches retrieved successfully'
    });
  } catch (error) {
    logger.error('List batches error:', error);
    ErrorHandler.sendError(res, error, 500);
  }
};

/**
 * Get single batch details
 * GET /api/petshop/batches/:id
 */
exports.getBatchDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await PetBatch.findById(id)
      .populate('shopId', 'name code address contact')
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('samplePets.petId', 'name petCode gender age ageUnit imageIds')
      .populate('createdBy', 'name email');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.json({
      success: true,
      data: batch,
      message: 'Batch retrieved successfully'
    });
  } catch (error) {
    logger.error('Get batch details error:', error);
    ErrorHandler.sendError(res, error, 500);
  }
};

/**
 * Get batch inventory (list all pets in batch with gender filter)
 * GET /api/petshop/batches/:id/inventory?gender=male&page=1&limit=20
 */
exports.getBatchInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { gender, page = 1, limit = 20 } = req.query;

    const batch = await PetBatch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const filter = { batchId: id };
    if (gender) {
      filter.gender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pets = await PetInventoryItem.find(filter)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .sort('-dateAdded')
      .skip(skip)
      .limit(parseInt(limit))
      .select('name petCode gender age ageUnit color size price imageIds status description')
      .lean();

    const total = await PetInventoryItem.countDocuments(filter);

    res.json({
      success: true,
      data: {
        batch: {
          _id: batch._id,
          speciesId: batch.speciesId,
          breedId: batch.breedId,
          ageRange: batch.ageRange,
          counts: batch.counts
        },
        pets,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      message: 'Batch inventory retrieved'
    });
  } catch (error) {
    logger.error('Get batch inventory error:', error);
    ErrorHandler.sendError(res, error, 500);
  }
};

/**
 * Reserve a pet from batch (user initiates)
 * POST /api/petshop/batches/:id/reserve
 * body: { gender: 'male'|'female'|'any' }
 */
exports.reservePetFromBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { gender = 'any' } = req.body;
    const userId = req.user._id;

    const batch = await PetBatch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check if pets are available
    if (batch.availability?.available <= 0 || batch.isSoldOut) {
      return res.status(400).json({
        success: false,
        message: 'This batch is fully sold out'
      });
    }

    // Find available pet matching gender preference
    const genderFilter = gender !== 'any' 
      ? { batchId: id, gender: gender.charAt(0).toUpperCase() + gender.slice(1), status: 'available' }
      : { batchId: id, status: 'available' };

    const availablePet = await PetInventoryItem.findOne(genderFilter);

    if (!availablePet) {
      return res.status(400).json({
        success: false,
        message: `No available ${gender} pets in this batch at the moment`
      });
    }

    // Create or update reservation (use existing model or create new)
    // Simplified: mark pet as reserved
    availablePet.status = 'reserved';
    availablePet.reservedBy = userId;
    availablePet.reservedAt = new Date();
    availablePet.reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min TTL
    await availablePet.save();

    // Update batch availability
    await batch.reserve(1);

    res.json({
      success: true,
      data: {
        reservationId: availablePet._id,
        petId: availablePet._id,
        petCode: availablePet.petCode,
        gender: availablePet.gender,
        reservedUntil: availablePet.reservationExpiresAt,
        batch: {
          _id: batch._id,
          name: `${batch.speciesId.name} - ${batch.breedId.name}`,
          availability: batch.availability
        }
      },
      message: 'Pet reserved successfully. Manager will review and confirm within 15 minutes.'
    });
  } catch (error) {
    logger.error('Reserve pet error:', error);
    ErrorHandler.sendError(res, error, 500);
  }
};

// ============= MANAGER ENDPOINTS =============

/**
 * Create a new batch
 * POST /api/petshop/manager/batches
 * body: { shopId, speciesId, breedId, ageRange, counts, price, images, ... }
 */
exports.createBatch = async (req, res) => {
  try {
    const {
      shopId,
      speciesId,
      breedId,
      ageRange,
      counts,
      price,
      category,
      description,
      images,
      tags
    } = req.body;

    // Validate required fields
    if (!shopId || !speciesId || !breedId || !counts || !price || !ageRange) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: shopId, speciesId, breedId, counts, price, ageRange'
      });
    }

    const batch = new PetBatch({
      shopId,
      speciesId,
      breedId,
      ageRange,
      counts,
      price,
      category,
      description,
      images,
      tags,
      createdBy: req.user._id,
      managerId: req.user._id,
      status: 'draft'
    });

    const savedBatch = await batch.save();

    res.status(201).json({
      success: true,
      data: savedBatch,
      message: 'Batch created successfully'
    });
  } catch (error) {
    logger.error('Create batch error:', error);
    ErrorHandler.sendError(res, error, 500);
  }
};

/**
 * Update batch details
 * PUT /api/petshop/manager/batches/:id
 */
exports.updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent status changes here (use publish/archive endpoints)
    delete updates.status;
    delete updates.createdBy;
    delete updates.publishedAt;
    delete updates.archivedAt;

    const batch = await PetBatch.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.json({
      success: true,
      data: batch,
      message: 'Batch updated successfully'
    });
  } catch (error) {
    logger.error('Update batch error:', error);
    ErrorHandler.sendError(res, error, 500);
  }
};

/**
 * Publish a batch (make visible to users and generate/link inventory)
 * POST /api/petshop/manager/batches/:id/publish
 */
exports.publishBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await PetBatch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    if (batch.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Batch is already published'
      });
    }

    // Mark batch as published
    await batch.publish();

    res.json({
      success: true,
      data: batch,
      message: 'Batch published successfully and is now visible to users'
    });
  } catch (error) {
    logger.error('Publish batch error:', error);
    ErrorHandler.sendError(res, error, 500);
  }
};

/**
 * Archive a batch
 * POST /api/petshop/manager/batches/:id/archive
 */
exports.archiveBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await PetBatch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    await batch.archive();

    res.json({
      success: true,
      data: batch,
      message: 'Batch archived successfully'
    });
  } catch (error) {
    logger.error('Archive batch error:', error);
    ErrorHandler.sendError(res, error, 500);
  }
};

/**
 * Confirm/assign a reserved pet (manager handshake)
 * POST /api/petshop/manager/batches/:batchId/confirm-reservation/:petId
 */
exports.confirmReservation = async (req, res) => {
  try {
    const { batchId, petId } = req.params;

    const pet = await PetInventoryItem.findById(petId);
    if (!pet || pet.batchId.toString() !== batchId) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found in batch'
      });
    }

    if (pet.status !== 'reserved') {
      return res.status(400).json({
        success: false,
        message: 'Pet is not reserved'
      });
    }

    // Mark as confirmed/ready for payment
    pet.status = 'reserved_confirmed';
    pet.confirmedBy = req.user._id;
    pet.confirmedAt = new Date();
    await pet.save();

    res.json({
      success: true,
      data: pet,
      message: 'Reservation confirmed. User can now proceed to payment.'
    });
  } catch (error) {
    logger.error('Confirm reservation error:', error);
    ErrorHandler.sendError(res, error, 500);
  }
};

/**
 * Reject/release a reserved pet (manager action)
 * POST /api/petshop/manager/batches/:batchId/release-reservation/:petId
 */
exports.releaseReservation = async (req, res) => {
  try {
    const { batchId, petId } = req.params;
    const { reason } = req.body;

    const pet = await PetInventoryItem.findById(petId);
    if (!pet || pet.batchId.toString() !== batchId) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found in batch'
      });
    }

    const batch = await PetBatch.findById(batchId);

    // Release the pet back to available
    pet.status = 'available';
    pet.reservedBy = null;
    pet.reservedAt = null;
    pet.reservationExpiresAt = null;
    await pet.save();

    // Update batch availability
    await batch.cancelReservation(1);

    res.json({
      success: true,
      data: pet,
      message: 'Reservation released. Pet returned to available inventory.'
    });
  } catch (error) {
    logger.error('Release reservation error:', error);
    ErrorHandler.sendError(res, error, 500);
  }
};

/**
 * Mark pet as sold (final step after payment)
 * POST /api/petshop/manager/batches/:batchId/mark-sold/:petId
 */
exports.markPetAsSold = async (req, res) => {
  try {
    const { batchId, petId } = req.params;

    const pet = await PetInventoryItem.findById(petId);
    if (!pet || pet.batchId.toString() !== batchId) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found in batch'
      });
    }

    const batch = await PetBatch.findById(batchId);

    pet.status = 'sold';
    pet.soldAt = new Date();
    await pet.save();

    await batch.markSold(1);

    res.json({
      success: true,
      data: { pet, batch },
      message: 'Pet marked as sold'
    });
  } catch (error) {
    logger.error('Mark sold error:', error);
    ErrorHandler.sendError(res, error, 500);
  }
};
