const express = require('express');
const router = express.Router();
const { auth } = require('../../../../core/middleware/auth');

// Import controllers when ready
// const temporaryCareController = require('../controllers/temporaryCareController');

// BROWSING FACILITIES (public - no auth)
// router.get('/facilities', temporaryCareController.listFacilities);
// router.get('/facilities/:id', temporaryCareController.getFacilityDetails);
// router.get('/caregivers', temporaryCareController.listCaregivers);
// router.get('/caregivers/:id', temporaryCareController.getCaregiverDetails);

// BOOKINGS (auth required)
// router.post('/bookings', auth, temporaryCareController.createBooking);
// router.get('/bookings', auth, temporaryCareController.getMyBookings);
// router.get('/bookings/:id', auth, temporaryCareController.getBookingDetails);
// router.put('/bookings/:id', auth, temporaryCareController.updateBooking);
// router.delete('/bookings/:id', auth, temporaryCareController.cancelBooking);

// REVIEWS
// router.post('/reviews', auth, temporaryCareController.addReview);
// router.get('/caregiver/:id/reviews', temporaryCareController.getCaregiver Reviews);

module.exports = router;
