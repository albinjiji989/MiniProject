const mongoose = require('mongoose');
const User = require('./core/models/User');
const UserDetails = require('./models/UserDetails');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petwelfare', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createSuperAdmin() {
  try {
    console.log('Creating Admin with unified model...\n');

    const email = process.env.ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL;
    const name = process.env.ADMIN_NAME || process.env.SUPER_ADMIN_NAME || 'ADMIN';
    const password = process.env.ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD;

    // Check if required environment variables are set
    if (!email || !password) {
      console.log('❌ Admin credentials not set in environment variables');
      console.log('Please set ADMIN_EMAIL and ADMIN_PASSWORD (or SUPER_ADMIN_* fallback) in .env file');
      return;
    }

    // Check if Admin already exists and delete if needed
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Admin already exists, deleting and recreating...');
      await UserDetails.deleteOne({ userId: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
      console.log('✅ Existing Admin deleted');
    }

    // Create Admin user
    const superAdmin = new User({
      name,
      email,
      password,
      phone: '000-000-0000',
      authProvider: 'both',  // Can use both manual password AND Google login
      role: 'admin'
    });

    console.log('Before save - password:', superAdmin.password);
    await superAdmin.save();
    console.log('After save - password:', superAdmin.password ? 'Set' : 'Null');
    console.log('✅ Admin user created');

    // Create Admin user details
    const superAdminDetails = new UserDetails({
      userId: superAdmin._id,
      role: 'admin'
    });

    await superAdminDetails.save();
    console.log('✅ Admin user details created');

    console.log('\n🎉 Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: admin');

  } catch (error) {
    console.error('❌ Error creating Admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSuperAdmin();
