const mongoose = require('mongoose');
const User = require('../models/User');
const UserDetails = require('../../models/UserDetails');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
    
    // Check and create Super Admin
    await ensureSuperAdminExists();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Function to ensure Super Admin exists
const ensureSuperAdminExists = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const name = process.env.SUPER_ADMIN_NAME || 'ADMIN';
    const password = process.env.SUPER_ADMIN_PASSWORD;

    // Check if required environment variables are set
    if (!email || !password) {
      console.log('⚠️  Super Admin credentials not set in environment variables');
      console.log('Please set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env file');
      return;
    }

    // Check if Super Admin already exists
    const existingUser = await User.findOne({ email }).select('+password');
    if (existingUser) {
      console.log('✅ Super Admin already exists');
      // Ensure Super Admin has a password and proper authProvider
      let changed = false;
      if (!existingUser.password) {
        existingUser.password = password;
        changed = true;
      }
      if (existingUser.authProvider !== 'both') {
        existingUser.authProvider = 'both';
        changed = true;
      }
      if (existingUser.role !== 'super_admin') {
        existingUser.role = 'super_admin';
        changed = true;
      }
      if (!existingUser.phone) {
        existingUser.phone = '000-000-0000';
        changed = true;
      }
      if (changed) {
        await existingUser.save();
        console.log('🔧 Super Admin credentials normalized (password/authProvider/role)');
      }
      return;
    }

    console.log('🔧 Creating Super Admin...');

    // Create Super Admin user
    const superAdmin = new User({
      name,
      email,
      password,
      phone: '000-000-0000',
      authProvider: 'both',  // Can use both manual password AND Google login
      role: 'super_admin'
    });

    await superAdmin.save();
    console.log('✅ Super Admin user created');

    // Create Super Admin user details
    const superAdminDetails = new UserDetails({
      userId: superAdmin._id
    });

    await superAdminDetails.save();
    console.log('✅ Super Admin user details created');

    console.log('🎉 Super Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: super_admin');

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
  }
};

module.exports = connectDB;


