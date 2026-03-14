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
// Helper function to find pet across different models
const findPetById = async (petId) => {
  try {
    // Check if petId is a valid ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(petId) && /^[0-9a-fA-F]{24}$/.test(petId);
    
    console.log('🔍 Finding pet by ID:', petId, 'isValidObjectId:', isValidObjectId);
    
    // Declare PetRegistry once at the top to avoid duplicate declarations
    const PetRegistry = mongoose.models.PetRegistry;
    const PetReservation = mongoose.models.PetReservation;
    
    // PRIORITY 1: Use PetRegistry as single source of truth (same as dashboard)
    // This is the most reliable method since it's what the dashboard uses
    if (PetRegistry) {
      let registryEntry = null;
      
      // Try to find by petCode first (most common case)
      if (!isValidObjectId || petId.length < 24) {
        registryEntry = await PetRegistry.findOne({ petCode: petId });
        console.log('🔍 Registry search by petCode:', petId, 'found:', !!registryEntry);
      }
      
      // If not found by petCode and it's a valid ObjectId, try by _id
      if (!registryEntry && isValidObjectId) {
        registryEntry = await PetRegistry.findById(petId);
        console.log('🔍 Registry search by _id:', petId, 'found:', !!registryEntry);
      }
      
      if (registryEntry) {
        console.log('✅ Found pet in PetRegistry:', {
          petCode: registryEntry.petCode,
          name: registryEntry.name,
          currentOwnerId: registryEntry.currentOwnerId,
          source: registryEntry.source,
          currentLocation: registryEntry.currentLocation
        });
        
        // Return the registry entry as the pet with the currentOwnerId as the owner
        return { 
          pet: registryEntry, 
          modelUsed: 'PetRegistry', 
          ownerId: registryEntry.currentOwnerId 
        };
      }
    }
    
    // PRIORITY 2: Fallback to original model-based search for backward compatibility
    console.log('⚠️ Pet not found in PetRegistry, falling back to model search...');
    
    // If it's a valid ObjectId, try finding by _id first
    if (isValidObjectId) {
      let pet = await Pet.findById(petId);
      if (pet) {
        return { pet, modelUsed: 'Pet', ownerId: pet.owner || pet.currentOwnerId || pet.createdBy };
      }

      // Try AdoptionPet model by _id
      const AdoptionPet = mongoose.models.AdoptionPet;
      if (AdoptionPet) {
        pet = await AdoptionPet.findById(petId);
        if (pet) {
          return { pet, modelUsed: 'AdoptionPet', ownerId: pet.adopterUserId || pet.owner || pet.createdBy };
        }
      }

      // Try PetNew model by _id
      const PetNew = mongoose.models.PetNew;
      if (PetNew) {
        pet = await PetNew.findById(petId);
        if (pet) {
          return { pet, modelUsed: 'PetNew', ownerId: pet.ownerId || pet.owner || pet.createdBy };
        }
      }

      // Try PetInventoryItem model by _id
      const PetInventoryItem = mongoose.models.PetInventoryItem;
      if (PetInventoryItem) {
        pet = await PetInventoryItem.findById(petId);
        if (pet) {
          console.log('Found PetInventoryItem by _id:', {
            petId: pet._id,
            petCode: pet.petCode,
            name: pet.name,
            currentOwnerId: pet.currentOwnerId
          });
          
          // For PetInventoryItem, check if there's a completed reservation
          if (PetReservation) {
            // First, let's see all reservations for this item to debug
            const allReservations = await PetReservation.find({ itemId: pet._id });
            console.log('All reservations for pet:', {
              petId: pet._id,
              petCode: pet.petCode,
              totalReservations: allReservations.length,
              reservations: allReservations.map(r => ({
                _id: r._id,
                userId: r.userId,
                status: r.status,
                createdAt: r.createdAt
              }))
            });
            
            const reservation = await PetReservation.findOne({
              itemId: pet._id,
              status: { $in: ['completed', 'at_owner', 'paid', 'delivered'] }
            });
            
            console.log('Reservation search result:', {
              itemId: pet._id,
              reservationFound: !!reservation,
              reservationStatus: reservation?.status,
              reservationUserId: reservation?.userId
            });
            
            if (reservation) {
              return { pet, modelUsed: 'PetInventoryItem', ownerId: reservation.userId };
            }
          }
          // If no reservation found, check PetRegistry as fallback
          if (PetRegistry) {
            const registryEntry = await PetRegistry.findOne({
              petShopItemId: pet._id,
              source: 'petshop',
              currentLocation: 'at_owner'
            });
            
            console.log('PetRegistry fallback search:', {
              petId: pet._id,
              registryFound: !!registryEntry,
              registryOwnerId: registryEntry?.currentOwnerId
            });
            
            if (registryEntry && registryEntry.currentOwnerId) {
              console.log('Found ownership via PetRegistry:', registryEntry.currentOwnerId);
              return { pet, modelUsed: 'PetInventoryItem', ownerId: registryEntry.currentOwnerId };
            }
          }
          
          // If no reservation found, use default owner
          console.log('No reservation found, using default owner:', pet.currentOwnerId || pet.owner || pet.createdBy);
          return { pet, modelUsed: 'PetInventoryItem', ownerId: pet.currentOwnerId || pet.owner || pet.createdBy };
        }
      }
    }

    // If not a valid ObjectId or not found by _id, search by petCode
    console.log('Searching for pet by petCode:', petId);
    
    // Try Pet model by petCode
    let pet = await Pet.findOne({ petCode: petId });
    if (pet) {
      console.log('Found pet in Pet model by petCode');
      return { pet, modelUsed: 'Pet', ownerId: pet.owner || pet.currentOwnerId || pet.createdBy };
    }

    // Try AdoptionPet model by petCode
    const AdoptionPet = mongoose.models.AdoptionPet;
    if (AdoptionPet) {
      pet = await AdoptionPet.findOne({ petCode: petId });
      if (pet) {
        console.log('Found pet in AdoptionPet model by petCode');
        return { pet, modelUsed: 'AdoptionPet', ownerId: pet.adopterUserId || pet.owner || pet.createdBy };
      }
    }

    // Try PetNew model by petCode
    const PetNew = mongoose.models.PetNew;
    if (PetNew) {
      pet = await PetNew.findOne({ petCode: petId });
      if (pet) {
        console.log('Found pet in PetNew model by petCode');
        return { pet, modelUsed: 'PetNew', ownerId: pet.ownerId || pet.owner || pet.createdBy };
      }
    }

    // Try PetInventoryItem model by petCode
    const PetInventoryItem = mongoose.models.PetInventoryItem;
    if (PetInventoryItem) {
      pet = await PetInventoryItem.findOne({ petCode: petId });
      if (pet) {
        console.log('Found PetInventoryItem by petCode:', {
          petId: pet._id,
          petCode: pet.petCode,
          name: pet.name,
          currentOwnerId: pet.currentOwnerId
        });
        
        // For PetInventoryItem, check if there's a completed reservation
        if (PetReservation) {
          // First, let's see all reservations for this item to debug
          const allReservations = await PetReservation.find({ itemId: pet._id });
          console.log('All reservations for pet by petCode:', {
            petId: pet._id,
            petCode: pet.petCode,
            totalReservations: allReservations.length,
            reservations: allReservations.map(r => ({
              _id: r._id,
              userId: r.userId,
              status: r.status,
              createdAt: r.createdAt
            }))
          });
          
          const reservation = await PetReservation.findOne({
            itemId: pet._id,
            status: { $in: ['completed', 'at_owner', 'paid', 'delivered'] }
          });
          
          console.log('Reservation search result for petCode:', {
            itemId: pet._id,
            reservationFound: !!reservation,
            reservationStatus: reservation?.status,
            reservationUserId: reservation?.userId
          });
          
          if (reservation) {
            console.log('Found reservation for pet, owner is:', reservation.userId);
            return { pet, modelUsed: 'PetInventoryItem', ownerId: reservation.userId };
          }
        }
        // If no reservation found, check PetRegistry as fallback
        if (PetRegistry) {
          const registryEntry = await PetRegistry.findOne({
            petShopItemId: pet._id,
            source: 'petshop',
            currentLocation: 'at_owner'
          });
          
          console.log('PetRegistry fallback search for petCode:', {
            petId: pet._id,
            registryFound: !!registryEntry,
            registryOwnerId: registryEntry?.currentOwnerId
          });
          
          if (registryEntry && registryEntry.currentOwnerId) {
            console.log('Found ownership via PetRegistry for petCode:', registryEntry.currentOwnerId);
            return { pet, modelUsed: 'PetInventoryItem', ownerId: registryEntry.currentOwnerId };
          }
        }
        
        // If no reservation found, use default owner
        console.log('No reservation found for petCode, using default owner');
        return { pet, modelUsed: 'PetInventoryItem', ownerId: pet.currentOwnerId || pet.owner || pet.createdBy };
      }
    }

    // Try PetRegistry model by petCode as last resort
    if (PetRegistry) {
      const registryEntry = await PetRegistry.findOne({ petCode: petId });
      if (registryEntry && registryEntry.petId) {
        console.log('Found pet in PetRegistry, fetching actual pet from source model');
        // Try to get the actual pet from the source model
        const sourceModel = mongoose.models[registryEntry.sourceModel];
        if (sourceModel) {
          pet = await sourceModel.findById(registryEntry.petId);
          if (pet) {
            console.log('Found pet via PetRegistry from', registryEntry.sourceModel);
            // Check ownership based on source model
            let ownerId;
            if (registryEntry.sourceModel === 'PetInventoryItem') {
              // Check for reservation
              if (PetReservation) {
                const reservation = await PetReservation.findOne({
                  itemId: pet._id,
                  status: { $in: ['completed', 'at_owner', 'paid', 'delivered'] }
                });
                if (reservation) {
                  ownerId = reservation.userId;
                } else {
                  ownerId = pet.currentOwnerId || pet.owner || pet.createdBy;
                }
              } else {
                ownerId = pet.currentOwnerId || pet.owner || pet.createdBy;
              }
            } else {
              ownerId = pet.currentOwnerId || pet.owner || pet.ownerId || pet.adopterUserId || pet.createdBy;
            }
            return { pet, modelUsed: registryEntry.sourceModel, ownerId };
          }
        }
      }
    }

    console.log('Pet not found with ID or petCode:', petId);
    return null;
  } catch (error) {
    console.error('Error finding pet:', error.message);
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
      
      console.log('Pet found:', {
        petId: pid,
        petName: pet.name,
        modelUsed,
        ownerId: ownerId?.toString(),
        userId: req.user._id.toString(),
        petStatus: pet.status,
        petObject: {
          owner: pet.owner?.toString(),
          currentOwnerId: pet.currentOwnerId?.toString(),
          ownerId: pet.ownerId?.toString(),
          adopterUserId: pet.adopterUserId?.toString(),
          buyerId: pet.buyerId?.toString(),
          createdBy: pet.createdBy?.toString()
        }
      });
      
      // Verify ownership
      if (ownerId) {
        const ownerIdStr = ownerId.toString();
        const userIdStr = req.user._id.toString();
        
        console.log('Ownership verification:', {
          petId: pid,
          petName: pet.name,
          petCode: pet.petCode,
          modelUsed,
          ownerIdStr,
          userIdStr,
          ownershipMatch: ownerIdStr === userIdStr,
          petStatus: pet.status
        });
        
        if (ownerIdStr !== userIdStr) {
          console.log('Ownership mismatch:', { ownerIdStr, userIdStr, modelUsed, petStatus: pet.status });
          
          // Special handling for PetInventoryItem - check if this is a data inconsistency
          if (modelUsed === 'PetInventoryItem') {
            console.log('🔍 PetInventoryItem ownership issue detected. Checking for data inconsistency...');
            
            // Check if user has a registry entry for this petCode that might be legitimate
            if (PetRegistry) {
              const userRegistryEntry = await PetRegistry.findOne({
                petCode: pet.petCode,
                currentOwnerId: req.user._id,
                currentLocation: 'at_owner'
              });
              
              if (userRegistryEntry) {
                console.log('🔄 Found user registry entry for this petCode. This suggests a data inconsistency.');
                console.log('Registry entry:', {
                  petCode: userRegistryEntry.petCode,
                  name: userRegistryEntry.name,
                  source: userRegistryEntry.source,
                  currentOwnerId: userRegistryEntry.currentOwnerId,
                  currentLocation: userRegistryEntry.currentLocation
                });
                
                // This is a data inconsistency - same petCode used for different pets
                return res.status(409).json({ 
                  success: false, 
                  message: `Data inconsistency detected: Pet code ${pet.petCode} is associated with multiple pets. Please contact customer support to resolve this issue.`
                });
              }
            }
          }
          
          // Provide specific error message based on pet type
          let errorMessage = `Access denied - Pet ${pet.name || pet.petCode || pid} does not belong to you.`;
          if (modelUsed === 'PetInventoryItem' && pet.status !== 'sold') {
            errorMessage = `This pet is still in the petshop and hasn't been purchased yet. Please purchase the pet first before booking a veterinary appointment.`;
          } else if (modelUsed === 'AdoptionPet' && !pet.adopterUserId) {
            errorMessage = `This pet hasn't been adopted yet. Please complete the adoption process first before booking a veterinary appointment.`;
          }
          
          return res.status(403).json({ 
            success: false, 
            message: errorMessage
          });
        }
      } else {
        console.log('No ownerId found for pet:', {
          petId: pid,
          petName: pet.name,
          petCode: pet.petCode,
          modelUsed
        });
        
        return res.status(403).json({ 
          success: false, 
          message: `Unable to verify ownership for pet ${pet.name || pet.petCode || pid}. Please contact customer support.`
        });
      }
      
      verifiedPets.push({ petId: pet._id, pet, modelUsed }); // Use pet._id instead of pid
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
    // All appointments require manager approval - no automatic confirmation
    const status = 'pending_approval';

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
      petInfo: {
        name: verifiedPets[0].pet.name,
        species: verifiedPets[0].pet.species,
        breed: verifiedPets[0].pet.breed,
        petCode: verifiedPets[0].pet.petCode
      },
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
    
    // Populate references (petId won't populate but we have petInfo)
    await appointment.populate([
      { path: 'serviceId', select: 'name price duration' },
      { path: 'storeId', select: 'name storeName' },
      { path: 'ownerId', select: 'name email phone' }
    ]);

    const message = isMultiplePets 
      ? `Appointment for ${verifiedPets.length} pets submitted for manager approval. Please wait for confirmation.`
      : 'Appointment submitted for manager approval. You will receive a notification once it is reviewed and confirmed.';

    res.status(201).json({
      success: true,
      message,
      data: { 
        appointment,
        petsCount: verifiedPets.length,
        isMultiplePets,
        requiresApproval: true,
        status: 'pending_approval',
        note: 'All appointments require manager approval before confirmation.'
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
    if (!['confirmed', 'pending_approval'].includes(appointment.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only confirmed or pending approval appointments can be cancelled' 
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

// Get available time slots for a given date (for user booking)
const getAvailableTimeSlots = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    const { Veterinary } = getVeterinaryModels();
    
    // Get default veterinary store
    const defaultStore = await Veterinary.findOne({ isActive: true }).sort({ createdAt: 1 });
    
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Get all booked time slots for the selected date
    const bookedAppointments = await VeterinaryAppointment.find({
      appointmentDate: { $gte: selectedDate, $lt: nextDate },
      status: { $in: ['confirmed', 'pending_approval'] }
    }).select('timeSlot');

    const bookedSlots = bookedAppointments.map(app => app.timeSlot);

    // Generate all possible time slots (9 AM to 5 PM in 30-minute intervals)
    const allSlots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) continue; // Don't include 5:30 PM
        const h = hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const timeString = `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
        allSlots.push(timeString);
      }
    }

    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      success: true,
      data: { 
        availableSlots,
        totalSlots: allSlots.length,
        bookedCount: bookedSlots.length
      }
    });
  } catch (error) {
    console.error('Get available time slots error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching available time slots', error: error.message });
  }
};

// Get available services for booking
const getAvailableServices = async (req, res) => {
  try {
    const { Veterinary, VeterinaryService } = getVeterinaryModels();
    
    // Get active veterinary stores with their operating hours
    let stores = await Veterinary.find({ isActive: true })
      .select('name storeName storeId address contact operatingHours location');
    
    console.log('Found veterinary stores:', stores.length);
    
    // If no stores found, try to get all services anyway (for debugging)
    if (stores.length === 0) {
      console.log('No active veterinary clinics found, checking for services...');
      const allServices = await VeterinaryService.find({ isActive: true, status: 'active' });
      console.log('Found services without clinic:', allServices.length);
      
      if (allServices.length > 0) {
        // Get unique storeIds from services
        const uniqueStoreIds = [...new Set(allServices.map(s => s.storeId))];
        console.log('Unique storeIds from services:', uniqueStoreIds);
        
        // Try to find stores by storeId
        stores = await Veterinary.find({ storeId: { $in: uniqueStoreIds } });
        console.log('Found stores by storeId:', stores.length);
        
        // If still no stores, create a default one for each storeId
        if (stores.length === 0 && uniqueStoreIds.length > 0) {
          console.log('Creating default clinic for storeId:', uniqueStoreIds[0]);
          const defaultStore = new Veterinary({
            name: 'Veterinary Clinic',
            storeName: 'Veterinary Clinic',
            storeId: uniqueStoreIds[0],
            address: {
              street: 'Clinic Address',
              city: 'City',
              state: 'State',
              zipCode: '000000',
              country: 'India'
            },
            location: {
              type: 'Point',
              coordinates: [0, 0]
            },
            contact: {
              phone: '',
              email: ''
            },
            operatingHours: {
              monday: { open: '09:00', close: '18:00', closed: false },
              tuesday: { open: '09:00', close: '18:00', closed: false },
              wednesday: { open: '09:00', close: '18:00', closed: false },
              thursday: { open: '09:00', close: '18:00', closed: false },
              friday: { open: '09:00', close: '18:00', closed: false },
              saturday: { open: '09:00', close: '14:00', closed: false },
              sunday: { open: '09:00', close: '13:00', closed: true }
            },
            isActive: true,
            createdBy: allServices[0].createdBy
          });
          await defaultStore.save();
          stores = [defaultStore];
          console.log('Default clinic created');
        }
      }
    }
    
    if (stores.length === 0) {
      return res.json({
        success: true,
        data: { services: [], clinics: [] },
        message: 'No active veterinary clinics available'
      });
    }
    
    // Get all active services from all stores
    const storeIds = stores.map(store => store.storeId);
    console.log('Looking for services with storeIds:', storeIds);
    
    const services = await VeterinaryService.find({
      storeId: { $in: storeIds },
      isActive: true,
      status: 'active'
    }).select('name description price duration category storeId storeName')
      .sort({ category: 1, name: 1 });
    
    console.log('Found services:', services.length);
    
    // Format clinic data with working hours
    const clinics = stores.map(store => {
      // Convert operating hours to working days array (0=Sun, 1=Mon, etc.)
      const workingDays = [];
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      days.forEach((day, index) => {
        if (store.operatingHours[day] && !store.operatingHours[day].closed) {
          workingDays.push(index);
        }
      });
      
      // Get general working hours (use Monday as default)
      const workingHours = {
        start: store.operatingHours.monday?.open || '09:00',
        end: store.operatingHours.monday?.close || '18:00'
      };
      
      return {
        id: store._id,
        storeId: store.storeId,
        name: store.name || store.storeName,
        address: store.address,
        contact: store.contact,
        operatingHours: store.operatingHours,
        workingDays,
        workingHours,
        location: store.location
      };
    });
    
    res.json({
      success: true,
      data: { 
        services,
        clinics
      }
    });
  } catch (error) {
    console.error('Get available services error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching services', 
      error: error.message 
    });
  }
};

module.exports = {
  bookAppointment,
  getUserAppointments,
  getUserAppointmentById,
  cancelAppointment,
  getAvailableTimeSlots,
  getAvailableServices
};