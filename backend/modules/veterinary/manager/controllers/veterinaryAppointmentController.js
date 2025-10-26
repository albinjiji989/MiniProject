const { validationResult } = require('express-validator');
const VeterinaryAppointment = require('../../models/VeterinaryAppointment');
const Pet = require('../../../../core/models/Pet');
const User = require('../../../../core/models/User');
const Veterinary = require('../../models/Veterinary');

const createAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { petId, ownerId, ...appointmentData } = req.body;
    
    // Verify pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Verify owner exists
    const owner = await User.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ success: false, message: 'Owner not found' });
    }

    // Check if owner already has an active appointment for this pet
    const activeAppointments = await VeterinaryAppointment.find({
      pet: petId,
      owner: ownerId,
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
    });

    if (activeAppointments.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'This owner already has an active appointment for this pet.' 
      });
    }

    // For routine and walk-in bookings, check if there's already an appointment for the same date/time
    if (appointmentData.bookingType !== 'emergency') {
      const existingAppointment = await VeterinaryAppointment.findOne({
        pet: petId,
        owner: ownerId,
        appointmentDate: appointmentData.appointmentDate,
        timeSlot: appointmentData.timeSlot,
        status: { $ne: 'cancelled' }
      });

      if (existingAppointment) {
        return res.status(400).json({ 
          success: false, 
          message: 'This owner already has an appointment for this pet at the selected date and time.' 
        });
      }
    }

    // Check if appointment slot is available (only for scheduled appointments)
    if (appointmentData.bookingType !== 'emergency') {
      const existingAppointment = await VeterinaryAppointment.findOne({
        veterinary: req.user.storeId,
        appointmentDate: appointmentData.appointmentDate,
        timeSlot: appointmentData.timeSlot,
        status: { $in: ['scheduled', 'confirmed'] }
      });

      if (existingAppointment) {
        return res.status(400).json({ 
          success: false, 
          message: 'This time slot is already booked' 
        });
      }
    }

    // Create appointment
    const appointmentFields = {
      ...appointmentData,
      pet: petId,
      owner: ownerId,
      veterinary: req.user.storeId,
      storeId: req.user.storeId,
      storeName: req.user.storeName,
      createdBy: req.user._id
    };
    
    // Only add appointmentDate and timeSlot if they have values
    if (appointmentData.appointmentDate) {
      appointmentFields.appointmentDate = appointmentData.appointmentDate;
    }
    if (appointmentData.timeSlot) {
      appointmentFields.timeSlot = appointmentData.timeSlot;
    }
    
    const appointment = new VeterinaryAppointment(appointmentFields);

    await appointment.save();
    
    // Populate references
    await appointment.populate([
      { path: 'pet', select: 'name species breed' },
      { path: 'owner', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAppointments = async (req, res) => {
  try {
    const { date, status, petId, bookingType } = req.query;
    const filter = { veterinary: req.user.storeId };

    // Apply filters
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (status) {
      filter.status = status;
    }

    if (petId) {
      filter.pet = petId;
    }

    if (bookingType) {
      filter.bookingType = bookingType;
    }

    const appointments = await VeterinaryAppointment.find(filter)
      .populate([
        { path: 'pet', select: 'name species breed' },
        { path: 'owner', select: 'name email phone' },
        { path: 'staff', select: 'name role' }
      ])
      .sort({ bookingType: 1, appointmentDate: 1, timeSlot: 1 });

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await VeterinaryAppointment.findById(id)
      .populate([
        { path: 'pet', select: 'name species breed' },
        { path: 'owner', select: 'name email phone' },
        { path: 'staff', select: 'name role' },
        { path: 'service', select: 'name price duration' }
      ]);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if user has access to this appointment
    if (appointment.veterinary.toString() !== req.user.storeId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    const appointment = await VeterinaryAppointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if user has access to this appointment
    if (appointment.veterinary.toString() !== req.user.storeId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Handle emergency booking approval/decline
    if (appointment.bookingType === 'emergency' && appointment.status === 'pending_approval') {
      if (updateData.emergencyApproved === true) {
        updateData.status = 'scheduled';
        updateData.emergencyApproved = true;
      } else if (updateData.emergencyDeclined === true) {
        updateData.status = 'declined';
        updateData.emergencyDeclined = true;
      }
    }

    // If status is being updated to completed, ensure required fields are provided
    if (updateData.status === 'completed' && appointment.status !== 'completed') {
      if (!updateData.diagnosis || !updateData.treatment) {
        return res.status(400).json({ 
          success: false, 
          message: 'Diagnosis and treatment are required when completing an appointment' 
        });
      }
    }

    // Update appointment
    Object.assign(appointment, updateData, {
      lastUpdatedBy: req.user._id
    });

    await appointment.save();

    // Populate references
    await appointment.populate([
      { path: 'pet', select: 'name species breed' },
      { path: 'owner', select: 'name email phone' },
      { path: 'staff', select: 'name role' }
    ]);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await VeterinaryAppointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if user has access to this appointment
    if (appointment.veterinary.toString() !== req.user.storeId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Only allow deletion of scheduled or pending approval appointments
    if (!['scheduled', 'pending_approval'].includes(appointment.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only scheduled or pending approval appointments can be deleted' 
      });
    }

    await appointment.remove();

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAvailableTimeSlots = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date is required' 
      });
    }

    const appointmentDate = new Date(date);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all booked time slots for the date (excluding emergency bookings)
    const bookedAppointments = await VeterinaryAppointment.find({
      veterinary: req.user.storeId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['scheduled', 'confirmed'] },
      bookingType: { $ne: 'emergency' } // Emergency bookings don't block time slots
    }, 'timeSlot');

    const bookedSlots = bookedAppointments.map(appt => appt.timeSlot);

    // Generate available time slots (9:00 AM to 5:00 PM in 30-minute intervals)
    const availableSlots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}-${(minute === 30 ? hour : hour + 1).toString().padStart(2, '0')}:${(minute === 30 ? '00' : '30')}`;
        if (!bookedSlots.includes(timeSlot)) {
          availableSlots.push(timeSlot);
        }
      }
    }

    res.json({
      success: true,
      data: { availableSlots }
    });
  } catch (error) {
    console.error('Get available time slots error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getAvailableTimeSlots
};