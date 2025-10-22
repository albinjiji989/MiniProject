const express = require('express');
// Index router only mounts sub-routers for admin/manager/user
// No mixed controller endpoints here for better module separation

const router = express.Router();

// Mount manager routes similar to petshop/adoption modules
router.use('/manager', require('./manager/temporaryCareManagerRoutes'));
router.use('/admin', require('./admin/temporaryCareAdminRoutes'));
router.use('/user', require('./user/temporaryCareUserRoutes'));

module.exports = router;

