const { validationResult } = require('express-validator');
const VeterinaryAppointment = require('../../models/VeterinaryAppointment');
const VeterinaryMedicalRecord = require('../../models/VeterinaryMedicalRecord');
const Pet = require('../../../../core/models/Pet');
const AdoptionPet = require('../../../adoption/manager/models/AdoptionPet');

// Use existing models from mongoose to avoid overwrite errors
const getVeterinaryModels = () => {
  const mongoose = require('mongoose');
  return {
    Veterinary: mongoose.models.Veterinary || require('../../models/Veterinary'),
    VeterinaryService: mongoose.models.VeterinaryService || require('../../models/VeterinaryService')
  };
};

const bookAppointment = async (req, res) => {
  try {
    console.log('Veterinary booking endpoint hit with data:', req.body);
    console.log('User ID:', req.user._id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { 
      petId, 
      appointmentDate, 
      timeSlot, 
      reason, 
      bookingType, 
      visitType, 
      symptoms, 
      isExistingCondition, 
      existingConditionDetails 
    } = req.body;
    
    console.log('Looking for pet with ID:', petId);
    
    // Verify pet exists and belongs to user
    // Try to find the pet in all possible pet models
    let pet = null;
    let petModelUsed = null;
    
    // First try core Pet model
    pet = await Pet.findById(petId);
    if (pet) {
      petModelUsed = 'Pet';
      console.log('Pet found in core Pet model:', pet);
    }
    
    // If not found, try AdoptionPet model
    if (!pet) {
      pet = await AdoptionPet.findById(petId);
      if (pet) {
        petModelUsed = 'AdoptionPet';
        console.log('Pet found in AdoptionPet model:', pet);
      }
    }
    
    // If not found, try PetNew model
    if (!pet) {
      pet = await PetNew.findById(petId);
      if (pet) {
        petModelUsed = 'PetNew';
        console.log('Pet found in PetNew model:', pet);
      }
    }

    if (!pet) {
      console.log('Pet not found with ID:', petId);
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    console.log('Pet found:', petModelUsed, pet);

    // Check ownership based on the model used
    let ownerId = null;
    if (petModelUsed === 'Pet') {
      ownerId = pet.owner ? pet.owner.toString() : null;
    } else if (petModelUsed === 'AdoptionPet') {
      ownerId = pet.adopterUserId ? pet.adopterUserId.toString() : null;
    } else if (petModelUsed === 'PetNew') {
      ownerId = pet.ownerId ? pet.ownerId.toString() : null;
    } else {
      // For other models, check common owner fields
      ownerId = pet.owner ? pet.owner.toString() : 
                pet.adopterUserId ? pet.adopterUserId.toString() : 
                pet.ownerId ? pet.ownerId.toString() :
                pet.createdBy ? pet.createdBy.toString() : null;
    }

    console.log('Owner ID:', ownerId);
    console.log('Request user ID:', req.user._id.toString());

    // If we couldn't determine the owner, allow the booking (for backward compatibility)
    // But if we could determine the owner, verify it matches the requesting user
    if (ownerId && ownerId !== req.user._id.toString()) {
      console.log('Pet ownership mismatch:', ownerId, req.user._id.toString());
      return res.status(403).json({ success: false, message: 'Access denied - Pet does not belong to user' });
    }

    // For emergency bookings, require detailed reason
    if (bookingType === 'emergency' && (!reason || reason.trim().length < 10)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Emergency bookings require a detailed reason (minimum 10 characters)' 
      });
    }

    // Validate date constraints based on booking type
    if (bookingType === 'routine' || bookingType === 'walkin') {
      if (!appointmentDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Appointment date is required for routine and walk-in bookings' 
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(appointmentDate);
      selectedDate.setHours(0, 0, 0, 0);

      if (bookingType === 'routine') {
        // Routine bookings need to be 1 day to 1 week in advance
        const diffTime = selectedDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 1 || diffDays > 7) {
          return res.status(400).json({ 
            success: false, 
            message: 'Routine appointments must be booked 1 to 7 days in advance' 
          });
        }
      } else if (bookingType === 'walkin') {
        // Walk-in bookings should be for today or tomorrow (not yesterday)
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isToday = selectedDate.getTime() === today.getTime();
        const isTomorrow = selectedDate.getTime() === tomorrow.getTime();
        if (!isToday && !isTomorrow) {
          return res.status(400).json({ 
            success: false, 
            message: 'Walk-in appointments must be for today or tomorrow' 
          });
        }
      }
    }

    // Set default status based on booking type
    let status = 'scheduled';
    if (bookingType === 'emergency') {
      status = 'pending_approval'; // Emergency bookings need manager approval
    }

    // Get veterinary models
    const { Veterinary, VeterinaryService } = getVeterinaryModels();
    
    // Get or create default store
    let defaultStore = await Veterinary.findOne();
    if (!defaultStore) {
      console.log('Creating default veterinary store');
      defaultStore = new Veterinary({
        name: 'Default Veterinary Clinic',
        storeName: 'Default Veterinary Clinic',
        address: {
          street: '123 Pet Street',
          city: 'Pet City',
          state: 'Pet State',
          zipCode: '12345'
        },
        contact: {
          phone: '+1234567890',
          email: 'info@veterinaryclinic.com'
        },
        location: {
          type: 'Point',
          coordinates: [0, 0] // [longitude, latitude]
        },
        createdBy: req.user._id,
        storeId: 'default-veterinary-store'
      });
      await defaultStore.save();
    }
    
    // Make sure the store has a storeId
    if (!defaultStore.storeId) {
      defaultStore.storeId = defaultStore._id.toString();
      await defaultStore.save();
    }
    
    // Get or create default service
    let defaultService = await VeterinaryService.findOne();
    if (!defaultService) {
      console.log('Creating default veterinary service');
      defaultService = new VeterinaryService({
        name: 'General Checkup',
        description: 'Routine veterinary checkup',
        price: 50,
        duration: 30,
        storeId: defaultStore.storeId,
        createdBy: req.user._id
      });
      await defaultService.save();
    }

    // Create appointment
    const appointment = new VeterinaryAppointment({
      petId,
      ownerId: req.user._id,
      storeId: defaultStore._id,
      serviceId: defaultService._id,
      appointmentDate: appointmentDate || new Date(),
      timeSlot: timeSlot || '09:00',
      reason: reason || 'Routine checkup',
      bookingType: bookingType || 'routine',
      visitType: visitType || 'routine_checkup',
      symptoms: symptoms || '',
      isExistingCondition: isExistingCondition || false,
      existingConditionDetails: existingConditionDetails || '',
      status,
      amount: defaultService.price,
      storeName: defaultStore.storeName || defaultStore.name
    });

    await appointment.save();
    
    // Populate references
    await appointment.populate([
      { 
        path: 'petId', 
        select: 'name species breed imageIds',
        populate: { path: 'images', select: 'url caption isPrimary' }
      },
      { path: 'serviceId', select: 'name price duration' },
      { path: 'storeId', select: 'storeName' }
    ]);

    res.status(201).json({
      success: true,
      message: bookingType === 'emergency' 
        ? 'Emergency appointment submitted for review. A manager will review your request.' 
        : 'Appointment booked successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    // Send more detailed error information for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Server error while booking appointment', 
      error: error.message
    });
  }
};

const getUserAppointments = async (req, res) => {
  try {
    console.log('getUserAppointments called with query params:', req.query);
    console.log('User ID from request:', req.user._id);
    
    const { status } = req.query;
    const filter = { ownerId: req.user._id };
    
    console.log('Initial filter:', filter);

    if (status) {
      filter.status = status;
      console.log('Added status filter:', status);
    }
    
    console.log('Final filter being used:', filter);

    const appointments = await VeterinaryAppointment.find(filter)
      .populate([
        { 
          path: 'petId', 
          select: 'name species breed imageIds',
          populate: { path: 'images', select: 'url caption isPrimary' }
        },
        { path: 'serviceId', select: 'name price duration' },
        { path: 'storeId', select: 'storeName' }
      ])
      .sort({ bookingType: 1, appointmentDate: 1, timeSlot: 1 });
      
    console.log('Found appointments:', appointments.length);

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching appointments', error: error.message });
  }
};

const getUserAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await VeterinaryAppointment.findById(id)
      .populate([
        { 
          path: 'petId', 
          select: 'name species breed imageIds',
          populate: { path: 'images', select: 'url caption isPrimary' }
        },
        { path: 'serviceId', select: 'name price duration' },
        { path: 'storeId', select: 'storeName' }
      ]);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if user owns this appointment
    if (appointment.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied - Appointment does not belong to user' });
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    console.error('Get user appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching appointment', error: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await VeterinaryAppointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if user owns this appointment
    if (appointment.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied - Appointment does not belong to user' });
    }

    // Check if appointment can be cancelled
    if (!['scheduled', 'pending_approval'].includes(appointment.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only scheduled or pending approval appointments can be cancelled' 
      });
    }

    // Cancel appointment
    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error while cancelling appointment', error: error.message });
  }
};

module.exports = {
  bookAppointment,
  getUserAppointments,
  getUserAppointmentById,
  cancelAppointment
};