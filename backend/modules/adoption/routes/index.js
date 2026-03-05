const express = require('express');
const router = express.Router();

// Mount admin, manager, and user routes
const adminRoutes = require('../admin/routes/adoptionAdminRoutes');
const managerRoutes = require('../manager/routes/adoptionManagerRoutes');
const userRoutes = require('../user/routes/adoptionUserRoutes');

router.use('/admin', adminRoutes);
router.use('/manager', managerRoutes);
router.use('/user', userRoutes);

// Internal ML seed data endpoint (no auth - called by Python service on localhost only)
router.get('/internal/ml-seed-data', require('../services/mlSeedDataController').getSeedData);

module.exports = router;