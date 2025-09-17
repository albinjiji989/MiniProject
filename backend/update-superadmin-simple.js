// Simple script to update Super Admin user
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Use the same database connection as the main app
const connectDB = require('./core/config/db');

// Define User schema (simplified)
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

async function updateSuperAdmin() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Connect to database using the same config as the main app
    await connectDB();
    
    console.log('✅ Connected to database successfully!');
    
    // Find or create Super Admin user
    let superAdmin = await User.findOne({ email: 'albinjiji2026@mca.ajce.in' });
    
    if (superAdmin) {
      console.log('📋 Found existing Super Admin user:');
      console.log({
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        isActive: superAdmin.isActive,
        provider: superAdmin.provider,
        hasPassword: !!superAdmin.password
      });
      
      console.log('🔄 Updating Super Admin user...');
      
      // Update existing user
      superAdmin.name = 'ADMIN';
      superAdmin.role = 'super_admin';
      superAdmin.isActive = true;
      superAdmin.provider = 'manual';
      superAdmin.phone = '000-000-0000';
      
      // Ensure password is properly hashed
      if (superAdmin.password && !superAdmin.password.startsWith('$2')) {
        console.log('🔐 Hashing password...');
        superAdmin.password = await bcrypt.hash(superAdmin.password, 12);
      } else if (!superAdmin.password) {
        console.log('🔐 Setting default password...');
        superAdmin.password = await bcrypt.hash('Admin@123', 12);
      }
      
      await superAdmin.save();
      console.log('✅ Super Admin user updated successfully!');
      
    } else {
      console.log('🆕 Creating new Super Admin user...');
      
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
    console.log('\n📋 Final Super Admin user details:');
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
    console.log('You can now login with both manual and Google authentication.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check your .env file for correct database URL');
    console.log('3. Try running: mongod (in a separate terminal)');
    process.exit(1);
  }
}

updateSuperAdmin();
