const { validationResult } = require('express-validator');
const User = require('../../../../core/models/User');
const UserDetails = require('../../../../core/models/UserDetails');
const { generateStoreId } = require('../../../../core/utils/storeIdGenerator');
const Veterinary = require('../../models/Veterinary');

const getMyStoreInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    let storeId = user.storeId || null;
    let storeName = user.storeName || '';
    let assignedModule = user.assignedModule || null;
    const userDetails = await UserDetails.findOne({ userId: req.user.id });
    if (userDetails) {
      if (userDetails.storeId) storeId = userDetails.storeId;
      if (userDetails.storeName) storeName = userDetails.storeName;
      if (userDetails.assignedModule) assignedModule = userDetails.assignedModule;
    }
    return res.json({ success: true, data: { role: user.role, assignedModule, storeId, storeName } });
  } catch (e) {
    console.error('Veterinary getMyStoreInfo error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateMyStoreInfo = async (req, res) => {
  try {
    console.log('=== VETERINARY UPDATE STORE INFO DEBUG ===');
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }
    
    console.log('Looking up user with ID:', req.user.id);
    const user = await User.findById(req.user.id);
    console.log('Found user:', user ? { id: user._id, name: user.name, role: user.role, storeId: user.storeId, storeName: user.storeName } : 'NOT FOUND');
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.storeId) {
      const moduleKey = user.assignedModule || (user.role?.split('_')[0]) || 'veterinary';
      console.log('Generating storeId with moduleKey:', moduleKey);
      try {
        user.storeId = await generateStoreId(moduleKey, [{ model: User, field: 'storeId' }]);
        console.log('Generated storeId:', user.storeId);
      } catch (err) {
        console.log('StoreId generation failed, using fallback:', err.message);
        user.storeId = await generateStoreId('veterinary', [{ model: User, field: 'storeId' }]);
        console.log('Fallback storeId:', user.storeId);
      }
    }
    
    if (typeof req.body.storeName === 'string') {
      user.storeName = String(req.body.storeName).trim();
      console.log('Set storeName to:', user.storeName);
    }
    
    console.log('Saving user...');
    await user.save();
    console.log('User saved successfully');

    const userDetails = await UserDetails.findOne({ userId: req.user.id });
    console.log('UserDetails found:', userDetails ? 'YES' : 'NO');
    if (userDetails) {
      userDetails.storeId = user.storeId;
      userDetails.storeName = user.storeName;
      if (!userDetails.assignedModule) userDetails.assignedModule = 'veterinary';
      console.log('Updating existing UserDetails...');
      await userDetails.save();
      console.log('UserDetails updated');
    } else {
      console.log('Creating new UserDetails...');
      await new UserDetails({ userId: req.user.id, assignedModule: 'veterinary', storeId: user.storeId, storeName: user.storeName, storeDetails: { status: 'active' } }).save();
      console.log('UserDetails created');
    }
    
    // Automatically create a clinic for veterinary managers
    if (user.role === 'veterinary_manager' && user.storeId && user.storeName) {
      console.log('Creating automatic clinic for veterinary manager...');
      try {
        // Check if a clinic already exists for this store
        const existingClinic = await Veterinary.findOne({ storeId: user.storeId });
        if (!existingClinic) {
          console.log('No existing clinic found, creating new one...');
          // Create a clinic with the same information as the store
          const clinicData = {
            name: user.storeName,
            storeId: user.storeId,
            storeName: user.storeName,
            createdBy: user._id,
            address: {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: ''
            },
            location: {
              type: 'Point',
              coordinates: [0, 0] // Default coordinates
            },
            contact: {
              phone: '',
              email: user.email || '',
              website: ''
            },
            services: [],
            isActive: true
          };
          
          const clinic = new Veterinary(clinicData);
          await clinic.save();
          console.log('Automatic clinic created:', clinic._id);
        } else {
          console.log('Clinic already exists for this store:', existingClinic._id);
        }
      } catch (clinicError) {
        console.error('Error creating automatic clinic:', clinicError);
        // Don't fail the store setup if clinic creation fails
      }
    }
    
    console.log('=== SUCCESS ===');
    return res.json({ success: true, message: 'Store info updated', data: { storeId: user.storeId, storeName: user.storeName } });
  } catch (e) {
    console.error('=== VETERINARY UPDATE STORE ERROR ===');
    console.error('Error name:', e.name);
    console.error('Error message:', e.message);
    console.error('Error stack:', e.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getMyStoreInfo, updateMyStoreInfo };