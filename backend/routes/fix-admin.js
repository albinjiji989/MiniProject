const express = require('express');
const router = express.Router();
const User = require('../core/models/User');
const bcrypt = require('bcryptjs');

// @route   POST /api/fix-admin/update-superadmin
// @desc    Update Super Admin user
// @access  Public (temporary endpoint)
router.post('/update-superadmin', async (req, res) => {
  try {
    console.log('Updating Super Admin user...');
    
    // Find or create Super Admin user
    let superAdmin = await User.findOne({ email: 'albinjiji2026@mca.ajce.in' });
    
    if (superAdmin) {
      console.log('Found existing Super Admin user, updating...');
      console.log('Current user:', {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        isActive: superAdmin.isActive,
        provider: superAdmin.provider
      });
      
      // Update existing user
      superAdmin.name = 'ADMIN';
      superAdmin.role = 'super_admin';
      superAdmin.isActive = true;
      superAdmin.provider = 'manual';
      superAdmin.phone = '000-000-0000';
      
      // Ensure password is properly hashed
      if (superAdmin.password && !superAdmin.password.startsWith('$2')) {
        console.log('Hashing password...');
        superAdmin.password = await bcrypt.hash(superAdmin.password, 12);
      } else if (!superAdmin.password) {
        console.log('Setting default password...');
        superAdmin.password = await bcrypt.hash('Admin@123', 12);
      }
      
      await superAdmin.save();
      console.log('✅ Super Admin user updated successfully!');
      
    } else {
      console.log('Creating new Super Admin user...');
      
      // Create new Super Admin user
      const hashedPassword = await bcrypt.hash('Admin@123', 12);
      
      superAdmin = new User({
        name: 'ADMIN',
        email: 'albinjiji2026@mca.ajce.in',
        password: hashedPassword,
        role: 'super_admin',
        phone: '000-000-0000',
        isActive: true,
        provider: 'manual'
      });

      await superAdmin.save();
      console.log('✅ Super Admin user created successfully!');
    }

    // Return success response
    res.json({
      success: true,
      message: 'Super Admin user updated successfully',
      user: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        isActive: superAdmin.isActive,
        provider: superAdmin.provider,
        hasPassword: !!superAdmin.password
      }
    });

  } catch (error) {
    console.error('❌ Error updating Super Admin:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating Super Admin user',
      error: error.message
    });
  }
});

module.exports = router;
