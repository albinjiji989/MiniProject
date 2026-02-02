const { validationResult } = require('express-validator');
const VeterinaryStaff = require('../../models/VeterinaryStaff');

const listStaff = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID is required. Please complete store setup first.' 
      });
    }

    const { role, isActive, search } = req.query;
    const filter = { storeId };

    if (role) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await VeterinaryStaff.find(filter)
      .populate('userId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      data: { 
        staff: items,
        total: items.length
      } 
    });
  } catch (e) {
    console.error('List staff error:', e);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
};

const createStaff = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const storeId = req.user.storeId;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID is required. Please complete store setup first.' 
      });
    }

    const { name, email, phone, role, specialization, licenseNumber, qualifications, permissions } = req.body;

    // Check if staff with same email already exists for this store
    const existingStaff = await VeterinaryStaff.findOne({ 
      email: email.toLowerCase().trim(), 
      storeId 
    });

    if (existingStaff) {
      return res.status(400).json({ 
        success: false, 
        message: 'A staff member with this email already exists in your clinic' 
      });
    }

    const payload = { 
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      role: role || 'assistant',
      specialization: specialization ? specialization.trim() : '',
      licenseNumber: licenseNumber ? licenseNumber.trim() : '',
      qualifications: qualifications || [],
      permissions: permissions || [],
      storeId, 
      storeName: req.user.storeName || '', 
      createdBy: req.user._id,
      isActive: true
    };

    const doc = await VeterinaryStaff.create(payload);
    
    // Populate references
    await doc.populate('createdBy', 'name email');

    res.status(201).json({ 
      success: true, 
      message: 'Staff member created successfully', 
      data: { staff: doc } 
    });
  } catch (e) {
    console.error('Create staff error:', e);
    if (e.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: Object.values(e.errors).map(err => err.message) 
      });
    }
    if (e.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'A staff member with this email already exists in your clinic' 
      });
    }
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const storeId = req.user.storeId;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID is required' 
      });
    }

    const doc = await VeterinaryStaff.findById(req.params.id);
    
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    if (doc.storeId !== storeId) {
      return res.status(403).json({ success: false, message: 'Access denied - Staff member does not belong to your clinic' });
    }

    const updates = req.body || {};

    // If email is being updated, check for duplicates
    if (updates.email && updates.email.toLowerCase() !== doc.email.toLowerCase()) {
      const existingStaff = await VeterinaryStaff.findOne({ 
        email: updates.email.toLowerCase().trim(), 
        storeId,
        _id: { $ne: doc._id }
      });

      if (existingStaff) {
        return res.status(400).json({ 
          success: false, 
          message: 'A staff member with this email already exists in your clinic' 
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
    if (updates.email) updates.email = updates.email.toLowerCase().trim();
    if (updates.phone) updates.phone = updates.phone.trim();
    if (updates.specialization) updates.specialization = updates.specialization.trim();
    if (updates.licenseNumber) updates.licenseNumber = updates.licenseNumber.trim();

    Object.assign(doc, updates);
    doc.updatedBy = req.user._id;
    await doc.save();

    // Populate references
    await doc.populate(['userId', 'createdBy', 'updatedBy'], 'name email');

    res.json({ 
      success: true, 
      message: 'Staff member updated successfully', 
      data: { staff: doc } 
    });
  } catch (e) {
    console.error('Update staff error:', e);
    if (e.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: Object.values(e.errors).map(err => err.message) 
      });
    }
    if (e.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'A staff member with this email already exists in your clinic' 
      });
    }
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID is required' 
      });
    }

    const doc = await VeterinaryStaff.findById(req.params.id);
    
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    if (doc.storeId !== storeId) {
      return res.status(403).json({ success: false, message: 'Access denied - Staff member does not belong to your clinic' });
    }

    // Soft delete by setting isActive to false
    doc.isActive = false;
    doc.updatedBy = req.user._id;
    doc.endDate = new Date();
    await doc.save();

    res.json({ 
      success: true, 
      message: 'Staff member deactivated successfully' 
    });
  } catch (e) {
    console.error('Delete staff error:', e);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
};

module.exports = { listStaff, createStaff, updateStaff, deleteStaff };