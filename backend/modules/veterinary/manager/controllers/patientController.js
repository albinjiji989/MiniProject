const VeterinaryAppointment = require('../models/VeterinaryAppointment');
const Pet = require('../../../../core/models/Pet');

// Get all patients (unique pets with appointments)
const getPatients = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const { search, page = 1, limit = 20 } = req.query;

    // Get unique pet IDs from appointments
    const petIds = await VeterinaryAppointment.distinct('petId', { storeId });

    // Build filter
    const filter = { _id: { $in: petIds } };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { petCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Get pets with appointment count
    const patients = await Pet.find(filter)
      .populate('currentOwnerId', 'name email phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add appointment count for each patient
    for (let patient of patients) {
      const appointmentCount = await VeterinaryAppointment.countDocuments({
        storeId,
        petId: patient._id
      });
      patient.appointmentCount = appointmentCount;

      // Get last appointment
      const lastAppointment = await VeterinaryAppointment.findOne({
        storeId,
        petId: patient._id
      }).sort({ appointmentDate: -1 }).lean();
      
      patient.lastVisit = lastAppointment?.appointmentDate;
    }

    const total = await Pet.countDocuments(filter);

    res.json({
      success: true,
      data: {
        patients,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch patients' });
  }
};

// Get patient details with medical history
const getPatientDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    const pet = await Pet.findById(id)
      .populate('currentOwnerId', 'name email phone address');

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Get all appointments for this pet at this clinic
    const appointments = await VeterinaryAppointment.find({
      storeId,
      petId: id
    })
      .populate('veterinarianId', 'name')
      .sort({ appointmentDate: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        patient: pet,
        appointments,
        totalVisits: appointments.length
      }
    });
  } catch (error) {
    console.error('Get patient details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch patient details' });
  }
};

module.exports = {
  getPatients,
  getPatientDetails
};
