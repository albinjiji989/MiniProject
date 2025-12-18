const { validationResult } = require('express-validator');
const VeterinaryService = require('../models/VeterinaryService');

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

    // Check if service with same name already exists for this store
    const existingService = await VeterinaryService.findOne({ name, storeId });
    if (existingService) {
      return res.status(400).json({ 
        success: false, 
        message: 'A service with this name already exists' 
      });
    }

    const service = new VeterinaryService({
      name,
      description,
      category,
      price,
      duration,
      storeId,
      createdBy: req.user.id,
      status: 'active'
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
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

    const service = await VeterinaryService.findOne({ _id: id, storeId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Prevent updating certain fields
    delete updates.storeId;
    delete updates.createdBy;
    delete updates._id;

    Object.assign(service, updates);
    service.updatedBy = req.user.id;
    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
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

    const service = await VeterinaryService.findOne({ _id: id, storeId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Soft delete by setting status to inactive
    service.status = 'inactive';
    service.updatedBy = req.user.id;
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

    const service = await VeterinaryService.findOne({ _id: id, storeId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    service.status = service.status === 'active' ? 'inactive' : 'active';
    service.updatedBy = req.user.id;
    await service.save();

    res.json({
      success: true,
      message: `Service ${service.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: service
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
    const { status } = req.query;

    const filter = { storeId };
    if (status) {
      filter.status = status;
    }

    const services = await VeterinaryService.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { services }
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