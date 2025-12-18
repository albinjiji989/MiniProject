const { validationResult } = require('express-validator');
const ManagerVeterinaryAppointment = require('../models/VeterinaryAppointment');
const VeterinaryAppointment = require('../../models/VeterinaryAppointment');
const Pet = require('../../../../core/models/Pet');
const User = require('../../../../core/models/User');
const Veterinary = require('../../models/Veterinary');
const mongoose = require('mongoose');

const createAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { petId, ownerId, ...appointmentData } = req.body;
    
    // Find the veterinary store for this manager
    const veterinaryStore = await Veterinary.findOne({ storeId: req.user.storeId });
    if (!veterinaryStore) {
      return res.status(404).json({ success: false, message: 'Veterinary store not found' });
    }
    
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
    const activeAppointments = await ManagerVeterinaryAppointment.find({
      petId,
      ownerId,
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
    });

    if (activeAppointments.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'This owner already has an active appointment for this pet.' 
      });
    }

    // For routine and walk-in bookings, check if there's already an appointment for the same date/time
    if (appointmentData.bookingType !== 'emergency' && appointmentData.appointmentDate && appointmentData.timeSlot) {
      const existingAppointment = await ManagerVeterinaryAppointment.findOne({
        petId,
        ownerId,
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
    if (appointmentData.bookingType !== 'emergency' && appointmentData.appointmentDate && appointmentData.timeSlot) {
      const existingAppointment = await ManagerVeterinaryAppointment.findOne({
        storeId: veterinaryStore._id,
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
      petId,
      ownerId,
      storeId: veterinaryStore._id,
      storeName: veterinaryStore.storeName || veterinaryStore.name,
      createdBy: req.user._id
    };
    
    // Only add appointmentDate and timeSlot if they have values
    if (appointmentData.appointmentDate) {
      appointmentFields.appointmentDate = appointmentData.appointmentDate;
    }
    if (appointmentData.timeSlot) {
      appointmentFields.timeSlot = appointmentData.timeSlot;
    }
    
    const appointment = new ManagerVeterinaryAppointment(appointmentFields);

    await appointment.save();
    
    // Populate references
    await appointment.populate([
      { path: 'petId', select: 'name species breed' },
      { path: 'ownerId', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating appointment', error: error.message });
  }
};

const getAppointments = async (req, res) => {
  try {
    console.log('=== Veterinary Manager Appointments Endpoint Hit ===');
    console.log('Request query:', req.query);
    console.log('User storeId:', req.user.storeId);
    
    const { date, status, petId, bookingType, source } = req.query;
    
    // Find the veterinary store for this manager
    const veterinaryStore = await Veterinary.findOne({ storeId: req.user.storeId });
    console.log('Veterinary store found:', veterinaryStore ? veterinaryStore._id : 'Not found');
    
    if (!veterinaryStore) {
      return res.status(404).json({ success: false, message: 'Veterinary store not found' });
    }
    
    // Build filters for both collections
    // For manager appointments, we use the string storeId
    // For user appointments, we use the ObjectId storeId
    const managerFilter = { storeId: veterinaryStore.storeId };
    const userFilter = { storeId: veterinaryStore._id };

    // Apply common filters
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      managerFilter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
      userFilter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (status) {
      managerFilter.status = status;
      userFilter.status = status;
    }

    if (petId) {
      managerFilter.petId = petId;
      userFilter.petId = petId;
    }

    if (bookingType) {
      managerFilter.bookingType = bookingType;
      userFilter.bookingType = bookingType;
    }

    // Determine which collections to query based on source parameter
    let managerAppointments = [];
    let userAppointments = [];
    
    // If no source specified or source is 'manager', get manager appointments
    if (!source || source === 'manager' || source === 'all') {
      console.log('Fetching manager appointments with filter:', managerFilter);
      managerAppointments = await ManagerVeterinaryAppointment.find(managerFilter)
        .populate([
          { path: 'petId', select: 'name species breed' },
          { path: 'ownerId', select: 'name email phone' },
          { path: 'staffId', select: 'name role' }
        ])
        .sort({ bookingType: 1, appointmentDate: 1, timeSlot: 1 });
      console.log('Found manager appointments:', managerAppointments.length);
    }
    
    // If no source specified or source is 'user', get user appointments
    if (!source || source === 'user' || source === 'all') {
      console.log('Fetching user appointments with filter:', userFilter);
      userAppointments = await VeterinaryAppointment.find(userFilter)
        .populate([
          { path: 'petId', select: 'name species breed' },
          { path: 'ownerId', select: 'name email phone' },
          { path: 'serviceId', select: 'name price duration' }
        ])
        .sort({ bookingType: 1, appointmentDate: 1, timeSlot: 1 });
      console.log('Found user appointments:', userAppointments.length);
      
      // Add source identifier to user appointments
      userAppointments = userAppointments.map(appointment => ({
        ...appointment.toObject(),
        _source: 'user'
      }));
    }
    
    // Combine appointments
    const allAppointments = [...managerAppointments, ...userAppointments];
    console.log('Total appointments:', allAppointments.length);
    
    // Sort all appointments by date and time
    allAppointments.sort((a, b) => {
      const dateA = a.appointmentDate || new Date(0);
      const dateB = b.appointmentDate || new Date(0);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      return (a.timeSlot || '').localeCompare(b.timeSlot || '');
    });

    res.json({
      success: true,
      data: { appointments: allAppointments }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching appointments', error: error.message });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the veterinary store for this manager
    const veterinaryStore = await Veterinary.findOne({ storeId: req.user.storeId });
    if (!veterinaryStore) {
      return res.status(404).json({ success: false, message: 'Veterinary store not found' });
    }

    // Try to find in ManagerVeterinaryAppointment first
    let appointment = await ManagerVeterinaryAppointment.findById(id)
      .populate([
        { path: 'petId', select: 'name species breed' },
        { path: 'ownerId', select: 'name email phone' },
        { path: 'staffId', select: 'name role' },
        { path: 'serviceId', select: 'name price duration' }
      ]);

    // If not found, try VeterinaryAppointment
    if (!appointment) {
      appointment = await VeterinaryAppointment.findById(id)
        .populate([
          { path: 'petId', select: 'name species breed' },
          { path: 'ownerId', select: 'name email phone' },
          { path: 'serviceId', select: 'name price duration' },
          { path: 'storeId', select: 'storeName' }
        ]);
      
      // Add source identifier if found in user collection
      if (appointment) {
        appointment = {
          ...appointment.toObject(),
          _source: 'user'
        };
      }
    }

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if user has access to this appointment
    // For manager appointments, check against veterinaryStore.storeId (string)
    // For user appointments, check against veterinaryStore._id (ObjectId)
    let hasAccess = false;
    
    if (appointment._source === 'user') {
      // User appointment - check ObjectId storeId
      hasAccess = appointment.storeId.toString() === veterinaryStore._id.toString();
    } else {
      // Manager appointment - check string storeId
      hasAccess = appointment.storeId === veterinaryStore.storeId;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied - Appointment does not belong to your veterinary clinic' });
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching appointment', error: error.message });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find the veterinary store for this manager
    const veterinaryStore = await Veterinary.findOne({ storeId: req.user.storeId });
    if (!veterinaryStore) {
      return res.status(404).json({ success: false, message: 'Veterinary store not found' });
    }

    // Try to find in ManagerVeterinaryAppointment first
    let appointment = await ManagerVeterinaryAppointment.findById(id);
    let isUserAppointment = false;
    
    // If not found, try VeterinaryAppointment
    if (!appointment) {
      appointment = await VeterinaryAppointment.findById(id);
      isUserAppointment = true;
    }

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if user has access to this appointment
    let hasAccess = false;
    
    if (isUserAppointment) {
      // User appointment - check ObjectId storeId
      hasAccess = appointment.storeId.toString() === veterinaryStore._id.toString();
    } else {
      // Manager appointment - check string storeId
      hasAccess = appointment.storeId === veterinaryStore.storeId;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied - Appointment does not belong to your veterinary clinic' });
    }

    // Update appointment
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'storeId' && key !== 'createdBy') {
        appointment[key] = updateData[key];
      }
    });

    appointment.updatedBy = req.user._id;
    await appointment.save();

    // Populate references
    if (isUserAppointment) {
      await appointment.populate([
        { path: 'petId', select: 'name species breed' },
        { path: 'ownerId', select: 'name email phone' },
        { path: 'serviceId', select: 'name price duration' },
        { path: 'storeId', select: 'storeName' }
      ]);
    } else {
      await appointment.populate([
        { path: 'petId', select: 'name species breed' },
        { path: 'ownerId', select: 'name email phone' },
        { path: 'serviceId', select: 'name price duration' }
      ]);
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating appointment', error: error.message });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the veterinary store for this manager
    const veterinaryStore = await Veterinary.findOne({ storeId: req.user.storeId });
    if (!veterinaryStore) {
      return res.status(404).json({ success: false, message: 'Veterinary store not found' });
    }

    // Try to find in ManagerVeterinaryAppointment first
    let appointment = await ManagerVeterinaryAppointment.findById(id);
    let isUserAppointment = false;
    
    // If not found, try VeterinaryAppointment
    if (!appointment) {
      appointment = await VeterinaryAppointment.findById(id);
      isUserAppointment = true;
    }

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if user has access to this appointment
    let hasAccess = false;
    
    if (isUserAppointment) {
      // User appointment - check ObjectId storeId
      hasAccess = appointment.storeId.toString() === veterinaryStore._id.toString();
    } else {
      // Manager appointment - check string storeId
      hasAccess = appointment.storeId === veterinaryStore.storeId;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied - Appointment does not belong to your veterinary clinic' });
    }

    // Delete appointment
    if (isUserAppointment) {
      await VeterinaryAppointment.findByIdAndDelete(id);
    } else {
      await ManagerVeterinaryAppointment.findByIdAndDelete(id);
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting appointment', error: error.message });
  }
};

const getAvailableTimeSlots = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    // Find the veterinary store for this manager
    const veterinaryStore = await Veterinary.findOne({ storeId: req.user.storeId });
    if (!veterinaryStore) {
      return res.status(404).json({ success: false, message: 'Veterinary store not found' });
    }

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Get booked time slots from both collections
    const managerAppointments = await ManagerVeterinaryAppointment.find({
      storeId: veterinaryStore._id,
      appointmentDate: { $gte: selectedDate, $lt: nextDate },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    const userAppointments = await VeterinaryAppointment.find({
      storeId: veterinaryStore.storeId,
      appointmentDate: { $gte: selectedDate, $lt: nextDate },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    // Combine booked slots
    const bookedSlots = [...managerAppointments, ...userAppointments].map(app => app.timeSlot);

    // Generate all possible time slots (9 AM to 5 PM in 30-minute intervals)
    const allSlots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) continue; // Don't include 5:30 PM
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allSlots.push(timeString);
      }
    }

    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      success: true,
      data: { availableSlots }
    });
  } catch (error) {
    console.error('Get available time slots error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching available time slots', error: error.message });
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