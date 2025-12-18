const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./core/db');
const path = require('path');
const fs = require('fs');

// Load env vars
dotenv.config({ path: './.env' });

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Cookie parser
app.use(require('cookie-parser')());

// Sanitize data
app.use(require('express-mongo-sanitize')());

// Set security headers
app.use(require('helmet')());

// Prevent XSS attacks
app.use(require('xss-clean')());

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 1000
});
app.use(limiter);

// Prevent http param pollution
app.use(require('hpp')());

// Compression
app.use(require('compression')());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./modules/auth/routes/auth'));
app.use('/api/users', require('./core/routes/user/users'));
app.use('/api/profile', require('./core/routes/user/profile'));
app.use('/api/modules', require('./core/routes/pet/modulesRoutes'));

// Admin Routes
app.use('/api/admin/species', require('./core/routes/admin/species'));
app.use('/api/admin/breeds', require('./core/routes/admin/breeds'));
app.use('/api/admin/pet-categories', require('./core/routes/admin/pet-categories'));
app.use('/api/admin/pet-details', require('./core/routes/admin/pet-details'));
app.use('/api/admin/custom-breed-requests', require('./core/routes/admin/custom-breed-requests'));
app.use('/api/admin/pet-system-requests', require('./core/routes/admin/petSystemRequests'));
app.use('/api/admin/pets', require('./core/routes/admin/pets'));
app.use('/api/admin/pet-registry', require('./core/routes/admin/pet-registry'));
app.use('/api/admin', require('./modules/admin/routes/admin'));
app.use('/api/user/pets', require('./core/routes/user/user/pets'));

// Removed unused routes
// app.use('/api/admin/medical-records', require('./core/routes/admin/medical-records'));
// app.use('/api/admin/ownership-history', require('./core/routes/admin/ownership-history'));

app.use('/api/user-dashboard', require('./core/routes/user/userDashboard'));
app.use('/api/user/ownership-history', require('./core/routes/user/user/ownership-history'));
app.use('/api/pets', require('./core/routes/pet/petRoutes'));

// Management System Routes
app.use('/api/adoption', require('./modules/adoption/routes'));
app.use('/api/petshop/manager', require('./modules/petshop/manager/routes/petshopManagerRoutes'));
app.use('/api/petshop/user', require('./modules/petshop/user/routes/petshopUserRoutes'));
app.use('/api/temporary-care', require('./modules/temporary-care/routes'));
app.use('/api/veterinary', require('./modules/veterinary/routes'));
app.use('/api/rbac', require('./core/routes/rbac/rbac/rbac'));
app.use('/api/roles', require('./core/routes/rbac/rbac/roles'));
app.use('/api/permissions', require('./core/routes/rbac/rbac/permissions'));

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : { message: err.message, stack: err.stack }
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});