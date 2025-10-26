const Appointment = require('../../models/Appointment');

const getUserAppointments = async (req, res) => {
  try {
    // Get appointments for the current user's pets
    const appointments = await Appointment.find({ pet: { $in: req.user.pets || [] } })
      .populate('veterinary', 'name address contact')
      .populate('pet', 'name species breed')
      .sort({ date: 1 });

    res.json({
      success: true,
      data: {
        appointments
      }
    });
  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getUserAppointments };