const express = require('express');

const router = express.Router();

router.use('/admin', require('./admin/veterinaryAdminRoutes'));
router.use('/manager', require('./manager/veterinaryManagerRoutes'));
router.use('/user', require('./user/veterinaryUserRoutes'));

module.exports = router;