const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../../core/middleware/auth');
const { body, validationResult } = require('express-validator');
const User = require('../../../core/models/User');
const UserDetails = require('../../../core/models/UserDetails');
const Activity = require('../../../core/models/Activity');
const AdminInvite = require('../../../core/models/AdminInvite');
const Module = require('../../../core/models/Module');
const { sendMail } = require('../../../core/utils/email');

// Mount nested admin routes
// Note: ./admin/users route file not found, skipping import

// @route   POST /api/admin/create-module-admin
// @desc    Create module manager (Admin only)
// @access  Private (Admin)
router.post('/create-module-admin', [
  auth,
  authorize('admin'),
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
    .isIn(['adoption', 'petshop', 'temporary-care', 'veterinary'])
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
      role: `${assignedModule}_manager` // Specific module manager role
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
      message: 'Module manager created successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: `${assignedModule}_manager`,
          assignedModule,
          storeId,
          storeName: userDetails.storeName,
          storeLocation: userDetails.storeLocation
        }
      }
    });
  } catch (error) {
    console.error('Create module manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during module manager creation'
    });
  }
});

// Alias route: Create module manager
// @route   POST /api/admin/create-module-manager
// @desc    Create module manager (Admin only)
// @access  Private (Admin)
router.post('/create-module-manager', [
  auth,
  authorize('admin'),
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
    .isIn(['adoption', 'petshop', 'temporary-care', 'veterinary'])
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

    const moduleCount = await UserDetails.countDocuments({ assignedModule });
    const storeNumber = String(moduleCount + 1).padStart(3, '0');
    const storeId = `${assignedModule.toUpperCase()}_${storeNumber}`;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      authProvider: 'local',
      role: `${assignedModule}_manager`
    });

    await user.save();

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
      message: 'Module manager created successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: `${assignedModule}_manager`,
          assignedModule,
          storeId,
          storeName: userDetails.storeName,
          storeLocation: userDetails.storeLocation
        }
      }
    });
  } catch (error) {
    console.error('Create module manager error:', error);
    res.status(500).json({ success: false, message: 'Server error during module manager creation' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/users', [auth, authorize('admin')], async (req, res) => {
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
// @desc    Update user role (Admin only)
// @access  Private (Admin)
router.put('/users/:id/role', [
  auth,
  authorize('admin'),
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

// New: Invite module manager (send OTP to candidate email)
router.post('/invite-module-admin', [
  auth,
  authorize('admin'),
  body('name').notEmpty(),
  body('email').isEmail(),
  body('phone').optional(),
  body('module').isIn(['adoption','petshop','temporary-care','veterinary'])
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
    const inviteRecord = await AdminInvite.create({ email, name, phone, module, otp, expiresAt, createdBy: req.user.id });
    const subject = `Verify module manager invitation (${module})`;
    const html = `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:24px;color:#e6e9ef;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);backdrop-filter: blur(10px); border-radius:16px; overflow:hidden;">
        <tr><td style="padding:28px;background:linear-gradient(135deg,#6a11cb,#2575fc);color:#fff;">
          <h1 style="margin:0;font-size:20px;">Module manager verification</h1>
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

// Alias route: Invite module manager
// @route   POST /api/admin/invite-module-manager
router.post('/invite-module-manager', [
  auth,
  authorize('admin'),
  body('name').notEmpty(),
  body('email').isEmail(),
  body('phone').optional(),
  body('module').isIn(['adoption','petshop','temporary-care','veterinary'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      console.log('Request body:', req.body);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array(),
        hint: 'Module must be one of: adoption, petshop, temporary-care, veterinary'
      });
    }
    const { name, email, phone, module } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await AdminInvite.updateMany({ email, module, verified: false }, { $set: { verified: true } });
    const inviteRecord = await AdminInvite.create({ email, name, phone, module, otp, expiresAt, createdBy: req.user.id });
    const subject = `Verify module manager invitation (${module})`;
    const html = `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:24px;color:#e6e9ef;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);backdrop-filter: blur(10px); border-radius:16px; overflow:hidden;">
        <tr><td style="padding:28px;background:linear-gradient(135deg,#6a11cb,#2575fc);color:#fff;">
          <h1 style="margin:0;font-size:20px;">Module manager verification</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;">Your verification code is <b style="letter-spacing:4px;font-size:18px;">${otp}</b>. It expires in 10 minutes.</td></tr>
      </table></div>`;
    
    // Try to send email, but don't fail the entire request if email fails
    try {
      await sendMail({ to: email, subject, html });
      res.json({ success: true, message: 'OTP sent to candidate email', inviteId: inviteRecord._id });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Still return success but indicate that email failed
      res.json({ 
        success: true, 
        message: 'Invite created successfully. Email failed to send, please check server logs and share OTP manually with the candidate.',
        inviteId: inviteRecord._id,
        emailError: emailError.message 
      });
    }
  } catch (error) {
    console.error('Invite module manager error:', error);
    res.status(500).json({ success: false, message: 'Server error during invite' });
  }
});

// New: Verify OTP and create module manager with temp password (email creds)
router.post('/verify-module-admin', [
  auth,
  authorize('admin'),
  body('email').isEmail(),
  body('module').isString().isIn(['adoption','petshop','temporary-care','veterinary']),
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
      role: `${module}_manager`,
      authProvider: 'local',
      mustChangePassword: true
    });
    await user.save();

    invite.verified = true;
    await invite.save();

    // Email login credentials
    const subject = `Your ${module} manager account details`;
    const html = `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:24px;color:#e6e9ef;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);backdrop-filter: blur(10px); border-radius:16px; overflow:hidden;">
        <tr><td style="padding:28px;background:linear-gradient(135deg,#34d399,#0ea5ea);color:#fff;">
          <h1 style="margin:0;font-size:20px;">Your account is ready</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;">Use the credentials below to sign in and you will be asked to change your password immediately.</td></tr>
        <tr><td style="padding:0 28px 24px;"><b>Email:</b> ${email}<br/><b>Temporary Password:</b> ${tempPassword}</td></tr>
      </table></div>`;
    await sendMail({ to: email, subject, html });

    res.json({ success: true, message: 'Module manager created and credentials emailed' });
  } catch (error) {
    console.error('Verify module admin error:', error);
    res.status(500).json({ success: false, message: 'Server error during verify' });
  }
});

// Alias route: Verify module manager
// @route   POST /api/admin/verify-module-manager
router.post('/verify-module-manager', [
  auth,
  authorize('admin'),
  body('email').isEmail(),
  body('module').isString().isIn(['adoption','petshop','temporary-care','veterinary']),
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

    const tempPassword = Math.random().toString(36).slice(-10) + '1A';
    const name = invite.name;
    const phone = invite.phone || '';
    const user = new User({
      name,
      email,
      phone,
      password: tempPassword,
      role: `${module}_manager`,
      authProvider: 'local',
      mustChangePassword: true
    });
    await user.save();

    invite.verified = true;
    await invite.save();

    const subject = `Your ${module} manager account details`;
    const html = `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:24px;color:#e6e9ef;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);backdrop-filter: blur(10px); border-radius:16px; overflow:hidden;">
        <tr><td style="padding:28px;background:linear-gradient(135deg,#34d399,#0ea5ea);color:#fff;">
          <h1 style="margin:0;font-size:20px;">Your account is ready</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;">Use the credentials below to sign in and you will be asked to change your password immediately.</td></tr>
        <tr><td style="padding:0 28px 24px;"><b>Email:</b> ${email}<br/><b>Temporary Password:</b> ${tempPassword}</td></tr>
      </table></div>`;
    await sendMail({ to: email, subject, html });

    res.json({ success: true, message: 'Module manager created and credentials emailed' });
  } catch (error) {
    console.error('Verify module manager error:', error);
    res.status(500).json({ success: false, message: 'Server error during verify' });
  }
});

// Manager CRUD routes (unified)
// @route   GET /api/admin/managers
// @desc    List all managers with module info
// @access  Private (Admin)
router.get('/managers', [auth, authorize('admin')], async (req, res) => {
  try {
    const managers = await User.find({ role: /_manager$/ }).select('-password');
    const usersWithDetails = await Promise.all(
      managers.map(async (user) => {
        const details = await UserDetails.findOne({ userId: user._id });
        return {
          ...user.toObject(),
          assignedModule: user.assignedModule || details?.assignedModule || null,
          storeId: details?.storeId || null,
          storeName: details?.storeName || null,
          storeLocation: details?.storeLocation || null
        };
      })
    );
    res.json({ success: true, data: { managers: usersWithDetails } });
  } catch (err) {
    console.error('List managers error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/managers
// @desc    Create a manager for a module
// @access  Private (Admin)
router.post('/managers', [
  auth,
  authorize('admin'),
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('assignedModule').isString().notEmpty().isIn(['adoption','petshop','temporary-care','veterinary']),
  body('phone').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, phone, assignedModule, storeName, storeLocation, storeDetails } = req.body;

    // Ensure module exists and allowed
    const moduleDoc = await Module.findOne({ key: assignedModule });
    if (!moduleDoc) return res.status(400).json({ success: false, message: 'Module not found' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = new User({
      name,
      email,
      password,
      phone: phone || '',
      authProvider: 'local',
      role: `${assignedModule}_manager`,
      assignedModule
    });
    await user.save();

    const moduleCount = await UserDetails.countDocuments({ assignedModule });
    const storeNumber = String(moduleCount + 1).padStart(3, '0');
    const storeId = `${assignedModule.toUpperCase()}_${storeNumber}`;

    await new UserDetails({
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
      storeDetails: { ...(storeDetails || {}), status: 'active' }
    }).save();

    res.status(201).json({ success: true, message: 'Manager created', data: { id: user.id } });
  } catch (err) {
    console.error('Create manager error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/admin/managers/:id
// @desc    Update manager details or reassign module
// @access  Private (Admin)
router.put('/managers/:id', [
  auth,
  authorize('admin'),
  body('assignedModule').optional().isString().isIn(['adoption','petshop','temporary-care','veterinary']),
  body('name').optional().isString(),
  body('phone').optional().isString(),
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !/_manager$/.test(user.role)) return res.status(404).json({ success: false, message: 'Manager not found' });

    const { assignedModule, name, phone, storeName, storeLocation, storeDetails, isActive } = req.body;

    if (typeof name === 'string') user.name = name;
    if (typeof phone === 'string') user.phone = phone;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    let details = await UserDetails.findOne({ userId: user._id });
    if (!details) details = new UserDetails({ userId: user._id });

    if (assignedModule) {
      const moduleDoc = await Module.findOne({ key: assignedModule });
      if (!moduleDoc) return res.status(400).json({ success: false, message: 'Module not found' });
      user.assignedModule = assignedModule;
      user.role = `${assignedModule}_manager`;
      details.assignedModule = assignedModule;
    }
    if (storeName) details.storeName = storeName;
    if (storeLocation) details.storeLocation = storeLocation;
    if (storeDetails) details.storeDetails = { ...(details.storeDetails || {}), ...storeDetails };

    await user.save();
    await details.save();

    res.json({ success: true, message: 'Manager updated' });
  } catch (err) {
    console.error('Update manager error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/admin/managers/:id
// @desc    Remove a manager
// @access  Private (Admin)
router.delete('/managers/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !/_manager$/.test(user.role)) return res.status(404).json({ success: false, message: 'Manager not found' });

    await UserDetails.deleteOne({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    res.json({ success: true, message: 'Manager deleted' });
  } catch (err) {
    console.error('Delete manager error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/pending-invites
// @desc    Get all pending manager invitations
// @access  Private (Admin)
router.get('/pending-invites', [auth, authorize('admin')], async (req, res) => {
  try {
    const pendingInvites = await AdminInvite.find({ 
      verified: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      data: pendingInvites 
    });
  } catch (err) {
    console.error('Get pending invites error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/resend-invite
// @desc    Resend invitation OTP
// @access  Private (Admin)
router.post('/resend-invite', [
  auth,
  authorize('admin'),
  body('email').isEmail(),
  body('module').isString().isIn(['adoption','petshop','temporary-care','veterinary'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }
    
    const { email, module } = req.body;
    
    // Find the pending invite
    const invite = await AdminInvite.findOne({ 
      email, 
      module, 
      verified: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Pending invitation not found' });
    }
    
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Update the invite with new OTP
    invite.otp = otp;
    invite.expiresAt = expiresAt;
    await invite.save();
    
    // Send email with new OTP
    const subject = `Verify module manager invitation (${module})`;
    const html = `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:24px;color:#e6e9ef;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);backdrop-filter: blur(10px); border-radius:16px; overflow:hidden;">
        <tr><td style="padding:28px;background:linear-gradient(135deg,#6a11cb,#2575fc);color:#fff;">
          <h1 style="margin:0;font-size:20px;">Module manager verification</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;">Your verification code is <b style="letter-spacing:4px;font-size:18px;">${otp}</b>. It expires in 10 minutes.</td></tr>
      </table></div>`;
    
    // Try to send email, but don't fail the entire request if email fails
    try {
      await sendMail({ to: email, subject, html });
      res.json({ success: true, message: 'OTP resent successfully' });
    } catch (emailError) {
      console.error('Failed to resend email:', emailError);
      // Still return success but indicate that email failed
      res.json({ 
        success: true, 
        message: 'OTP regenerated successfully. Email failed to send, please check server logs and share OTP manually with the candidate.',
        emailError: emailError.message 
      });
    }
  } catch (error) {
    console.error('Resend invite error:', error);
    res.status(500).json({ success: false, message: 'Server error during resend' });
  }
});

// @route   DELETE /api/admin/cancel-invite
// @desc    Cancel a pending invitation
// @access  Private (Admin)
router.delete('/cancel-invite/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const { id } = req.params;
    
    const invite = await AdminInvite.findByIdAndDelete(id);
    
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }
    
    res.json({ success: true, message: 'Invitation cancelled successfully' });
  } catch (err) {
    console.error('Cancel invite error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
