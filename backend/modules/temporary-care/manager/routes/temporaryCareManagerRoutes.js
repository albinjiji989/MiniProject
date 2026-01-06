const express = require('express');
const router = express.Router();
const { auth, authorizeModule } = require('../../../../core/middleware/auth');

// Import controllers when ready
// const temporaryCareManagerController = require('../controllers/temporaryCareManagerController');

// All routes require auth and temporary-care module authorization
router.use(auth);
router.use(authorizeModule('temporary-care'));

// CAREGIVERS MANAGEMENT
// router.get('/caregivers', temporaryCareManagerController.listCaregivers);
// router.post('/caregivers', temporaryCareManagerController.createCaregiver);
// router.get('/caregivers/:id', temporaryCareManagerController.getCaregiver);
// router.put('/caregivers/:id', temporaryCareManagerController.updateCaregiver);
// router.delete('/caregivers/:id', temporaryCareManagerController.deleteCaregiver);

// FACILITIES MANAGEMENT
// router.get('/facilities', temporaryCareManagerController.listFacilities);
// router.post('/facilities', temporaryCareManagerController.createFacility);
// router.get('/facilities/:id', temporaryCareManagerController.getFacility);
// router.put('/facilities/:id', temporaryCareManagerController.updateFacility);
// router.delete('/facilities/:id', temporaryCareManagerController.deleteFacility);

// BOOKINGS MANAGEMENT
// router.get('/bookings', temporaryCareManagerController.listBookings);
// router.get('/bookings/:id', temporaryCareManagerController.getBooking);
// router.put('/bookings/:id/status', temporaryCareManagerController.updateBookingStatus);
// router.post('/bookings/:id/approve', temporaryCareManagerController.approveBooking);
// router.post('/bookings/:id/reject', temporaryCareManagerController.rejectBooking);

module.exports = router;
