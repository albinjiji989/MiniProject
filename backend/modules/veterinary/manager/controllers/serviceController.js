const VeterinaryService = require('../models/VeterinaryService');

// Create service
const createService = async (req, res) => {
  try {
    const { name, description, category, price, duration } = req.body;
    const storeId = req.user.storeId;

    const service = new VeterinaryService({
      name,
      description,
      category,
      price,
      duration,
      storeId,
      createdBy: req.user.id,
      isActive: true
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, message: 'Failed to create service' });
  }
};

// Update service
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const storeId = req.user.storeId;

    const service = await VeterinaryService.findOne({ _id: id, storeId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    Object.assign(service, updates);
    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
};

// Delete service
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    const service = await VeterinaryService.findOneAndDelete({ _id: id, storeId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
};

// Toggle service active status
const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    const service = await VeterinaryService.findOne({ _id: id, storeId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    service.isActive = !service.isActive;
    await service.save();

    res.json({
      success: true,
      message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
      data: service
    });
  } catch (error) {
    console.error('Toggle service status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update service status' });
  }
};

module.exports = {
  createService,
  updateService,
  deleteService,
  toggleServiceStatus
};
