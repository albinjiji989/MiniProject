const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../../../../core/middleware/auth');
const medicalController = require('../../user/controllers/medicalRecordsController');
const veterinaryUserController = require('../../user/controllers/veterinaryUserController');

const router = express.Router();

// User appointments
router.get('/appointments', auth, veterinaryUserController.getUserAppointments);
router.get('/appointments/:id', auth, veterinaryUserController.getUserAppointmentById);
router.post('/appointments/book', auth, [
  body('petId').notEmpty().withMessage('Pet ID is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('bookingType').isIn(['routine', 'emergency', 'walkin']).withMessage('Invalid booking type'),
  body('visitType').optional().isIn(['routine_checkup', 'vaccination', 'follow_up', 'consultation', 'other']).withMessage('Invalid visit type')
], veterinaryUserController.bookAppointment); // Removed duplicate auth middleware
router.post('/appointments/:id/cancel', auth, veterinaryUserController.cancelAppointment);

// User can view medical records for their pets; creation is manager-side
router.get('/pets/:petId/medical-records', auth, medicalController.listRecordsForPet);

module.exports = router;