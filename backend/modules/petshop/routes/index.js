const express = require('express');
const router = express.Router();

// Mount admin, manager, and user routes
const adminRoutes = require('../admin/routes/petshopAdminRoutes');
const managerRoutes = require('../manager/routes/petshopManagerRoutes');
const userRoutes = require('../user/routes/petshopUserRoutes');

router.use('/admin', adminRoutes);
router.use('/manager', managerRoutes);
router.use('/user', userRoutes);

module.exports = router;
