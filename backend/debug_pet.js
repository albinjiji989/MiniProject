console.log('Debug script started');

const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/petcare')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Load models
    const PetReservation = require('./modules/petshop/user/models/PetReservation');
    
    const reservationId = '68fa4e122809cf350fdb77ae';
    const petId = '68fa04bf03bc4d5120b2816b';
    
    console.log(`Checking reservation ID: ${reservationId}`);
    console.log(`Checking pet ID: ${petId}`);
    
    // Check reservation
    try {
      const reservation = await PetReservation.findById(reservationId);
      console.log('Reservation found:', !!reservation);
      if (reservation) {
        console.log('- Item ID:', reservation.itemId);
        console.log('- Status:', reservation.status);
      }
    } catch (err) {
      console.log('Error checking reservation:', err.message);
    }
    
    // Close connection
    mongoose.connection.close();
    console.log('Connection closed');
  })
  .catch(err => {
    console.error('Connection error:', err.message);
  });