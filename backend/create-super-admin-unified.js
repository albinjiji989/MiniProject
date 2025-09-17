const mongoose = require('mongoose');
const User = require('./models/User');
const UserDetails = require('./models/UserDetails');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petwelfare', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createSuperAdmin() {
  try {
    console.log('Creating Super Admin with unified model...\n');

    const email = process.env.SUPER_ADMIN_EMAIL;
    const name = process.env.SUPER_ADMIN_NAME || 'ADMIN';
    const password = process.env.SUPER_ADMIN_PASSWORD;

    // Check if required environment variables are set
    if (!email || !password) {
      console.log('❌ Super Admin credentials not set in environment variables');
      console.log('Please set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env file');
      return;
    }

    // Check if Super Admin already exists and delete if needed
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Super Admin already exists, deleting and recreating...');
      await UserDetails.deleteOne({ userId: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
      console.log('✅ Existing Super Admin deleted');
    }

    // Create Super Admin user
    const superAdmin = new User({
      name,
      email,
      password,
      phone: '000-000-0000',
      authProvider: 'both'  // Can use both manual password AND Google login
    });

    console.log('Before save - password:', superAdmin.password);
    await superAdmin.save();
    console.log('After save - password:', superAdmin.password ? 'Set' : 'Null');
    console.log('✅ Super Admin user created');

    // Create Super Admin user details
    const superAdminDetails = new UserDetails({
      userId: superAdmin._id,
      role: 'super_admin'
    });

    await superAdminDetails.save();
    console.log('✅ Super Admin user details created');

    console.log('\n🎉 Super Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: super_admin');

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSuperAdmin();
