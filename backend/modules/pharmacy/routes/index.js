const express = require('express');
const router = express.Router();
const userRoutes = require('../user/routes/pharmacyRoutes');
const managerRoutes = require('../manager/routes/pharmacyManagerRoutes');

// User routes (public and authenticated)
router.use('/user', userRoutes);

// Manager routes (authenticated as pharmacy_manager)
router.use('/manager', managerRoutes);

module.exports = router;
