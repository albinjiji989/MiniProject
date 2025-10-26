const express = require('express');
const router = express.Router();
const { auth } = require('../../../core/middleware/auth');
const { body, validationResult } = require('express-validator');
const User = require('../../../core/models/User');
const UserDetails = require('../../../core/models/UserDetails');
const Activity = require('../../../core/models/Activity');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer to store files in memory for Cloudinary upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed'), false);
    }
  }
});

const bcrypt = require('bcryptjs');
const { generateStoreId } = require('../../../core/utils/storeIdGenerator');

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

    // Determine which profile picture to show
    // Priority: Custom uploaded (if useCustomProfilePicture is true) > Google profile picture
    let displayProfilePicture = baseUser.profilePicture;
    if (baseUser.googleProfilePicture && !baseUser.useCustomProfilePicture) {
      displayProfilePicture = baseUser.googleProfilePicture;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: userId,
          name: baseUser.name,
          email: baseUser.email,
          phone: baseUser.phone,
          profilePicture: displayProfilePicture,
          googleProfilePicture: baseUser.googleProfilePicture,
          uploadedProfilePictures: baseUser.uploadedProfilePictures || [],
          useCustomProfilePicture: baseUser.useCustomProfilePicture || false,
          authProvider: baseUser.authProvider,
          hasPassword: !!baseUser.password,
          role: baseUser.role,
          assignedModule: userDetails ? userDetails.assignedModule : null,
          storeId: baseUser.storeId,
          storeName: baseUser.storeName,
          address: userDetails ? userDetails.address : '',
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
    .withMessage('Address must be at least 5 characters'),
  body('storeName')
    .optional()
    .isLength({ min: 3 })
    .withMessage('Store name must be at least 3 characters'),
  body('pincode')
    .optional()
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be exactly 6 digits')
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

    const { name, phone, address, preferences, storeName, pincode } = req.body;
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
    
    // Handle store name update for module managers
    if (storeName && typeof user.role === 'string' && user.role.endsWith('_manager')) {
      user.storeName = storeName;
      
      // If user doesn't have a storeId yet, generate one
      if (!user.storeId) {
        const moduleId = user.assignedModule || user.role.replace('_manager', '');
        user.storeId = await generateStoreId(moduleId);
      }
    }
    
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
            pincode: pincode || '',
            country: ''
          };
        } else {
          userDetails.address = { ...userDetails.address, ...address };
          // Update pincode if provided
          if (pincode) {
            userDetails.address.pincode = pincode;
          }
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
          pincode: pincode || '',
          country: ''
        } : {
          ...address,
          pincode: pincode || (address ? address.pincode : '') || ''
        } || {
          street: '',
          city: '',
          state: '',
          pincode: pincode || '',
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
          role: user.role,
          assignedModule: user.assignedModule,
          storeId: user.storeId,
          storeName: user.storeName,
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
router.put('/picture', [auth], async (req, res) => {
  try {
    const { profilePicture, useGoogle } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (useGoogle) {
      // Revert to Google profile picture
      if (!user.googleProfilePicture) {
        return res.status(400).json({
          success: false,
          message: 'No Google profile picture available'
        });
      }
      user.useCustomProfilePicture = false;
    } else {
      // Set custom profile picture
      if (!profilePicture) {
        return res.status(400).json({
          success: false,
          message: 'Profile picture URL is required'
        });
      }
      user.profilePicture = profilePicture;
      user.useCustomProfilePicture = true;
    }

    await user.save();

    // Determine which picture to return
    const displayPicture = user.useCustomProfilePicture ? user.profilePicture : user.googleProfilePicture;

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: displayPicture,
        useCustomProfilePicture: user.useCustomProfilePicture
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

// @route   POST /api/profile/upload-picture
// @desc    Upload profile picture
// @access  Private
router.post('/upload-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.buffer, {
      folder: 'profile-pictures',
      public_id: `profile-${user.id}-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    });

    // Add to user's uploaded images array
    if (!user.uploadedProfilePictures) {
      user.uploadedProfilePictures = [];
    }
    user.uploadedProfilePictures.push(result.secure_url);
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        imageUrl: result.secure_url,
        images: user.uploadedProfilePictures
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/profile/pictures
// @desc    Get all uploaded profile pictures for current user
// @access  Private
router.get('/pictures', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        images: user.uploadedProfilePictures || [],
        currentPicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Get profile pictures error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/profile/picture
// @desc    Delete an uploaded profile picture
// @access  Private
router.delete('/picture', auth, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove from user's uploaded images
    if (user.uploadedProfilePictures) {
      user.uploadedProfilePictures = user.uploadedProfilePictures.filter(
        img => img !== imageUrl
      );
    }

    // If this was the current profile picture, clear it
    if (user.profilePicture === imageUrl) {
      user.profilePicture = '';
    }

    await user.save();

    // Delete the physical file if it's a local upload
    if (imageUrl.includes('/uploads/profile-pictures/')) {
      const filename = imageUrl.split('/uploads/profile-pictures/').pop();
      const filePath = path.join(__dirname, '../../../uploads/profile-pictures', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({
      success: true,
      message: 'Profile picture deleted successfully',
      data: {
        images: user.uploadedProfilePictures
      }
    });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;