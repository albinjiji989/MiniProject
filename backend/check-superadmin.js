const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function checkAndUpdateSuperAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/petwelfare');
    console.log('Connected to MongoDB');

    // Find Super Admin user
    let superAdmin = await User.findOne({ email: 'albinjiji2026@mca.ajce.in' });
    
    if (superAdmin) {
      console.log('Current Super Admin user:');
      console.log({
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        firebaseUid: superAdmin.firebaseUid,
        provider: superAdmin.provider,
        isActive: superAdmin.isActive,
        hasPassword: !!superAdmin.password,
        lastLogin: superAdmin.lastLogin
      });

      // Update Admin to ensure it's properly configured
      superAdmin.role = 'admin';
      superAdmin.isActive = true;
      superAdmin.provider = 'manual'; // Set to manual since it was created manually
      
      // Ensure password is properly hashed
      if (superAdmin.password) {
        // Check if password is already hashed
        const isHashed = superAdmin.password.startsWith('$2');
        if (!isHashed) {
          console.log('Hashing password...');
          superAdmin.password = await bcrypt.hash(superAdmin.password, 12);
        }
      } else {
        console.log('Setting default password...');
        superAdmin.password = await bcrypt.hash('Admin@123', 12);
      }

      await superAdmin.save();
      console.log('Super Admin user updated successfully!');
      
    } else {
      console.log('Super Admin user not found! Creating new one...');
      
      // Create new Super Admin user
      const hashedPassword = await bcrypt.hash('Admin@123', 12);
      
      superAdmin = new User({
        name: 'ADMIN',
        email: 'albinjiji2026@mca.ajce.in',
        password: hashedPassword,
        role: 'admin',
        phone: '000-000-0000',
        isActive: true,
        provider: 'manual',
        lastLogin: new Date()
      });

      await superAdmin.save();
      console.log('Super Admin user created successfully!');
    }

    // Final check
    const finalUser = await User.findOne({ email: 'albinjiji2026@mca.ajce.in' });
    console.log('\nFinal Super Admin user:');
    console.log({
      id: finalUser._id,
      name: finalUser.name,
      email: finalUser.email,
      role: finalUser.role,
      firebaseUid: finalUser.firebaseUid,
      provider: finalUser.provider,
      isActive: finalUser.isActive,
      hasPassword: !!finalUser.password,
      lastLogin: finalUser.lastLogin
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAndUpdateSuperAdmin();
