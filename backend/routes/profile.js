const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../core/models/User');
const UserDetails = require('../models/UserDetails');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// @route   GET /api/profile
// @desc    Get current user profile
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const baseUser = req.user;
    const userId = baseUser?._id || baseUser?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Use existing req.user to avoid unnecessary re-query
    const userDetails = await UserDetails.findOne({ userId: userId });

    res.json({
      success: true,
      data: {
        user: {
          id: userId,
          name: baseUser.name,
          email: baseUser.email,
          phone: baseUser.phone,
          profilePicture: baseUser.profilePicture,
          authProvider: baseUser.authProvider,
          hasPassword: !!baseUser.password,
          role: baseUser.role,
          assignedModule: userDetails ? userDetails.assignedModule : null,
          address: userDetails ? userDetails.address : '',
          preferences: userDetails ? userDetails.preferences : {},
          isVerified: userDetails ? userDetails.isVerified : false,
          status: userDetails ? userDetails.status : 'active',
          lastActive: userDetails ? userDetails.lastActive : baseUser.lastActive,
          createdAt: baseUser.createdAt,
          updatedAt: baseUser.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/profile/password
// @desc    Update user password
// @access  Private
router.put('/password', [
  auth,
  body('currentPassword')
    .optional()
    .custom((value, { req }) => {
      // If user has a password, current password is required
      if (req.user.hasPassword && !value) {
        throw new Error('Current password is required');
      }
      return true;
    }),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
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

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user has a password, verify current password
    if (user.password && currentPassword) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Update password
    user.password = newPassword;
    user.authProvider = user.authProvider === 'google' ? 'both' : 'local';
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/profile/details
// @desc    Update user details
// @access  Private
router.put('/details', [
  auth,
  body('name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('phone')
    .optional()
    .matches(/^[\+]?[0-9][\d\-\s\(\)]{7,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .isLength({ min: 5 })
    .withMessage('Address must be at least 5 characters')
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

    const { name, phone, address, preferences } = req.body;
    const user = await User.findById(req.user.id);
    let userDetails = await UserDetails.findOne({ userId: req.user.id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user basic info
    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();

    // Update or create user details
    if (userDetails) {
      if (address) {
        // Handle address as object
        if (typeof address === 'string') {
          // If address is a string, parse it or set as street
          userDetails.address = {
            street: address,
            city: '',
            state: '',
            zipCode: '',
            country: ''
          };
        } else {
          userDetails.address = { ...userDetails.address, ...address };
        }
      }
      if (preferences) {
        // Handle nested preferences structure
        if (preferences.notifications) {
          userDetails.preferences.notifications = { ...userDetails.preferences.notifications, ...preferences.notifications };
        }
        if (preferences.language) userDetails.preferences.language = preferences.language;
        if (preferences.timezone) userDetails.preferences.timezone = preferences.timezone;
      }
      await userDetails.save();
    } else {
      userDetails = new UserDetails({
        userId: user._id,
        role: 'public_user',
        address: typeof address === 'string' ? {
          street: address,
          city: '',
          state: '',
          zipCode: '',
          country: ''
        } : address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        preferences: preferences || {
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
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profilePicture: user.profilePicture,
          authProvider: user.authProvider,
          role: userDetails.role,
          assignedModule: userDetails.assignedModule,
          address: userDetails.address,
          preferences: userDetails.preferences
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/profile/picture
// @desc    Update profile picture
// @access  Private
router.put('/picture', [
  auth,
  body('profilePicture')
    .isURL()
    .withMessage('Please provide a valid image URL')
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

    const { profilePicture } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.profilePicture = profilePicture;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
