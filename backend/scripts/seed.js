require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../core/db');

const Species = require('../core/models/Species');
const Breed = require('../core/models/Breed');
const PetDetails = require('../core/models/PetDetails');
const Pet = require('../core/models/Pet');
const User = require('../core/models/User');
const Module = require('../core/models/Module');

async function seedModules() {
  // All modules start as 'coming_soon' - admin activates them later
  const modules = [
    {
      key: 'adoption',
      name: 'Adoption',
      description: 'Pet adoption services and management',
      icon: 'Pets',
      color: '#10b981',
      status: 'coming_soon',
      hasManagerDashboard: true,
      isCoreModule: true,
      displayOrder: 0
    },
    {
      key: 'petshop',
      name: 'Pet Shop',
      description: 'Pet products and accessories marketplace',
      icon: 'ShoppingCart',
      color: '#3b82f6',
      status: 'coming_soon',
      hasManagerDashboard: true,
      isCoreModule: true,
      displayOrder: 1
    },
    {
      key: 'veterinary',
      name: 'Veterinary',
      description: 'Veterinary services and appointments',
      icon: 'LocalHospital',
      color: '#64748b',
      status: 'coming_soon',
      hasManagerDashboard: true,
      isCoreModule: true,
      displayOrder: 2
    },
    {
      key: 'temporary-care',
      name: 'Temporary Care',
      description: 'Short-term pet boarding and care',
      icon: 'Home',
      color: '#06b6d4',
      status: 'coming_soon',
      hasManagerDashboard: true,
      isCoreModule: true,
      displayOrder: 3
    }
  ];

  // Delete non-module entries (admin, auth, pet, rbac, user, etc.)
  const validModuleKeys = modules.map(m => m.key);
  await Module.deleteMany({ key: { $nin: validModuleKeys } });

  for (const module of modules) {
    // Only create if doesn't exist - preserve admin's changes
    await Module.findOneAndUpdate(
      { key: module.key },
      { $setOnInsert: module },
      { upsert: true, new: true }
    );
  }
  console.log('✅ Modules seeded successfully');
}

async function run() {
  try {
    await connectDB();

    // Seed modules first
    await seedModules();

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        role: 'admin',
        isActive: true,
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin already exists');
    }

    console.log('✅ Seed completed - NO dummy data created');
    console.log('ℹ️  Admin must manually add all species, breeds, and pets');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

run();


