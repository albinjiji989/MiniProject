const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/petcare');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  // Load models
  const PetReservation = require('./modules/petshop/user/models/PetReservation');
  
  const reservationId = '68fa4e122809cf350fdb77ae';
  
  console.log(`Checking for reservation with ID: ${reservationId}`);
  
  // Check reservation
  try {
    const reservation = await PetReservation.findById(reservationId)
      .populate('itemId')
      .populate('userId');
      
    console.log('Reservation:', reservation);
    
    if (reservation) {
      console.log('Reservation details:');
      console.log('- Item ID:', reservation.itemId?._id);
      console.log('- Item Name:', reservation.itemId?.name);
      console.log('- Item PetCode:', reservation.itemId?.petCode);
      console.log('- User ID:', reservation.userId?._id);
      console.log('- User Name:', reservation.userId?.name);
      console.log('- Status:', reservation.status);
      
      // Check if this reservation has been completed
      if (reservation.status === 'at_owner') {
        console.log('Reservation is completed. Checking registry...');
        
        // Check if the pet is in the registry
        const PetRegistry = require('./core/models/PetRegistry');
        const registryEntry = await PetRegistry.findOne({ petCode: reservation.itemId?.petCode });
        console.log('Registry entry:', registryEntry);
        
        if (registryEntry) {
          console.log('Registry details:');
          console.log('- Registry ID:', registryEntry._id);
          console.log('- Current Owner ID:', registryEntry.currentOwnerId);
          console.log('- Current Status:', registryEntry.currentStatus);
        }
      } else {
        console.log('Reservation is not completed yet. Status:', reservation.status);
      }
    } else {
      console.log('Reservation not found');
    }
  } catch (err) {
    console.log('Error checking reservation:', err.message);
  }
  
  // Close connection
  mongoose.connection.close();
});