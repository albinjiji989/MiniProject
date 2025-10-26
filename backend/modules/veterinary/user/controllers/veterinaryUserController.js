const { validationResult } = require('express-validator');
const VeterinaryAppointment = require('../../models/VeterinaryAppointment');
const VeterinaryMedicalRecord = require('../../models/VeterinaryMedicalRecord');
const Veterinary = require('../../models/Veterinary');
const Pet = require('../../../../core/models/Pet');

const bookAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
    
    // Debug: Log the petId being received
    console.log('DEBUG: Received petId:', petId);
    console.log('DEBUG: User ID:', req.user._id);
    console.log('DEBUG: PetId type:', typeof petId);
    console.log('DEBUG: Full request body:', JSON.stringify(req.body, null, 2));
    
    // Verify pet exists and belongs to user
    const pet = await Pet.findById(petId);
    console.log('DEBUG: Found pet:', pet);
    console.log('DEBUG: Pet search result type:', typeof pet);
    
    if (!pet) {
      // Additional debugging to understand why pet is not found
      console.log('DEBUG: Pet not found. Searching with petId:', petId);
      
      // Try alternative search methods
      const petByStringId = await Pet.findById(petId.toString());
      console.log('DEBUG: Pet search by string ID:', petByStringId);
      
      // Try to find all pets for this user to see what pets exist
      const userPets = await Pet.find({ owner: req.user._id });
      console.log('DEBUG: All pets for this user:', userPets.map(p => ({ id: p._id, name: p.name })));
      
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    if (pet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // For emergency bookings, require detailed reason
    if (bookingType === 'emergency' && (!reason || reason.trim().length < 10)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Emergency bookings require a detailed reason (minimum 10 characters)' 
      });
    }

    // Check if user already has an active appointment for this pet
    const activeAppointments = await VeterinaryAppointment.find({
      pet: petId,
      owner: req.user._id,
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
    });

    if (activeAppointments.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active appointment for this pet. Please cancel or complete the existing appointment before booking a new one.' 
      });
    }

    // For routine and walk-in bookings, check if there's already an appointment for the same date/time
    if (bookingType !== 'emergency') {
      const existingAppointment = await VeterinaryAppointment.findOne({
        pet: petId,
        owner: req.user._id,
        appointmentDate: appointmentDate,
        timeSlot: timeSlot,
        status: { $ne: 'cancelled' }
      });

      if (existingAppointment) {
        return res.status(400).json({ 
          success: false, 
          message: 'You already have an appointment for this pet at the selected date and time.' 
        });
      }
    }

    // Set default status based on booking type
    let status = 'scheduled';
    if (bookingType === 'emergency') {
      status = 'pending_approval'; // Emergency bookings need manager approval
    }

    // Create appointment
    const appointmentData = {
      pet: petId,
      owner: req.user._id,
      reason,
      bookingType,
      visitType,
      symptoms,
      isExistingCondition,
      existingConditionDetails,
      status,
      createdBy: req.user._id
    };
    
    // Only add appointmentDate and timeSlot if they have values (for routine and walk-in appointments)
    if (appointmentDate) {
      appointmentData.appointmentDate = appointmentDate;
    }
    if (timeSlot) {
      appointmentData.timeSlot = timeSlot;
    }
    
    const appointment = new VeterinaryAppointment(appointmentData);

    await appointment.save();
    
    // Populate references
    await appointment.populate([
      { path: 'pet', select: 'name species breed' }
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUserAppointments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { owner: req.user._id };

    if (status) {
      filter.status = status;
    }

    const appointments = await VeterinaryAppointment.find(filter)
      .populate([
        { path: 'pet', select: 'name species breed' }
      ])
      .sort({ bookingType: 1, appointmentDate: 1, timeSlot: 1 });

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUserAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await VeterinaryAppointment.findById(id)
      .populate([
        { path: 'pet', select: 'name species breed' },
        { path: 'service', select: 'name price duration' }
      ]);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if user owns this appointment
    if (appointment.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    console.error('Get user appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
    if (appointment.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if appointment can be cancelled
    if (!['scheduled', 'pending_approval'].includes(appointment.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only scheduled or pending approval appointments can be cancelled' 
      });
    }

    // Update status to cancelled
    appointment.status = 'cancelled';
    await appointment.save();

    // Populate references
    await appointment.populate([
      { path: 'pet', select: 'name species breed' }
    ]);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUserMedicalRecords = async (req, res) => {
  try {
    const { petId } = req.params;
    
    // Verify pet exists and belongs to user
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    if (pet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Fetch veterinary medical records for this pet
    const medicalRecords = await VeterinaryMedicalRecord.find({ 
      pet: petId,
      owner: req.user._id,
      isActive: true
    })
    .populate([
      { path: 'pet', select: 'name species breed' },
      { path: 'staff', select: 'name role' }
    ])
    .sort({ visitDate: -1 });

    res.json({
      success: true,
      data: { medicalRecords }
    });
  } catch (error) {
    console.error('Get user medical records error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  bookAppointment,
  getUserAppointments,
  getUserAppointmentById,
  cancelAppointment,
  getUserMedicalRecords
};