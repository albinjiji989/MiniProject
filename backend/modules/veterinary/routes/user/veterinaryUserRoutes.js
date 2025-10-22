const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../../../../core/middleware/auth');
const medicalController = require('../../user/controllers/medicalRecordsController');

const router = express.Router();

// User can view medical records for their pets; creation is manager-side
router.get('/pets/:petId/medical-records', auth, medicalController.listRecordsForPet);

module.exports = router;


