const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import shared models to ensure they're registered with Mongoose
require('./core/models/Image');
require('./core/models/Document');
require('./core/models/PetRegistry');

const app = express();

// Security middleware
// Allow cross-origin resource loading for images served from this API (used by frontend on different origin)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs (increased for development)
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure JWT secret exists in development to avoid 500 on auth
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not set. Using a temporary development secret. Set JWT_SECRET in .env for production.');
  process.env.JWT_SECRET = 'dev_jwt_secret_change_me';
}

// Database connection (via core)
const connectDB = require('./core/db');
connectDB();

// Static assets for module uploads (e.g., Petshop images) - MOVED BEFORE API ROUTES
// Ensure images can be embedded from other origins (frontend dev server)
app.use('/modules/petshop/uploads', (req, res, next) => {
  console.log('📸 Image request:', req.method, req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  // Set CORS headers for actual requests
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache images for 1 year
  
  next();
}, express.static(path.join(__dirname, 'modules', 'petshop', 'uploads')));

// Adoption module uploads (applicant documents: images/PDF)
app.use('/modules/adoption/uploads', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'modules', 'adoption', 'uploads')));

// Add this route to serve adoption manager contracts
app.use('/modules/adoption/manager/uploads', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'modules', 'adoption', 'manager', 'uploads')));

// Adoption manager uploads (pet images and documents)
app.use('/uploads/adoption', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'uploads', 'adoption')));

// User adoption documents
app.use('/uploads/adoption/user/document', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'uploads', 'adoption', 'user', 'document')));

// Update the static route to include subdirectories
app.use('/uploads/adoption/manager/image', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'uploads', 'adoption', 'manager', 'image')));

app.use('/uploads/adoption/manager/document', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'uploads', 'adoption', 'manager', 'document')));

// Adoption manager certificate uploads
app.use('/uploads/adoption/manager/certificate', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'uploads', 'adoption', 'manager', 'certificate')));

// Profile pictures uploads
app.use('/uploads/profile-pictures', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'uploads', 'profile-pictures')));

// User pet uploads
app.use('/uploads/pets', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'uploads', 'pets')));

// Otherpets uploads (user pets)
app.use('/uploads/otherpets', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'uploads', 'otherpets')));

// Debug endpoint for testing adoption pets
app.get('/api/debug/adoption-pets', async (req, res) => {
  try {
    const AdoptionPet = require('./modules/adoption/manager/models/AdoptionPet');
    const count = await AdoptionPet.countDocuments();
    const sample = await AdoptionPet.find().limit(10).lean();
    res.json({ 
      success: true, 
      data: { 
        count, 
        sample: sample.map(p => ({
          _id: p._id,
          name: p.name,
          breed: p.breed,
          species: p.species,
          status: p.status,
          isActive: p.isActive,
          createdAt: p.createdAt
        }))
      } 
    });
  } catch (error) {
    console.error('Debug adoption pets error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint for testing CORS
app.get('/test-cors', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ message: 'CORS test successful', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./modules/auth/routes/auth'));
app.use('/api/profile', require('./core/routes/user/profile'));
app.use('/api/admin', require('./modules/admin/routes/admin'));
app.use('/api/users', require('./core/routes/user/users'));
app.use('/api/pets', require('./core/routes/pet/petRoutes'));
app.use('/api/user-dashboard', require('./core/routes/user/userDashboard'));

// Pet System Routes
app.use('/api/admin/species', require('./core/routes/admin/species'));
app.use('/api/admin/breeds', require('./core/routes/admin/breeds'));
app.use('/api/admin/pet-categories', require('./core/routes/admin/pet-categories'));
app.use('/api/admin/pet-details', require('./core/routes/admin/pet-details'));
app.use('/api/admin/custom-breed-requests', require('./core/routes/admin/custom-breed-requests'));
app.use('/api/admin/pet-system-requests', require('./core/routes/admin/petSystemRequests'));
app.use('/api/admin/pets', require('./core/routes/admin/pets'));
app.use('/api/admin/medical-records', require('./core/routes/admin/medical-records'));
app.use('/api/admin/ownership-history', require('./core/routes/admin/ownership-history'));
app.use('/api/user/pets', require('./core/routes/user/user/pets'));
app.use('/api/user/ownership-history', require('./core/routes/user/user/ownership-history'));

// Management System Routes
app.use('/api/adoption', require('./modules/adoption/routes'));
app.use('/api/petshop', require('./modules/petshop/routes'));
app.use('/api/temporary-care', require('./modules/temporary-care/routes'));
app.use('/api/veterinary', require('./modules/veterinary/routes'));
app.use('/api/rbac', require('./core/routes/rbac/rbac/rbac'));
app.use('/api/roles', require('./core/routes/rbac/rbac/roles'));
app.use('/api/permissions', require('./core/routes/rbac/rbac/permissions'));
// Core routes are now part of the core directory
app.use('/api/core', require('./core/routes/pet/coreRoutes'));
app.use('/api/modules', require('./core/routes/pet/modulesRoutes'));


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Pet Welfare API is running' });
});
// nodemon ping

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

// Seed modules on startup
const seedModulesOnStartup = async () => {
  try {
    const Module = require('./core/models/Module');
    
    // Only actual service modules (not backend organizational folders)
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
  } catch (error) {
    console.error('Module seeding error:', error.message);
  }
};

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Seed modules after server starts and DB is connected
  setTimeout(() => {
    seedModulesOnStartup();
  }, 1000);
});