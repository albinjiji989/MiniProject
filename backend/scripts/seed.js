require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../core/config/db');

const Species = require('../core/models/Species');
const Breed = require('../core/models/Breed');
const PetDetails = require('../core/models/PetDetails');
const Pet = require('../core/models/Pet');
const User = require('../core/models/User');

async function run() {
  try {
    await connectDB();

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    let admin = existingAdmin;
    if (!admin) {
      admin = await User.create({
        name: 'Seed Admin',
        email: adminEmail,
        role: 'admin',
        isActive: true,
      });
    }

    // Species
    const speciesDocs = await Species.insertMany([
      { name: 'dog', displayName: 'Dog', description: 'Canis lupus familiaris', createdBy: admin._id },
      { name: 'cat', displayName: 'Cat', description: 'Felis catus', createdBy: admin._id },
    ], { ordered: false }).catch(() => []);
    const dog = await Species.findOne({ name: 'dog' });
    const cat = await Species.findOne({ name: 'cat' });

    // Breeds
    await Breed.insertMany([
      { name: 'Labrador Retriever', speciesId: dog._id, description: 'Friendly and outgoing', createdBy: admin._id },
      { name: 'Persian', speciesId: cat._id, description: 'Long-haired, calm', createdBy: admin._id },
    ], { ordered: false }).catch(() => []);
    const labrador = await Breed.findOne({ name: 'Labrador Retriever' });
    const persian = await Breed.findOne({ name: 'Persian' });

    // PetDetails
    await PetDetails.insertMany([
      { name: 'Dog Standard', speciesId: dog._id, breedId: labrador._id },
      { name: 'Cat Standard', speciesId: cat._id, breedId: persian._id },
    ], { ordered: false }).catch(() => []);
    const dogStd = await PetDetails.findOne({ speciesId: dog._id, breedId: labrador._id });
    const catStd = await PetDetails.findOne({ speciesId: cat._id, breedId: persian._id });

    // Public user
    const publicEmail = process.env.SEED_PUBLIC_EMAIL || 'user@example.com';
    let publicUser = await User.findOne({ email: publicEmail });
    if (!publicUser) {
      publicUser = await User.create({
        name: 'Public User',
        email: publicEmail,
        role: 'public_user',
        isActive: true,
      });
    }

    // Pets
    await Pet.insertMany([
      {
        name: 'Buddy',
        species: dog._id,
        breed: labrador._id,
        petDetails: dogStd._id,
        owner: publicUser._id,
        gender: 'Male',
        age: 24,
        ageUnit: 'months',
        color: 'Yellow',
        weight: 25,
        size: 'large',
        currentStatus: 'Available',
        healthStatus: 'Good',
        createdBy: admin._id,
      },
      {
        name: 'Luna',
        species: cat._id,
        breed: persian._id,
        petDetails: catStd._id,
        owner: publicUser._id,
        gender: 'Female',
        age: 18,
        ageUnit: 'months',
        color: 'White',
        weight: 4,
        size: 'small',
        currentStatus: 'Available',
        healthStatus: 'Excellent',
        createdBy: admin._id,
      }
    ], { ordered: false }).catch(() => []);

    console.log('Seed completed.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

run();


