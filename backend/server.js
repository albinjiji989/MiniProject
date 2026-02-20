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

// Body parser middleware - increase limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable CORS - MUST be before helmet
// Support both web and mobile (Flutter) apps
const allowedOrigins = [
  'http://localhost:5173',           // Web dev
  'http://localhost:3000',           // Alternative web dev
  'https://mini-project-ebon-omega.vercel.app', // Web production
  process.env.CLIENT_URL,            // Custom client URL
  process.env.FRONTEND_URL           // Alternative frontend URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow whitelisted origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For development, allow all origins
      // For production, you can uncomment the line below to block unknown origins
      callback(null, true);
      // callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Cookie parser
app.use(require('cookie-parser')());

// Sanitize data
app.use(require('express-mongo-sanitize')());

// Set security headers (configured to allow CORS)
app.use(require('helmet')({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

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

// AI/ML Routes (Python Railway Service)
app.use('/api/ai', require('./core/routes/aiRoutes'));

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
app.use('/api/user/unified', require('./core/routes/user/userPets')); // Unified user pets endpoint

// Removed unused routes
// app.use('/api/admin/medical-records', require('./core/routes/admin/medical-records'));
// app.use('/api/admin/ownership-history', require('./core/routes/admin/ownership-history'));

app.use('/api/user-dashboard', require('./core/routes/user/userDashboard'));
app.use('/api/user/ownership-history', require('./core/routes/user/user/ownership-history'));
app.use('/api/pets', require('./core/routes/pet'));  // Use index.js to include centralized routes
app.use('/api/pet-age', require('./core/routes/petAgeRoutes'));

// Blockchain routes
app.use('/api/blockchain', require('./core/routes/blockchainRoutes'));
app.use('/api/pet-audit', require('./core/routes/petAuditRoutes'));

// Management System Routes
app.use('/api/adoption', require('./modules/adoption/routes'));
app.use('/api/petshop/manager', require('./modules/petshop/manager/routes/petshopManagerRoutes'));
app.use('/api/petshop/user', require('./modules/petshop/user/routes/petshopUserRoutes'));
// PetShop Blockchain Routes (NEW - Safe Addition with SHA-256)
app.use('/api/petshop/blockchain', require('./modules/petshop/core/routes/petshopBlockchainRoutes'));
app.use('/api/temporary-care', require('./modules/temporary-care/routes'));
app.use('/api/veterinary', require('./modules/veterinary/routes'));
app.use('/api/pharmacy', require('./modules/pharmacy/routes'));

// Admin Module Management Routes
app.use('/api/admin', require('./modules/admin/routes'));

// Manager Profile Routes
app.use('/api/manager', require('./modules/manager/routes'));

// E-Commerce Routes
app.use('/api/ecommerce/admin', require('./modules/ecommerce/admin/routes'));
app.use('/api/ecommerce/manager', require('./modules/ecommerce/manager/routes'));
app.use('/api/ecommerce', require('./modules/ecommerce/user/routes'));
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