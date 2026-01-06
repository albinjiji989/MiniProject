const express = require('express');
const router = express.Router();

// Import all route modules
const petRoutes = require('./petRoutes');
const centralizedPetsRouter = require('./centralizedPetRoutes');
const modulesRouter = require('./modulesRoutes');

// Mount all routes
router.use('/', petRoutes);
router.use('/centralized', centralizedPetsRouter);
router.use('/modules', modulesRouter);

module.exports = router;