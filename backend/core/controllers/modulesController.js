const Module = require('../models/Module');
const fs = require('fs');
const path = require('path');

function getFilesystemModules() {
  try {
    // Define actual service modules only (not backend organizational folders)
    // 3 separate modules: Ecommerce, Pharmacy, TemporaryCare + existing modules
    const actualModules = ['adoption', 'petshop', 'veterinary', 'ecommerce', 'pharmacy', 'temporary-care'];
    
    const knownIconByKey = {
      adoption: 'Pets',
      petshop: 'ShoppingCart',
      veterinary: 'LocalHospital',
      ecommerce: 'ShoppingCart',
      pharmacy: 'LocalPharmacy',
      'temporary-care': 'Home',
    };
    const colorByKey = {
      adoption: '#10b981',
      petshop: '#3b82f6',
      veterinary: '#64748b',
      ecommerce: '#ef4444',
      pharmacy: '#f59e0b',
      'temporary-care': '#06b6d4',
    };
    const toDisplayName = (key) => {
      if (key === 'temporary-care') return 'Temporary Care';
      if (key === 'petshop') return 'Pet Shop';
      return key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    };
    
    const items = actualModules.map((key, idx) => {
      return {
        _id: key, // virtual id for frontend rendering only
        key,
        name: toDisplayName(key),
        description: key === 'ecommerce' ? 'Pet supplies and accessories shopping' :
                     key === 'pharmacy' ? 'Pet medicines with prescription support' :
                     key === 'temporary-care' ? 'Pet boarding and daycare services' : '',
        icon: knownIconByKey[key] || 'Business',
        color: colorByKey[key] || '#64748b',
        status: 'active',
        hasManagerDashboard: true,
        isCoreModule: true,
        maintenanceMessage: null,
        blockReason: null,
        displayOrder: idx,
        hidden: false,
      };
    });
    return items;
  } catch (e) {
    return [];
  }
}

async function ensureModulesSeeded() {
  const fsModules = getFilesystemModules();
  if (!fsModules || fsModules.length === 0) return;
    const ops = fsModules.map((m) => ({
      updateOne: {
        filter: { key: m.key },
        update: {
          $setOnInsert: {
            key: m.key,
            name: m.name,
            description: m.description,
            icon: m.icon,
            color: m.color,
            status: m.status,
            hasManagerDashboard: m.hasManagerDashboard,
            isCoreModule: true,
            maintenanceMessage: null,
            blockReason: null,
            displayOrder: m.displayOrder,
            hidden: false,
          },
        },
        upsert: true,
      },
    }));
  if (ops.length > 0) {
    try {
      await Module.bulkWrite(ops);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Module seeding skipped/failed:', e.message);
    }
  }
}

// Get all modules (public endpoint for user dashboard)
const getAllModules = async (req, res) => {
  try {
    let modules = await Module.find({ hidden: { $ne: true } })
      .select('key name description icon color status hasManagerDashboard maintenanceMessage blockReason displayOrder')
      .sort({ displayOrder: 1, name: 1 });
    if (!modules || modules.length === 0) {
      modules = getFilesystemModules();
    }
    res.json({ success: true, data: modules });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch modules', error: error.message });
  }
};

// Get modules for admin management
const getAdminModules = async (req, res) => {
  try {
    // Remove legacy 'shelter' entries if present
    try { await Module.deleteMany({ key: 'shelter' }); } catch (e) {}

    // Ensure DB has filesystem modules (petshop, etc.)
    await ensureModulesSeeded();

    let modules = await Module.find()
      .sort({ displayOrder: 1, name: 1 });
    if (!modules || modules.length === 0) {
      modules = getFilesystemModules();
    }
    res.json({ success: true, data: modules });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch modules', error: error.message });
  }
};

// Update module
const updateModule = async (req, res) => {
  try {
    const { Types } = require('mongoose');
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid module id' });
    }
    const { status, maintenanceMessage, blockReason, ...updateData } = req.body;
    
    // Validate status-specific fields
    if (status === 'maintenance' && !maintenanceMessage) {
      return res.status(400).json({ success: false, message: 'Maintenance message is required for maintenance status' });
    }
    
    if (status === 'blocked' && !blockReason) {
      return res.status(400).json({ success: false, message: 'Block reason is required for blocked status' });
    }

    const module = await Module.findByIdAndUpdate(
      req.params.id,
      { ...updateData, status, maintenanceMessage, blockReason },
      { new: true, runValidators: true }
    );
    
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    res.json({ success: true, data: module });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ success: false, message: 'Validation error', errors });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update module', error: error.message });
    }
  }
};

// Update module status
const updateModuleStatus = async (req, res) => {
  try {
    const { Types } = require('mongoose');
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid module id' });
    }
    const { status, message } = req.body;
    
    if (!['active', 'blocked', 'maintenance', 'coming_soon'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updateData = { status };
    
    if (status === 'maintenance') {
      updateData.maintenanceMessage = message;
      updateData.blockReason = null;
    } else if (status === 'blocked') {
      updateData.blockReason = message;
      updateData.maintenanceMessage = null;
    } else {
      updateData.maintenanceMessage = null;
      updateData.blockReason = null;
    }

    const module = await Module.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    res.json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update module status', error: error.message });
  }
};

// Soft-hide module (acts as Delete)
const hideModule = async (req, res) => {
  try {
    const { Types } = require('mongoose');
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid module id' });
    }
    const mod = await Module.findByIdAndUpdate(
      req.params.id,
      { hidden: true },
      { new: true }
    );
    if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });
    res.json({ success: true, data: mod });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to hide module', error: error.message });
  }
};

// Restore hidden module
const restoreModule = async (req, res) => {
  try {
    const { Types } = require('mongoose');
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid module id' });
    }
    const mod = await Module.findByIdAndUpdate(
      req.params.id,
      { hidden: false },
      { new: true }
    );
    if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });
    res.json({ success: true, data: mod });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to restore module', error: error.message });
  }
};

// Reorder modules
const reorderModules = async (req, res) => {
  try {
    const { modules } = req.body; // Array of { id, displayOrder }
    if (!Array.isArray(modules)) {
      return res.status(400).json({ success: false, message: 'modules must be an array' });
    }
    
    const updatePromises = modules.map(({ id, displayOrder }) => {
      const { Types } = require('mongoose');
      if (!Types.ObjectId.isValid(id)) return null;
      return Module.findByIdAndUpdate(id, { displayOrder }, { new: true });
    }).filter(Boolean);
    
    await Promise.all(updatePromises);
    res.json({ success: true, message: 'Modules reordered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reorder modules', error: error.message });
  }
};

module.exports = {
  getAllModules,
  getAdminModules,
  updateModule,
  updateModuleStatus,
  hideModule,
  restoreModule,
  reorderModules
};