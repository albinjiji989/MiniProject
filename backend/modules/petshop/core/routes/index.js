// Register petshop blockchain routes for core module
const express = require('express');
const router = express.Router();

router.use('/', require('./petshopBlockchainRoutes'));

module.exports = router;
