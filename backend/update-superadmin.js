const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define User schema inline
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return !this.firebaseUid; } },
  role: { 
    type: String, 
    enum: ['admin', 'module_manager', 'module_worker', 'public_user', 'volunteer', 'partner', 'temporary_care_manager', 'temporary_care_worker'],
    default: 'public_user'
  },
  phone: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  firebaseUid: { type: String, sparse: true },
  provider: { type: String, default: 'manual' },
  profileImage: { type: String },
  unitId: { type: String },
  unitName: { type: String },
  unitLocation: { type: String },
  assignedModule: { 
    type: String, 
    enum: ['adoption', 'shelter', 'rescue', 'ecommerce', 'pharmacy', 'boarding', 'temporary-care', 'veterinary', 'donation'],
    required: function() { return ['module_manager', 'module_worker', 'temporary_care_manager', 'temporary_care_worker'].includes(this.role); }
  },
  supervisor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: function() { return this.role === 'module_worker'; }
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function updateSuperAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/petwelfare');
    console.log('Connected to MongoDB');

    // Find or create Super Admin user
    let superAdmin = await User.findOne({ email: 'albinjiji2026@mca.ajce.in' });
    
    if (superAdmin) {
      console.log('Found existing Super Admin user, updating...');
      
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
      console.log('Super Admin user updated successfully!');
      
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
      console.log('Super Admin user created successfully!');
    }

    // Display final user info
    console.log('\nSuper Admin user details:');
    console.log({
      id: superAdmin._id,
      name: superAdmin.name,
      email: superAdmin.email,
      role: superAdmin.role,
      isActive: superAdmin.isActive,
      provider: superAdmin.provider,
      hasPassword: !!superAdmin.password
    });

    console.log('\nLogin credentials:');
    console.log('Email: albinjiji2026@mca.ajce.in');
    console.log('Password: Admin@123');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateSuperAdmin();
