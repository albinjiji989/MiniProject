const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../core/models/User');
const UserDetails = require('../models/UserDetails');
const { auth, authorize } = require('../middleware/auth');
const PasswordReset = require('../core/models/PasswordReset');
const { sendMail } = require('../core/utils/email');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
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

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
        error: 'An account with this email address already exists. Please use a different email or try logging in instead.'
      });
    }

    // Create new user with basic info and default role
    const user = new User({
      name,
      email,
      password,
      phone,
      authProvider: 'local',
      role: 'public_user'
    });

    await user.save();

    // Create user details
    const userDetails = new UserDetails({
      userId: user._id
    });

    await userDetails.save();

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        // Fire and forget welcome email
        try {
          const appName = 'PetWelfare';
          const subject = `Welcome to ${appName}, ${user.name}!`;
          const html = `
          <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:24px;color:#e6e9ef;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);backdrop-filter: blur(10px); border-radius:16px; overflow:hidden;">
              <tr>
                <td style="padding:28px 28px 12px;background:linear-gradient(135deg,#5b8cff,#9b6bfe);color:white;">
                  <h1 style="margin:0;font-size:22px;">Welcome aboard 👋</h1>
                  <p style="margin:6px 0 0;font-size:14px;opacity:.9">You're all set, ${user.name}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 12px;">Thanks for joining <strong>${appName}</strong>. Manage your pets, bookings, and health records in one place.</p>
                  <ul style="margin:0 0 16px;padding-left:18px;">
                    <li>Centralized pet profiles with history</li>
                    <li>Easy veterinary bookings</li>
                    <li>Smart reminders and updates</li>
                  </ul>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display:inline-block;background:#5b8cff;color:white;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:600">Go to Dashboard</a>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 28px 24px;color:#9aa4b2;font-size:12px">If you didn’t sign up, ignore this email.</td>
              </tr>
            </table>
          </div>`;
          sendMail({ to: user.email, subject, html }).catch(()=>{});
        } catch (_) {}
        res.json({
          success: true,
          message: 'User registered successfully',
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: 'public_user',
              authProvider: user.authProvider
            },
            token
          }
        });
      }
    );
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;

    // Find user by email (include password field)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user has a password
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account was created with Google. Please use "Continue with Google" to sign in, or set a password using "Forgot Password" first.'
      });
    }

    // Check password
    let isMatch = await user.matchPassword(password);
    // If not match, but stored password may be plaintext from legacy seed, hash it once and retry
    if (!isMatch && typeof user.password === 'string' && !user.password.startsWith('$2')) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(user.password, salt);
      user.password = hashed;
      await user.save();
      isMatch = await user.matchPassword(password);
    }
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get user role
    const userRole = user.role;

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: userRole
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          message: 'Login successful',
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: userRole,
              authProvider: user.authProvider,
              mustChangePassword: user.mustChangePassword
            },
            token
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/firebase-login
// @desc    Login with Firebase (Google OAuth)
// @access  Public
router.post('/firebase-login', [
  body('firebaseUid').notEmpty().withMessage('Firebase UID is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('name').optional().isString(),
  body('profileImage').optional().isString(),
  body('provider').optional().isString(),
  body('role').optional().isString(),
  body('assignedModule').optional()
], async (req, res) => {
  try {
    console.log('Firebase login request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { firebaseUid, email, name, profileImage, role, assignedModule, provider } = req.body;
    const effectiveName = (typeof name === 'string' && name.trim().length > 0) ? name.trim() : (email.split('@')[0]);
    // Normalize provider values coming from Firebase: e.g., 'google.com' => 'google', 'password' => 'local'
    const normalizedAuthProvider = (() => {
      if (!provider) return 'google';
      const p = String(provider).toLowerCase();
      if (p.includes('google')) return 'google';
      if (p.includes('password') || p.includes('email')) return 'local';
      return 'google';
    })();
    const normalizedProvider = normalizedAuthProvider === 'local' ? 'email' : 'google';
    console.log('Processing Firebase login for:', email);
    console.log('Request body:', { firebaseUid, email, name, profileImage, role, assignedModule });

    // Find existing user first
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user
      console.log('Found existing user, updating Firebase details...');
      if (effectiveName && (!user.name || user.name === user.email.split('@')[0])) {
        user.name = effectiveName;
      }
      user.firebaseUid = firebaseUid;
      user.profilePicture = profileImage;
      if (user.password) {
        user.authProvider = normalizedAuthProvider === 'google' ? 'both' : (user.authProvider || 'local');
        user.provider = user.authProvider === 'both' ? 'both' : (normalizedAuthProvider === 'google' ? 'google' : 'email');
      } else {
        user.authProvider = normalizedAuthProvider;
        user.provider = normalizedProvider;
      }
      await user.save();
      console.log('User updated successfully');
    } else {
      // Create new user
      console.log('Creating new Google user...');
      try {
        user = new User({
          name: effectiveName,
          email,
          firebaseUid,
          authProvider: normalizedAuthProvider,
          provider: normalizedProvider,
          profilePicture: profileImage,
          phone: '', // Empty phone for Google users
          password: null, // Explicitly set password to null for Google users
          role: 'public_user'
        });
        await user.save();
        console.log('User created successfully');

        // Send welcome email (fire-and-forget)
        try {
          const appName = 'PetWelfare';
          const subject = `Welcome to ${appName}, ${user.name}!`;
          const html = `
          <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:24px;color:#e6e9ef;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);backdrop-filter: blur(10px); border-radius:16px; overflow:hidden;">
              <tr>
                <td style="padding:28px 28px 12px;background:linear-gradient(135deg,#5b8cff,#9b6bfe);color:white;">
                  <h1 style="margin:0;font-size:22px;">Welcome aboard 👋</h1>
                  <p style="margin:6px 0 0;font-size:14px;opacity:.9">You're all set, ${user.name}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 12px;">Thanks for joining <strong>${appName}</strong>. Manage your pets, bookings, and health records in one place.</p>
                  <ul style="margin:0 0 16px;padding-left:18px;">
                    <li>Centralized pet profiles with history</li>
                    <li>Easy veterinary bookings</li>
                    <li>Smart reminders and updates</li>
                  </ul>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display:inline-block;background:#5b8cff;color:white;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:600">Go to Dashboard</a>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 28px 24px;color:#9aa4b2;font-size:12px">If you didn’t sign up, ignore this email.</td>
              </tr>
            </table>
          </div>`;
          sendMail({ to: user.email, subject, html }).catch(() => {});
        } catch (_) {}
      } catch (userError) {
        console.error('Error creating user:', userError);
        // Check if it's a duplicate key error
        if (userError.code === 11000) {
          return res.status(400).json({
            success: false,
            message: 'Email already registered',
            error: 'An account with this email address already exists. Please try logging in instead.'
          });
        }
        throw userError;
      }
    }

    // Check if user details exist, if not create them
    let userDetails = await UserDetails.findOne({ userId: user._id });
    if (!userDetails) {
      console.log('Creating user details...');
      try {
        userDetails = new UserDetails({
          userId: user._id,
          assignedModule: assignedModule,
          address: {
            street: '',
            city: '',
            state: '',
            country: ''
          },
          preferences: {
            notifications: {
              email: true,
              sms: false,
              push: true
            },
            language: 'en',
            timezone: 'UTC'
          }
        });
        await userDetails.save();
        console.log('User details saved successfully');
      } catch (userDetailsError) {
        console.error('Error creating user details:', userDetailsError);
        // If user details creation fails, continue without them
        userDetails = null;
      }
    } else {
      console.log('User details already exist');
    }

    // Get user role
    const userRole = user.role;

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: userRole
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          message: 'Firebase login successful',
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: userRole,
              authProvider: user.authProvider
            },
            token
          }
        });
      }
    );
  } catch (error) {
    console.error('Firebase login error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Handle specific error types
    if (error.code === 11000) {
      console.log('Duplicate key error detected, attempting recovery...');
      try {
        // Try to find the existing user and update it
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
          console.log('Found existing user, updating Firebase details...');
          existingUser.firebaseUid = req.body.firebaseUid;
          existingUser.profilePicture = req.body.profileImage;
          existingUser.authProvider = existingUser.password ? 'both' : 'google';
          await existingUser.save();
          
          // Get user role
          const userRole = existingUser.role;
          
          // Generate JWT token
          const payload = {
            user: {
              id: existingUser.id,
              role: userRole
            }
          };
          
          const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
          
          return res.json({
            success: true,
            message: 'Firebase login successful (recovered from duplicate key)',
            data: {
              user: {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                role: userRole,
                authProvider: existingUser.authProvider,
                profilePicture: existingUser.profilePicture
              },
              token
            }
          });
        }
      } catch (retryError) {
        console.error('Recovery attempt failed:', retryError);
      }
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error during Firebase login',
        error: error.message,
        details: error.errors
      });
    }
    
    // Handle other specific errors
    if (error.name === 'CastError') {
      console.error('Cast error details:', error);
      return res.status(400).json({
        success: false,
        message: 'Data type error during Firebase login',
        error: error.message
      });
    }
    
    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Server error during Firebase login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
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

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous tokens
    await PasswordReset.updateMany({ userId: user._id, used: false }, { $set: { used: true } });
    await PasswordReset.create({ userId: user._id, email, otp, expiresAt, used: false });

    // Send OTP email (premium template)
    const subject = 'Your PetWelfare password reset code';
    const html = `
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:24px;color:#e6e9ef;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);backdrop-filter: blur(10px); border-radius:16px; overflow:hidden;">
        <tr>
          <td style="padding:28px 28px 12px;background:linear-gradient(135deg,#ff7b7b,#fdc36b);color:white;">
            <h1 style="margin:0;font-size:22px;">Reset your password</h1>
            <p style="margin:6px 0 0;font-size:14px;opacity:.9">Use the code below within 10 minutes</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px; text-align:center;">
            <div style="display:inline-block;background:#101828;border:1px solid rgba(255,255,255,.1);padding:14px 18px;border-radius:12px;letter-spacing:6px;font-size:26px;font-weight:800;">${otp}</div>
            <p style="margin:16px 0 0;color:#9aa4b2;font-size:12px">Do not share this code with anyone.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 24px;color:#9aa4b2;font-size:12px">If you didn’t request this, you can safely ignore this email.</td>
        </tr>
      </table>
    </div>`;
    await sendMail({ to: user.email, subject, html });

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during forgot password'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').matches(/^\d{6}$/).withMessage('OTP must be 6 digits'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value,{req})=>value===req.body.password).withMessage('Passwords do not match')
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

    const { email, otp, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const record = await PasswordReset.findOne({ userId: user._id, email, used: false })
      .sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP not found. Request a new one.' });
    }
    if (record.expiresAt < new Date()) {
      record.used = true;
      await record.save();
      return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });
    }
    if (record.otp !== otp) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Mark used and reset password
    record.used = true;
    await record.save();

    user.password = password;
    user.authProvider = user.authProvider === 'google' ? 'both' : 'local';
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// @route   POST /api/auth/force-password
// @desc    Force password change with old temp password check
// @access  Private (logged-in user)
router.post('/force-password', [
  auth,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const ok = await user.matchPassword(currentPassword);
    if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    res.json({ success: true, message: 'Password updated. Please sign in again.' });
  } catch (error) {
    console.error('Force password error:', error);
    res.status(500).json({ success: false, message: 'Server error during password update' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user role
    const userRole = user.role;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: userRole,
          authProvider: user.authProvider
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;