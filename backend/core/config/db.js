const mongoose = require('mongoose');
const User = require('../models/User');
const UserDetails = require('../../models/UserDetails');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
    
    // Check and create Admin
    await ensureAdminExists();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Function to ensure Admin exists
const ensureAdminExists = async () => {
  try {
    const email = process.env.ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL;
    const name = process.env.ADMIN_NAME || process.env.SUPER_ADMIN_NAME || 'ADMIN';
    const password = process.env.ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD;

    // Check if required environment variables are set
    if (!email || !password) {
      console.log('⚠️  Admin credentials not set in environment variables');
      console.log('Please set ADMIN_EMAIL and ADMIN_PASSWORD (or SUPER_ADMIN_* fallback) in .env file');
      return;
    }

    // Check if Admin already exists
    const existingUser = await User.findOne({ email }).select('+password');
    if (existingUser) {
      console.log('✅ Admin already exists');
      // Ensure Admin has a password and proper authProvider
      let changed = false;
      if (!existingUser.password) {
        existingUser.password = password;
        changed = true;
      }
      if (existingUser.authProvider !== 'both') {
        existingUser.authProvider = 'both';
        changed = true;
      }
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        changed = true;
      }
      if (!existingUser.phone) {
        existingUser.phone = '000-000-0000';
        changed = true;
      }
      if (changed) {
        await existingUser.save();
        console.log('🔧 Admin credentials normalized (password/authProvider/role)');
      }
      return;
    }

    console.log('🔧 Creating Admin...');

    // Create Admin user
    const adminUser = new User({
      name,
      email,
      password,
      phone: '000-000-0000',
      authProvider: 'both',  // Can use both manual password AND Google login
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Admin user created');

    // Create Admin user details
    const adminDetails = new UserDetails({
      userId: adminUser._id
    });

    await adminDetails.save();
    console.log('✅ Admin user details created');

    console.log('🎉 Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: admin');

  } catch (error) {
    console.error('❌ Error creating Admin:', error);
  }
};

module.exports = connectDB;


