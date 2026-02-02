const { validationResult } = require('express-validator');
const VeterinaryService = require('../../models/VeterinaryService');

// Create service
const createService = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { name, description, category, price, duration } = req.body;
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID is required. Please complete store setup first.' 
      });
    }

    // Check if service with same name already exists for this store
    const existingService = await VeterinaryService.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }, 
      storeId,
      isActive: true
    });
    
    if (existingService) {
      return res.status(400).json({ 
        success: false, 
        message: 'A service with this name already exists in your clinic' 
      });
    }

    const service = new VeterinaryService({
      name: name.trim(),
      description: description.trim(),
      category: category || 'examination',
      price: parseFloat(price),
      duration: parseInt(duration),
      storeId,
      storeName: req.user.storeName || '',
      createdBy: req.user._id,
      status: 'active',
      isActive: true
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service }
    });
  } catch (error) {
    console.error('Create service error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create service',
      error: error.message 
    });
  }
};

// Update service
const updateService = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const updates = req.body;
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID is required' 
      });
    }

    const service = await VeterinaryService.findOne({ _id: id, storeId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // If name is being updated, check for duplicates
    if (updates.name && updates.name !== service.name) {
      const existingService = await VeterinaryService.findOne({ 
        name: { $regex: new RegExp(`^${updates.name}$`, 'i') }, 
        storeId,
        _id: { $ne: id },
        isActive: true
      });
      
      if (existingService) {
        return res.status(400).json({ 
          success: false, 
          message: 'A service with this name already exists in your clinic' 
        });
      }
    }

    // Prevent updating certain fields
    delete updates.storeId;
    delete updates.createdBy;
    delete updates._id;
    delete updates.createdAt;

    // Trim string fields
    if (updates.name) updates.name = updates.name.trim();
    if (updates.description) updates.description = updates.description.trim();
    
    // Parse numeric fields
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.duration) updates.duration = parseInt(updates.duration);

    Object.assign(service, updates);
    service.updatedBy = req.user._id;
    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: { service }
    });
  } catch (error) {
    console.error('Update service error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update service',
      error: error.message 
    });
  }
};

// Delete service (soft delete by setting status to inactive)
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID is required' 
      });
    }

    const service = await VeterinaryService.findOne({ _id: id, storeId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Soft delete by setting status to inactive
    service.status = 'inactive';
    service.isActive = false;
    service.updatedBy = req.user._id;
    await service.save();

    res.json({
      success: true,
      message: 'Service deactivated successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to deactivate service',
      error: error.message 
    });
  }
};

// Toggle service status
const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID is required' 
      });
    }

    const service = await VeterinaryService.findOne({ _id: id, storeId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    service.status = service.status === 'active' ? 'inactive' : 'active';
    service.isActive = service.status === 'active';
    service.updatedBy = req.user._id;
    await service.save();

    res.json({
      success: true,
      message: `Service ${service.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: { service }
    });
  } catch (error) {
    console.error('Toggle service status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update service status',
      error: error.message 
    });
  }
};

// Get all services for the store
const getServices = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID is required. Please complete store setup first.' 
      });
    }

    const { status, category, search } = req.query;

    const filter = { storeId };
    
    if (status) {
      filter.status = status;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const services = await VeterinaryService.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { 
        services,
        total: services.length
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch services',
      error: error.message 
    });
  }
};

module.exports = {
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  getServices
};