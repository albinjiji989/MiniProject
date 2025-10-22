const VeterinaryAppointment = require('../models/VeterinaryAppointment');
const VeterinaryService = require('../models/VeterinaryService');
const Pet = require('../../../../core/models/Pet');
const User = require('../../../../core/models/User');

// Create new appointment
const createAppointment = async (req, res) => {
  try {
    const { petId, ownerId, serviceId, appointmentDate, timeSlot, symptoms, notes } = req.body;
    const storeId = req.user.storeId;

    // Validate service
    const service = await VeterinaryService.findById(serviceId);
    if (!service || service.storeId !== storeId) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const appointment = new VeterinaryAppointment({
      petId,
      ownerId,
      storeId,
      serviceId,
      serviceName: service.name,
      appointmentDate,
      timeSlot,
      symptoms,
      notes,
      fee: service.price,
      status: 'pending'
    });

    await appointment.save();
    await appointment.populate(['petId', 'ownerId']);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create appointment' });
  }
};

// Update appointment
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const storeId = req.user.storeId;

    const appointment = await VeterinaryAppointment.findOne({ _id: id, storeId });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    Object.assign(appointment, updates);
    await appointment.save();
    await appointment.populate(['petId', 'ownerId', 'veterinarianId']);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update appointment' });
  }
};

// Complete appointment with diagnosis
const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, treatment, prescription, notes } = req.body;
    const storeId = req.user.storeId;

    const appointment = await VeterinaryAppointment.findOne({ _id: id, storeId });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.status = 'completed';
    appointment.diagnosis = diagnosis;
    appointment.treatment = treatment;
    appointment.prescription = prescription;
    appointment.notes = notes;
    appointment.completedAt = new Date();
    appointment.veterinarianId = req.user.id;

    await appointment.save();
    await appointment.populate(['petId', 'ownerId', 'veterinarianId']);

    res.json({
      success: true,
      message: 'Appointment completed successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete appointment' });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const storeId = req.user.storeId;

    const appointment = await VeterinaryAppointment.findOne({ _id: id, storeId });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = reason;

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
  }
};

// Get single appointment
const getAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    const appointment = await VeterinaryAppointment.findOne({ _id: id, storeId })
      .populate('petId')
      .populate('ownerId', 'name email phone')
      .populate('veterinarianId', 'name')
      .populate('serviceId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointment' });
  }
};

module.exports = {
  createAppointment,
  updateAppointment,
  completeAppointment,
  cancelAppointment,
  getAppointment
};
