const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../core/models/User');
const UserDetails = require('../models/UserDetails');
const { auth, authorize } = require('../middleware/auth');
const AdminInvite = require('../core/models/AdminInvite');
const { sendMail } = require('../core/utils/email');

const router = express.Router();

// @route   POST /api/admin/create-module-admin
// @desc    Create module admin (Super Admin only)
// @access  Private (Super Admin)
router.post('/create-module-admin', [
  auth,
  authorize('super_admin'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('assignedModule')
    .notEmpty()
    .withMessage('Assigned module is required')
    .isIn(['adoption', 'shelter', 'rescue', 'ecommerce', 'pharmacy', 'boarding', 'temporary-care', 'veterinary', 'donation'])
    .withMessage('Invalid assigned module'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\+]?[0-9][\d\-\s\(\)]{7,15}$/)
    .withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { 
      name, 
      email, 
      password, 
      assignedModule, 
      phone, 
      storeName, 
      storeLocation, 
      storeDetails 
    } = req.body;

    // Auto-generate store ID based on module
    const moduleCount = await UserDetails.countDocuments({ assignedModule });
    const storeNumber = String(moduleCount + 1).padStart(3, '0');
    const storeId = `${assignedModule.toUpperCase()}_${storeNumber}`;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
        error: 'An account with this email address already exists. Please use a different email or try logging in instead.'
      });
    }

    // Create new user with module admin role
    const user = new User({
      name,
      email,
      password,
      phone,
      authProvider: 'local',
      role: `${assignedModule}_admin` // Specific module admin role
    });

    await user.save();

    // Create user details with store information
    const userDetails = new UserDetails({
      userId: user._id,
      assignedModule,
      storeId,
      storeName: storeName || `${assignedModule.charAt(0).toUpperCase() + assignedModule.slice(1)} Store ${storeNumber}`,
      storeLocation: storeLocation || {
        addressLine1: 'Default Address',
        city: 'Default City',
        state: 'Default State',
        zipCode: '00000',
        country: 'India'
      },
      storeDetails: {
        ...storeDetails,
        status: 'active'
      }
    });

    await userDetails.save();

    res.status(201).json({
      success: true,
      message: 'Module admin created successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: `${assignedModule}_admin`,
          assignedModule,
          storeId,
          storeName: userDetails.storeName,
          storeLocation: userDetails.storeLocation
        }
      }
    });
  } catch (error) {
    console.error('Create module admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during module admin creation'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (Super Admin only)
// @access  Private (Super Admin)
router.get('/users', [auth, authorize('super_admin')], async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const userDetails = await UserDetails.findOne({ userId: user._id });
        return {
          ...user.toObject(),
          role: user.role, // Role is now in User model
          assignedModule: userDetails ? userDetails.assignedModule : null,
          storeId: userDetails ? userDetails.storeId : null,
          storeName: userDetails ? userDetails.storeName : null,
          storeLocation: userDetails ? userDetails.storeLocation : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithDetails
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (Super Admin only)
// @access  Private (Super Admin)
router.put('/users/:id/role', [
  auth,
  authorize('super_admin'),
  body('role').notEmpty().withMessage('Role is required'),
  body('assignedModule').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { role, assignedModule } = req.body;
    const userId = req.params.id;

    // Find or create user details
    let userDetails = await UserDetails.findOne({ userId });
    if (!userDetails) {
      userDetails = new UserDetails({ userId });
    }

    userDetails.role = role;
    if (assignedModule) {
      userDetails.assignedModule = assignedModule;
    }

    await userDetails.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        userDetails
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// New: Invite module admin (send OTP to candidate email)
router.post('/invite-module-admin', [
  auth,
  authorize('super_admin'),
  body('name').notEmpty(),
  body('email').isEmail(),
  body('phone').optional(),
  body('module').isIn(['adoption','shelter','rescue','ecommerce','pharmacy','boarding','temporary-care','veterinary','donation'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }
    const { name, email, phone, module } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await AdminInvite.updateMany({ email, module, verified: false }, { $set: { verified: true } });
    await AdminInvite.create({ email, name, phone, module, otp, expiresAt, createdBy: req.user.id });
    const subject = `Verify module admin invitation (${module})`;
    const html = `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:24px;color:#e6e9ef;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);backdrop-filter: blur(10px); border-radius:16px; overflow:hidden;">
        <tr><td style="padding:28px;background:linear-gradient(135deg,#6a11cb,#2575fc);color:#fff;">
          <h1 style="margin:0;font-size:20px;">Module admin verification</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;">Your verification code is <b style="letter-spacing:4px;font-size:18px;">${otp}</b>. It expires in 10 minutes.</td></tr>
      </table></div>`;
    await sendMail({ to: email, subject, html });
    res.json({ success: true, message: 'OTP sent to candidate email' });
  } catch (error) {
    console.error('Invite module admin error:', error);
    res.status(500).json({ success: false, message: 'Server error during invite' });
  }
});

// New: Verify OTP and create module admin with temp password (email creds)
router.post('/verify-module-admin', [
  auth,
  authorize('super_admin'),
  body('email').isEmail(),
  body('module').isString(),
  body('otp').matches(/^\d{6}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }
    const { email, module, otp } = req.body;
    const invite = await AdminInvite.findOne({ email, module, verified: false }).sort({ createdAt: -1 });
    if (!invite) return res.status(404).json({ success: false, message: 'Invitation not found' });
    if (invite.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'OTP expired' });
    if (invite.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    // Create user with temp password
    const tempPassword = Math.random().toString(36).slice(-10) + '1A';
    const name = invite.name;
    const phone = invite.phone || '';
    const user = new User({
      name,
      email,
      phone,
      password: tempPassword,
      role: `${module}_admin`,
      authProvider: 'local',
      mustChangePassword: true
    });
    await user.save();

    invite.verified = true;
    await invite.save();

    // Email login credentials
    const subject = `Your ${module} admin account details`;
    const html = `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:24px;color:#e6e9ef;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);backdrop-filter: blur(10px); border-radius:16px; overflow:hidden;">
        <tr><td style="padding:28px;background:linear-gradient(135deg,#34d399,#0ea5ea);color:#fff;">
          <h1 style="margin:0;font-size:20px;">Your account is ready</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;">Use the credentials below to sign in and you will be asked to change your password immediately.</td></tr>
        <tr><td style="padding:0 28px 24px;"><b>Email:</b> ${email}<br/><b>Temporary Password:</b> ${tempPassword}</td></tr>
      </table></div>`;
    await sendMail({ to: email, subject, html });

    res.json({ success: true, message: 'Module admin created and credentials emailed' });
  } catch (error) {
    console.error('Verify module admin error:', error);
    res.status(500).json({ success: false, message: 'Server error during verify' });
  }
});

module.exports = router;
