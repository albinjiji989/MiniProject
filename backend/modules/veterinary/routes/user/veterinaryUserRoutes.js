const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../../../../core/middleware/auth');
const medicalController = require('../../user/controllers/medicalRecordsController');
const appointmentController = require('../../user/controllers/appointmentController');
const veterinaryUserController = require('../../user/controllers/veterinaryUserController');

const router = express.Router();

// User appointments
router.get('/appointments', auth, veterinaryUserController.getUserAppointments);
router.get('/appointments/:id', auth, veterinaryUserController.getUserAppointmentById);
router.post('/appointments/book', auth, [
  body('petId').notEmpty(),
  body('reason').notEmpty(),
  body('bookingType').isIn(['routine', 'emergency', 'walkin']),
  body('visitType').isIn(['routine_checkup', 'vaccination', 'follow_up', 'consultation', 'other'])
], auth, veterinaryUserController.bookAppointment);
router.post('/appointments/:id/cancel', auth, veterinaryUserController.cancelAppointment);

// User can view medical records for their pets; creation is manager-side
router.get('/pets/:petId/medical-records', auth, medicalController.listRecordsForPet);

module.exports = router;