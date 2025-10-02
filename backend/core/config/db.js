const mongoose = require('mongoose');
const User = require('../models/User');
const UserDetails = require('../../models/UserDetails');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Please set it in your .env');
    process.exit(1);
  }

  const maxAttempts = 3;
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 20000,
      });
      console.log('MongoDB connected successfully');
      await ensureAdminExists();
      return;
    } catch (err) {
      // Quiet logging without attempt counts
      console.error('MongoDB connection error:', err?.code || err?.name || err?.message || err);
      if (attempt < maxAttempts) {
        const backoffMs = attempt * 2000; // incremental backoff
        await delay(backoffMs);
        continue;
      }
      console.error('MongoDB connection failed. Exiting.');
      process.exit(1);
    }
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


