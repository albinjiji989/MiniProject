const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

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
const connectDB = require('./core/config/db');
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/user-dashboard', require('./routes/userDashboard'));

// Pet System Routes
app.use('/api/admin/species', require('./routes/admin/species'));
app.use('/api/admin/breeds', require('./routes/admin/breeds'));
app.use('/api/admin/pet-categories', require('./routes/admin/pet-categories'));
app.use('/api/admin/pet-details', require('./routes/admin/pet-details'));
app.use('/api/admin/custom-breed-requests', require('./routes/admin/custom-breed-requests'));
app.use('/api/admin/pets', require('./routes/admin/pets'));
app.use('/api/admin/medical-records', require('./routes/admin/medical-records'));
app.use('/api/admin/ownership-history', require('./routes/admin/ownership-history'));
app.use('/api/user/pets', require('./routes/user/pets'));

// Management System Routes
app.use('/api/adoption', require('./modules/adoption/routes'));
app.use('/api/petshop', require('./modules/petshop/routes'));
app.use('/api/rescue', require('./modules/rescue/routes'));
app.use('/api/ecommerce', require('./modules/ecommerce/routes'));
app.use('/api/pharmacy', require('./modules/pharmacy/routes'));
app.use('/api/temporary-care', require('./modules/temporary-care/routes'));
app.use('/api/veterinary', require('./modules/veterinary/routes'));
app.use('/api/rbac', require('./routes/rbac/rbac'));
app.use('/api/roles', require('./routes/rbac/roles'));
app.use('/api/permissions', require('./routes/rbac/permissions'));
app.use('/api/core', require('./routes/core/core'));
app.use('/api/modules', require('./routes/modules'));

// Static assets for module uploads (e.g., Petshop images)
app.use('/modules/petshop/uploads', express.static(path.join(__dirname, 'modules', 'petshop', 'uploads')));

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
