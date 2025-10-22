const Promotion = require('../models/Promotion');
const PetShop = require('../models/PetShop');
const logger = require('winston');

// Log controller actions with user context and operation details
const logAction = (req, action, data = {}) => {
  const userInfo = req.user ? `${req.user._id} (${req.user.role})` : 'unauthenticated';
  logger.info({
    action,
    user: userInfo,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// @desc    Create a new promotion
// @route   POST /api/v1/petshops/manager/promotions
// @access  Private/Manager
const createPromotion = async (req, res) => {
  logAction(req, 'create_promotion', { 
    code: req.body.code,
    discountType: req.body.discountType,
    discountValue: req.body.discountValue
  });
  
  try {
    // Get the pet shop managed by the current user
    const petShop = await PetShop.findOne({ owner: req.user._id });
    
    if (!petShop) {
      return res.status(404).json({ 
        success: false, 
        message: 'No pet shop found for this manager' 
      });
    }

    const { 
      code, 
      description = '',
      discountType, 
      discountValue, 
      minOrder = 0, 
      startDate, 
      endDate,
      maxUses = null,
      applicableItems = [],
      applicableCategories = []
    } = req.body;

    // Check if promotion code already exists
    const existingPromotion = await Promotion.findOne({ 
      code: { $regex: new RegExp(`^${code}$`, 'i') },
      shop: petShop._id
    });

    if (existingPromotion) {
      return res.status(400).json({
        success: false,
        message: 'Promotion code already exists'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Create promotion
    const promotion = new Promotion({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrder,
      startDate: start,
      endDate: end,
      maxUses,
      shop: petShop._id,
      createdBy: req.user._id,
      applicableItems,
      applicableCategories
    });

    await promotion.save();

    // Populate the createdBy field for the response
    await promotion.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: { promotion }
    });
  } catch (error) {
    console.error('Create promotion error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Promotion code already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Get all promotions for manager's pet shop
// @route   GET /api/v1/petshops/manager/promotions
// @access  Private/Manager
const managerListPromotions = async (req, res) => {
  logAction(req, 'list_promotions');
  
  try {
    // Get the pet shop managed by the current user
    const petShop = await PetShop.findOne({ owner: req.user._id });
    
    if (!petShop) {
      return res.status(404).json({ 
        success: false, 
        message: 'No pet shop found for this manager' 
      });
    }
    
    // Query parameters
    const { status, activeOnly = 'true', sortBy = '-createdAt', limit = 10, page = 1 } = req.query;
    
    // Build query
    const query = { shop: petShop._id };
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter active promotions only
    if (activeOnly === 'true') {
      const now = new Date();
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
      query.isActive = true;
    }
    
    // Execute query with pagination
    const promotions = await Promotion.find(query)
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('applicableItems', 'name price')
      .populate('applicableCategories', 'name');
    
    // Get total count for pagination
    const total = await Promotion.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: promotions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: promotions
    });
    
  } catch (error) {
    console.error('List promotions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Update a promotion
// @route   PUT /api/v1/petshops/manager/promotions/:id
// @access  Private/Manager
const managerUpdatePromotion = async (req, res) => {
  logAction(req, 'update_promotion', { promotionId: req.params.id });
  
  try {
    // Get the pet shop managed by the current user
    const petShop = await PetShop.findOne({ owner: req.user._id });
    
    if (!petShop) {
      return res.status(404).json({ 
        success: false, 
        message: 'No pet shop found for this manager' 
      });
    }
    
    // Find the promotion
    let promotion = await Promotion.findOne({
      _id: req.params.id,
      shop: petShop._id
    });
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    // Prevent updating certain fields if promotion is active and in use
    if (promotion.isActive && promotion.currentUses > 0) {
      const restrictedFields = ['code', 'discountType', 'discountValue', 'minOrder'];
      const hasRestrictedUpdate = Object.keys(req.body).some(field => 
        restrictedFields.includes(field)
      );
      
      if (hasRestrictedUpdate) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update code, discount type, discount value, or minimum order for an active promotion with existing uses'
        });
      }
    }
    
    // Update promotion
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      'code', 'description', 'discountType', 'discountValue', 'minOrder',
      'startDate', 'endDate', 'maxUses', 'isActive', 'applicableItems',
      'applicableCategories'
    ];
    
    const isValidOperation = updates.every(update => 
      allowedUpdates.includes(update)
    );
    
    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid updates!'
      });
    }
    
    // Apply updates
    updates.forEach(update => {
      if (update === 'code' && req.body[update]) {
        promotion[update] = req.body[update].toUpperCase();
      } else if (update === 'startDate' || update === 'endDate') {
        promotion[update] = new Date(req.body[update]);
      } else if (update === 'applicableItems' || update === 'applicableCategories') {
        // Ensure we're not duplicating items
        const existingIds = new Set(promotion[update].map(id => id.toString()));
        const newItems = req.body[update].filter(id => !existingIds.has(id));
        promotion[update] = [...promotion[update], ...newItems];
      } else if (req.body[update] !== undefined) {
        promotion[update] = req.body[update];
      }
    });
    
    // Validate dates
    if (updates.includes('startDate') || updates.includes('endDate')) {
      if (promotion.startDate >= promotion.endDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }
    
    await promotion.save();
    
    // Populate fields for response
    await promotion.populate('createdBy', 'name email')
      .populate('applicableItems', 'name price')
      .populate('applicableCategories', 'name');

    res.status(200).json({
      success: true,
      message: 'Promotion updated successfully',
      data: { promotion }
    });
    
  } catch (error) {
    console.error('Update promotion error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Promotion code already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Delete a promotion
// @route   DELETE /api/v1/petshops/manager/promotions/:id
// @access  Private/Manager
const managerDeletePromotion = async (req, res) => {
  logAction(req, 'delete_promotion', { promotionId: req.params.id });
  
  try {
    // Get the pet shop managed by the current user
    const petShop = await PetShop.findOne({ owner: req.user._id });
    
    if (!petShop) {
      return res.status(404).json({ 
        success: false, 
        message: 'No pet shop found for this manager' 
      });
    }
    
    // Find and delete the promotion
    const promotion = await Promotion.findOneAndDelete({
      _id: req.params.id,
      shop: petShop._id
    });
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully',
      data: {}
    });
    
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

module.exports = {
  createPromotion,
  managerListPromotions,
  managerUpdatePromotion,
  managerDeletePromotion
};