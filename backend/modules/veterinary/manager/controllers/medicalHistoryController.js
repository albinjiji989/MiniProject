const VeterinaryMedicalRecord = require('../../models/VeterinaryMedicalRecord');
const VeterinaryAppointment = require('../../models/VeterinaryAppointment');
const VeterinaryVaccinationSchedule = require('../../models/VeterinaryVaccinationSchedule');
const Veterinary = require('../../models/Veterinary');
const Pet = require('../../../../core/models/Pet');
const mongoose = require('mongoose');

/**
 * Get comprehensive medical history for a specific pet
 * Industry-level medical tracking with timeline
 */
const getPetMedicalHistory = async (req, res) => {
  try {
    const { petId } = req.params;
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Find the veterinary store
    const veterinaryStore = await Veterinary.findOne({ storeId });
    if (!veterinaryStore) {
      return res.status(404).json({
        success: false,
        message: 'Veterinary store not found'
      });
    }

    // Fetch all medical records for the pet
    const medicalRecords = await VeterinaryMedicalRecord.find({
      pet: petId,
      isActive: true
    })
      .populate('owner', 'name email phone')
      .populate('staff', 'name specialization')
      .populate('veterinary', 'name location')
      .sort({ visitDate: -1 });

    // Fetch vaccination records
    const vaccinations = await VeterinaryVaccinationSchedule.find({
      pet: petId,
      isActive: true
    }).sort({ vaccinationDate: -1 });

    // Fetch upcoming appointments
    const upcomingAppointments = await VeterinaryAppointment.find({
      petId: petId,
      status: { $in: ['confirmed', 'pending_approval'] },
      appointmentDate: { $gte: new Date() }
    })
      .populate('serviceId', 'name duration price')
      .sort({ appointmentDate: 1 })
      .limit(5);

    // Get pet details
    const pet = await Pet.findById(petId).populate('images', 'url isPrimary');

    // Build comprehensive medical timeline
    const timeline = [];

    // Add medical records to timeline
    medicalRecords.forEach(record => {
      timeline.push({
        type: 'medical_visit',
        date: record.visitDate,
        title: record.diagnosis || 'Medical Consultation',
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        medications: record.medications,
        procedures: record.procedures,
        tests: record.tests,
        vaccinations: record.vaccinations,
        notes: record.notes,
        cost: record.totalCost,
        paymentStatus: record.paymentStatus,
        veterinarian: record.staff?.name || 'N/A',
        followUp: record.followUpRequired ? {
          required: true,
          date: record.followUpDate,
          notes: record.followUpNotes
        } : null,
        attachments: record.attachments,
        recordId: record._id
      });
    });

    // Add vaccinations to timeline
    vaccinations.forEach(vac => {
      timeline.push({
        type: 'vaccination',
        date: vac.vaccinationDate || vac.scheduledDate,
        title: vac.vaccineName,
        status: vac.status,
        batchNumber: vac.batchNumber,
        nextDueDate: vac.nextDueDate,
        notes: vac.notes,
        administeredBy: vac.administeredBy
      });
    });

    // Sort timeline by date (most recent first)
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate health statistics
    const totalVisits = medicalRecords.length;
    const totalVaccinations = vaccinations.filter(v => v.status === 'completed').length;
    const pendingVaccinations = vaccinations.filter(v => v.status === 'scheduled' && new Date(v.scheduledDate) > new Date()).length;
    
    // Recent diagnoses (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentDiagnoses = medicalRecords
      .filter(r => new Date(r.visitDate) >= sixMonthsAgo)
      .map(r => r.diagnosis)
      .filter(Boolean);

    // Ongoing medications
    const ongoingMedications = [];
    medicalRecords.forEach(record => {
      if (record.medications && record.medications.length > 0) {
        record.medications.forEach(med => {
          ongoingMedications.push({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            prescribedDate: record.visitDate
          });
        });
      }
    });

    // Chronic conditions
    const chronicConditions = medicalRecords
      .filter(r => r.notes && (r.notes.toLowerCase().includes('chronic') || r.notes.toLowerCase().includes('ongoing')))
      .map(r => ({
        condition: r.diagnosis,
        firstDiagnosed: r.visitDate,
        notes: r.notes
      }));

    res.json({
      success: true,
      data: {
        pet: {
          id: pet._id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          age: pet.age,
          gender: pet.gender,
          weight: pet.weight,
          color: pet.color,
          microchipId: pet.microchipId,
          image: pet.images?.find(i => i.isPrimary)?.url || pet.images?.[0]?.url
        },
        timeline,
        statistics: {
          totalVisits,
          totalVaccinations,
          pendingVaccinations,
          lastVisit: medicalRecords[0]?.visitDate || null,
          nextAppointment: upcomingAppointments[0]?.appointmentDate || null
        },
        recentDiagnoses: [...new Set(recentDiagnoses)].slice(0, 5),
        ongoingMedications: ongoingMedications.slice(0, 10),
        chronicConditions,
        upcomingAppointments: upcomingAppointments.map(apt => ({
          date: apt.appointmentDate,
          time: apt.timeSlot,
          service: apt.serviceId?.name,
          reason: apt.reason,
          status: apt.status
        }))
      }
    });
  } catch (error) {
    console.error('Get pet medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical history',
      error: error.message
    });
  }
};

/**
 * Get detailed medical record with full information
 */
const getDetailedMedicalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const record = await VeterinaryMedicalRecord.findById(recordId)
      .populate('pet', 'name species breed age gender weight color microchipId')
      .populate({
        path: 'pet',
        populate: { path: 'images', select: 'url isPrimary' }
      })
      .populate('owner', 'name email phone address')
      .populate('staff', 'name email specialization')
      .populate('veterinary', 'name location phone email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Verify access
    const veterinaryStore = await Veterinary.findOne({ storeId });
    if (!record.veterinary || record.veterinary._id.toString() !== veterinaryStore._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get related records (previous and next visits)
    const relatedRecords = await VeterinaryMedicalRecord.find({
      pet: record.pet._id,
      _id: { $ne: record._id },
      isActive: true
    })
      .select('visitDate diagnosis treatment')
      .sort({ visitDate: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        record,
        relatedRecords
      }
    });
  } catch (error) {
    console.error('Get detailed medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical record details',
      error: error.message
    });
  }
};

/**
 * Search medical records with advanced filters
 */
const searchMedicalRecords = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const {
      search,
      petId,
      ownerId,
      startDate,
      endDate,
      diagnosis,
      paymentStatus,
      followUpRequired,
      page = 1,
      limit = 20,
      sortBy = 'visitDate',
      sortOrder = 'desc'
    } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Find the veterinary store
    const veterinaryStore = await Veterinary.findOne({ storeId });
    if (!veterinaryStore) {
      return res.status(404).json({
        success: false,
        message: 'Veterinary store not found'
      });
    }

    // Build filter
    const filter = {
      veterinary: veterinaryStore._id,
      isActive: true
    };

    if (petId) filter.pet = petId;
    if (ownerId) filter.owner = ownerId;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (followUpRequired !== undefined) filter.followUpRequired = followUpRequired === 'true';

    // Date range filter
    if (startDate || endDate) {
      filter.visitDate = {};
      if (startDate) filter.visitDate.$gte = new Date(startDate);
      if (endDate) filter.visitDate.$lte = new Date(endDate);
    }

    // Text search
    if (search) {
      filter.$or = [
        { diagnosis: { $regex: search, $options: 'i' } },
        { treatment: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    if (diagnosis) {
      filter.diagnosis = { $regex: diagnosis, $options: 'i' };
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const records = await VeterinaryMedicalRecord.find(filter)
      .populate('pet', 'name species breed age gender')
      .populate({
        path: 'pet',
        populate: { path: 'images', select: 'url isPrimary' }
      })
      .populate('owner', 'name email phone')
      .populate('staff', 'name specialization')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VeterinaryMedicalRecord.countDocuments(filter);

    // Calculate statistics for the filtered results
    const stats = await VeterinaryMedicalRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$totalCost' },
          totalPaid: { $sum: '$amountPaid' },
          averageCost: { $avg: '$totalCost' },
          recordsWithFollowUp: {
            $sum: { $cond: ['$followUpRequired', 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        statistics: stats[0] || {
          totalCost: 0,
          totalPaid: 0,
          averageCost: 0,
          recordsWithFollowUp: 0
        }
      }
    });
  } catch (error) {
    console.error('Search medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search medical records',
      error: error.message
    });
  }
};

/**
 * Get medical records dashboard statistics
 */
const getMedicalRecordsDashboard = async (req, res) => {
  try {
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Find the veterinary store
    const veterinaryStore = await Veterinary.findOne({ storeId });
    if (!veterinaryStore) {
      return res.status(404).json({
        success: false,
        message: 'Veterinary store not found'
      });
    }

    const filter = {
      veterinary: veterinaryStore._id,
      isActive: true
    };

    // Date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.setDate(now.getDate() - 7));
    const monthStart = new Date(now.setMonth(now.getMonth() - 1));

    // Total records
    const totalRecords = await VeterinaryMedicalRecord.countDocuments(filter);

    // Records today
    const recordsToday = await VeterinaryMedicalRecord.countDocuments({
      ...filter,
      visitDate: { $gte: todayStart }
    });

    // Records this week
    const recordsThisWeek = await VeterinaryMedicalRecord.countDocuments({
      ...filter,
      visitDate: { $gte: weekStart }
    });

    // Records this month
    const recordsThisMonth = await VeterinaryMedicalRecord.countDocuments({
      ...filter,
      visitDate: { $gte: monthStart }
    });

    // Payment statistics
    const paymentStats = await VeterinaryMedicalRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalCost' },
          paidAmount: { $sum: '$amountPaid' }
        }
      }
    ]);

    // Follow-ups required
    const followUpsRequired = await VeterinaryMedicalRecord.countDocuments({
      ...filter,
      followUpRequired: true,
      followUpDate: { $gte: new Date() }
    });

    // Common diagnoses
    const commonDiagnoses = await VeterinaryMedicalRecord.aggregate([
      { $match: filter },
      { $group: { _id: '$diagnosis', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Active patients (pets with records)
    const activePatients = await VeterinaryMedicalRecord.distinct('pet', filter);

    // Recent records
    const recentRecords = await VeterinaryMedicalRecord.find(filter)
      .populate('pet', 'name species breed')
      .populate('owner', 'name')
      .populate('staff', 'name')
      .sort({ visitDate: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        overview: {
          totalRecords,
          recordsToday,
          recordsThisWeek,
          recordsThisMonth,
          activePatients: activePatients.length,
          followUpsRequired
        },
        paymentStatistics: paymentStats,
        commonDiagnoses: commonDiagnoses.map(d => ({
          diagnosis: d._id,
          count: d.count
        })),
        recentRecords
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

/**
 * Export medical records (for reports)
 */
const exportMedicalRecords = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const { startDate, endDate, format = 'json' } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const veterinaryStore = await Veterinary.findOne({ storeId });
    if (!veterinaryStore) {
      return res.status(404).json({
        success: false,
        message: 'Veterinary store not found'
      });
    }

    const filter = {
      veterinary: veterinaryStore._id,
      isActive: true
    };

    if (startDate || endDate) {
      filter.visitDate = {};
      if (startDate) filter.visitDate.$gte = new Date(startDate);
      if (endDate) filter.visitDate.$lte = new Date(endDate);
    }

    const records = await VeterinaryMedicalRecord.find(filter)
      .populate('pet', 'name species breed age gender weight')
      .populate('owner', 'name email phone')
      .populate('staff', 'name specialization')
      .sort({ visitDate: -1 });

    // For now, return JSON. In a real implementation, you'd generate CSV/PDF
    res.json({
      success: true,
      data: {
        records,
        exportDate: new Date(),
        clinic: {
          name: veterinaryStore.name,
          location: veterinaryStore.location
        }
      }
    });
  } catch (error) {
    console.error('Export medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export medical records',
      error: error.message
    });
  }
};

module.exports = {
  getPetMedicalHistory,
  getDetailedMedicalRecord,
  searchMedicalRecords,
  getMedicalRecordsDashboard,
  exportMedicalRecords
};
