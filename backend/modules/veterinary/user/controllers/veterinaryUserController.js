const { validationResult } = require('express-validator');
const VeterinaryAppointment = require('../../models/VeterinaryAppointment');
const VeterinaryMedicalRecord = require('../../models/VeterinaryMedicalRecord');
const Pet = require('../../../../core/models/Pet');
const mongoose = require('mongoose');

// Use existing models from mongoose to avoid overwrite errors
const getVeterinaryModels = () => {
  return {
    Veterinary: mongoose.models.Veterinary || require('../../models/Veterinary'),
    VeterinaryService: mongoose.models.VeterinaryService || require('../../models/VeterinaryService')
  };
};

// Helper function to find pet across different models
const findPetById = async (petId) => {
  try {
    // Try core Pet model first
    let pet = await Pet.findById(petId);
    if (pet) {
      return { pet, modelUsed: 'Pet', ownerId: pet.owner || pet.currentOwnerId || pet.createdBy };
    }

    // Try AdoptionPet model
    const AdoptionPet = mongoose.models.AdoptionPet;
    if (AdoptionPet) {
      pet = await AdoptionPet.findById(petId);
      if (pet) {
        return { pet, modelUsed: 'AdoptionPet', ownerId: pet.adopterUserId || pet.owner || pet.createdBy };
      }
    }

    // Try PetNew model if it exists
    const PetNew = mongoose.models.PetNew;
    if (PetNew) {
      pet = await PetNew.findById(petId);
      if (pet) {
        return { pet, modelUsed: 'PetNew', ownerId: pet.ownerId || pet.owner || pet.createdBy };
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding pet:', error);
    return null;
  }
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
      petIds, // Array of pet IDs for multiple pets
      appointmentDate, 
      timeSlot, 
      reason, 
      bookingType, 
      visitType, 
      symptoms, 
      isExistingCondition, 
      existingConditionDetails,
      petsDetails // Array of { petId, reason, symptoms } for multiple pets
    } = req.body;
    
    // Determine if this is a multiple pets appointment
    const isMultiplePets = petIds && Array.isArray(petIds) && petIds.length > 1;
    const petsToBook = isMultiplePets ? petIds : [petId];
    
    console.log('Booking for pets:', petsToBook);
    console.log('Is multiple pets:', isMultiplePets);
    
    // Verify all pets exist and belong to user
    const verifiedPets = [];
    for (const pid of petsToBook) {
      const petResult = await findPetById(pid);
      
      if (!petResult) {
        return res.status(404).json({ 
          success: false, 
          message: `Pet with ID ${pid} not found` 
        });
      }

      const { pet, modelUsed, ownerId } = petResult;
      
      // Verify ownership
      if (ownerId) {
        const ownerIdStr = ownerId.toString();
        const userIdStr = req.user._id.toString();
        
        if (ownerIdStr !== userIdStr) {
          return res.status(403).json({ 
            success: false, 
            message: `Access denied - Pet ${pet.name || pid} does not belong to you` 
          });
        }
      }
      
      verifiedPets.push({ petId: pid, pet, modelUsed });
    }

    // Validate booking type
    if (!['routine', 'emergency', 'walkin'].includes(bookingType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid booking type. Must be routine, emergency, or walkin' 
      });
    }

    // For emergency bookings, require detailed reason
    if (bookingType === 'emergency') {
      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({ 
          success: false, 
          message: 'Emergency bookings require a detailed reason (minimum 10 characters)' 
        });
      }
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
        const diffTime = selectedDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 1 || diffDays > 30) {
          return res.status(400).json({ 
            success: false, 
            message: 'Routine appointments must be booked 1 to 30 days in advance' 
          });
        }
      } else if (bookingType === 'walkin') {
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
      status = 'pending_approval';
    }

    // Get veterinary models
    const { Veterinary, VeterinaryService } = getVeterinaryModels();
    
    // Get or create default store
    let defaultStore = await Veterinary.findOne({ isActive: true }).sort({ createdAt: 1 });
    if (!defaultStore) {
      console.log('Creating default veterinary store');
      defaultStore = new Veterinary({
        name: 'Default Veterinary Clinic',
        storeName: 'Default Veterinary Clinic',
        storeId: `VET-${Date.now()}`,
        address: {
          street: '123 Pet Street',
          city: 'Pet City',
          state: 'Pet State',
          zipCode: '12345',
          country: 'USA'
        },
        contact: {
          phone: '+1234567890',
          email: 'info@veterinaryclinic.com'
        },
        location: {
          type: 'Point',
          coordinates: [0, 0]
        },
        createdBy: req.user._id,
        isActive: true
      });
      await defaultStore.save();
    }
    
    // Get or create default service
    let defaultService = await VeterinaryService.findOne({ storeId: defaultStore.storeId, isActive: true });
    if (!defaultService) {
      console.log('Creating default veterinary service');
      defaultService = new VeterinaryService({
        name: 'General Checkup',
        description: 'Routine veterinary checkup',
        price: 50,
        duration: 30,
        category: 'examination',
        storeId: defaultStore.storeId,
        storeName: defaultStore.storeName || defaultStore.name,
        createdBy: req.user._id,
        status: 'active',
        isActive: true
      });
      await defaultService.save();
    }

    // Build pets array for multiple pets appointment
    const petsArray = verifiedPets.map((vp, index) => {
      const petDetail = petsDetails && petsDetails[index] ? petsDetails[index] : {};
      return {
        petId: vp.petId,
        reason: petDetail.reason || reason || 'Routine checkup',
        symptoms: petDetail.symptoms || symptoms || '',
        status: 'pending'
      };
    });

    // Create appointment
    const appointment = new VeterinaryAppointment({
      petId: verifiedPets[0].petId, // Primary pet (for backward compatibility)
      pets: isMultiplePets ? petsArray : [],
      isMultiplePets,
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
      amount: defaultService.price * verifiedPets.length, // Multiply by number of pets
      storeName: defaultStore.storeName || defaultStore.name,
      paymentStatus: 'pending'
    });

    await appointment.save();
    
    // Populate references
    await appointment.populate([
      { 
        path: 'petId', 
        select: 'name species breed imageIds',
        populate: { path: 'images', select: 'url caption isPrimary' }
      },
      { 
        path: 'pets.petId', 
        select: 'name species breed imageIds',
        populate: { path: 'images', select: 'url caption isPrimary' }
      },
      { path: 'serviceId', select: 'name price duration' },
      { path: 'storeId', select: 'name storeName' }
    ]);

    const message = isMultiplePets 
      ? `Appointment for ${verifiedPets.length} pets ${bookingType === 'emergency' ? 'submitted for review' : 'booked successfully'}`
      : bookingType === 'emergency' 
        ? 'Emergency appointment submitted for review. A manager will review your request.' 
        : 'Appointment booked successfully';

    res.status(201).json({
      success: true,
      message,
      data: { 
        appointment,
        petsCount: verifiedPets.length,
        isMultiplePets
      }
    });
  } catch (error) {
    console.error('Book appointment error:', error);
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
    
    const { status, bookingType, page = 1, limit = 20 } = req.query;
    const filter = { ownerId: req.user._id };
    
    console.log('Initial filter:', filter);

    if (status) {
      filter.status = status;
      console.log('Added status filter:', status);
    }

    if (bookingType) {
      filter.bookingType = bookingType;
      console.log('Added bookingType filter:', bookingType);
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
        { path: 'storeId', select: 'name storeName' }
      ])
      .sort({ bookingType: 1, appointmentDate: 1, timeSlot: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
      
    console.log('Found appointments:', appointments.length);

    const total = await VeterinaryAppointment.countDocuments(filter);

    res.json({
      success: true,
      data: { 
        appointments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching appointments', error: error.message });
  }
};

const getUserAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }

    const appointment = await VeterinaryAppointment.findById(id)
      .populate([
        { 
          path: 'petId', 
          select: 'name species breed imageIds',
          populate: { path: 'images', select: 'url caption isPrimary' }
        },
        { path: 'serviceId', select: 'name price duration' },
        { path: 'storeId', select: 'name storeName' }
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }

    const appointment = await VeterinaryAppointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if user owns this appointment
    if (appointment.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied - Appointment does not belong to user' });
    }

    // Check if appointment can be cancelled
    if (!['scheduled', 'pending_approval', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only scheduled, confirmed, or pending approval appointments can be cancelled' 
      });
    }

    // Cancel appointment
    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    appointment.updatedBy = req.user._id;
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