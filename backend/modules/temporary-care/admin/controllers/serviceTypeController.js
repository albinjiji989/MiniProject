const ServiceType = require('../../models/ServiceType');
const CareBooking = require('../../models/CareBooking');
const CareStaff = require('../../models/CareStaff');
const CareReview = require('../../models/CareReview');

/**
 * Admin Service Type Management
 */

// Get all service types
exports.getAllServiceTypes = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, isActive, search } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const serviceTypes = await ServiceType.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const count = await ServiceType.countDocuments(query);
    
    res.json({
      success: true,
      data: serviceTypes,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching service types:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get single service type
exports.getServiceType = async (req, res) => {
  try {
    const serviceType = await ServiceType.findById(req.params.id);
    
    if (!serviceType) {
      return res.status(404).json({ success: false, message: 'Service type not found' });
    }
    
    res.json({ success: true, data: serviceType });
  } catch (error) {
    console.error('Error fetching service type:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create service type
exports.createServiceType = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      category,
      pricing,
      features,
      requirements,
      images
    } = req.body;
    
    // Check if code already exists
    const existing = await ServiceType.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Service code already exists' });
    }
    
    const serviceType = await ServiceType.create({
      name,
      code: code.toUpperCase(),
      description,
      category,
      pricing,
      features,
      requirements,
      images,
      storeId: req.user.storeId
    });
    
    res.status(201).json({
      success: true,
      message: 'Service type created successfully',
      data: serviceType
    });
  } catch (error) {
    console.error('Error creating service type:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update service type
exports.updateServiceType = async (req, res) => {
  try {
    const serviceType = await ServiceType.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!serviceType) {
      return res.status(404).json({ success: false, message: 'Service type not found' });
    }
    
    res.json({
      success: true,
      message: 'Service type updated successfully',
      data: serviceType
    });
  } catch (error) {
    console.error('Error updating service type:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete service type
exports.deleteServiceType = async (req, res) => {
  try {
    // Check if service type is being used in any bookings
    const bookingCount = await CareBooking.countDocuments({ 
      serviceType: req.params.id 
    });
    
    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete service type. It has ${bookingCount} associated bookings. Consider deactivating instead.`
      });
    }
    
    const serviceType = await ServiceType.findByIdAndDelete(req.params.id);
    
    if (!serviceType) {
      return res.status(404).json({ success: false, message: 'Service type not found' });
    }
    
    res.json({
      success: true,
      message: 'Service type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service type:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Toggle service type active status
exports.toggleServiceTypeStatus = async (req, res) => {
  try {
    const serviceType = await ServiceType.findById(req.params.id);
    
    if (!serviceType) {
      return res.status(404).json({ success: false, message: 'Service type not found' });
    }
    
    serviceType.isActive = !serviceType.isActive;
    await serviceType.save();
    
    res.json({
      success: true,
      message: `Service type ${serviceType.isActive ? 'activated' : 'deactivated'} successfully`,
      data: serviceType
    });
  } catch (error) {
    console.error('Error toggling service type status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get service type statistics
exports.getServiceTypeStats = async (req, res) => {
  try {
    const stats = await ServiceType.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          inactive: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
          }
        }
      }
    ]);
    
    const categoryStats = await ServiceType.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: stats[0] || { total: 0, active: 0, inactive: 0 },
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching service type stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
