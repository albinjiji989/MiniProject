const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../../../../core/middleware/auth');
const medicalController = require('../../user/controllers/medicalRecordsController');
const veterinaryUserController = require('../../user/controllers/veterinaryUserController');
const medicalHistoryUserController = require('../../user/controllers/medicalHistoryUserController');

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

// ============ COMPREHENSIVE MEDICAL HISTORY FOR USERS ============
// Get all user's pets with medical history summary
router.get('/medical-history/pets', auth, medicalHistoryUserController.getUserPetsMedicalHistory);

// Get comprehensive medical history for a specific pet (timeline, vaccinations, etc.)
router.get('/medical-history/pet/:petId', auth, medicalHistoryUserController.getUserPetMedicalHistory);

// Get detailed medical record
router.get('/medical-history/record/:recordId', auth, medicalHistoryUserController.getUserMedicalRecordDetail);

// Download/export medical record (for sharing with other vets)
router.get('/medical-history/record/:recordId/download', auth, medicalHistoryUserController.downloadMedicalRecord);

module.exports = router;