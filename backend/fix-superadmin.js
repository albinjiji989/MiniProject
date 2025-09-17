const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Simple User schema for this script
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  isActive: Boolean,
  lastLogin: Date,
  firebaseUid: String,
  provider: String,
  profileImage: String,
  unitId: String,
  unitName: String,
  unitLocation: String,
  assignedModule: String,
  supervisor: mongoose.Schema.Types.ObjectId,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function fixSuperAdmin() {
  try {
    // Try different MongoDB connection strings
    const connectionStrings = [
      'mongodb://localhost:27017/petwelfare',
      'mongodb://127.0.0.1:27017/petwelfare',
      'mongodb://localhost:27017/petwelfare?retryWrites=true&w=majority'
    ];

    let connected = false;
    for (const connStr of connectionStrings) {
      try {
        console.log(`Trying to connect to: ${connStr}`);
        await mongoose.connect(connStr, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000
        });
        console.log('Connected to MongoDB successfully!');
        connected = true;
        break;
      } catch (err) {
        console.log(`Failed to connect to ${connStr}: ${err.message}`);
      }
    }

    if (!connected) {
      console.log('Could not connect to MongoDB. Please ensure MongoDB is running.');
      console.log('You can start MongoDB by running: mongod');
      process.exit(1);
    }

    // Find or create Super Admin user
    let superAdmin = await User.findOne({ email: 'albinjiji2026@mca.ajce.in' });
    
    if (superAdmin) {
      console.log('Found existing Super Admin user, updating...');
      console.log('Current user:', {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        isActive: superAdmin.isActive,
        provider: superAdmin.provider
      });
      
      // Update existing user
      superAdmin.name = 'ADMIN';
      superAdmin.role = 'super_admin';
      superAdmin.isActive = true;
      superAdmin.provider = 'manual';
      superAdmin.phone = '000-000-0000';
      
      // Ensure password is properly hashed
      if (superAdmin.password && !superAdmin.password.startsWith('$2')) {
        console.log('Hashing password...');
        superAdmin.password = await bcrypt.hash(superAdmin.password, 12);
      } else if (!superAdmin.password) {
        console.log('Setting default password...');
        superAdmin.password = await bcrypt.hash('Admin@123', 12);
      }
      
      await superAdmin.save();
      console.log('✅ Super Admin user updated successfully!');
      
    } else {
      console.log('Creating new Super Admin user...');
      
      // Create new Super Admin user
      const hashedPassword = await bcrypt.hash('Admin@123', 12);
      
      superAdmin = new User({
        name: 'ADMIN',
        email: 'albinjiji2026@mca.ajce.in',
        password: hashedPassword,
        role: 'super_admin',
        phone: '000-000-0000',
        isActive: true,
        provider: 'manual'
      });

      await superAdmin.save();
      console.log('✅ Super Admin user created successfully!');
    }

    // Display final user info
    console.log('\n📋 Super Admin user details:');
    console.log({
      id: superAdmin._id,
      name: superAdmin.name,
      email: superAdmin.email,
      role: superAdmin.role,
      isActive: superAdmin.isActive,
      provider: superAdmin.provider,
      hasPassword: !!superAdmin.password
    });

    console.log('\n🔑 Login credentials:');
    console.log('Email: albinjiji2026@mca.ajce.in');
    console.log('Password: Admin@123');

    console.log('\n✅ Super Admin user is ready for login!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check if the database "petwelfare" exists');
    console.log('3. Try running: mongod (in a separate terminal)');
    process.exit(1);
  }
}

fixSuperAdmin();
