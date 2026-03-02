const VeterinaryMedicalRecord = require('../../models/VeterinaryMedicalRecord');
const VeterinaryAppointment = require('../../models/VeterinaryAppointment');
const VeterinaryVaccinationSchedule = require('../../models/VeterinaryVaccinationSchedule');
const Pet = require('../../../../core/models/Pet');
const mongoose = require('mongoose');

/**
 * Helper function to find pet across different models
 */
const findPetById = async (petId) => {
  try {
    // Try core Pet model first
    let pet = await Pet.findById(petId).populate('images', 'url isPrimary');
    if (pet) {
      return { pet, modelUsed: 'Pet', ownerId: pet.owner || pet.currentOwnerId || pet.createdBy };
    }

    // Try AdoptionPet model
    const AdoptionPet = mongoose.models.AdoptionPet;
    if (AdoptionPet) {
      pet = await AdoptionPet.findById(petId).populate('images', 'url isPrimary');
      if (pet) {
        return { pet, modelUsed: 'AdoptionPet', ownerId: pet.adopterUserId || pet.owner || pet.createdBy };
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding pet:', error);
    return null;
  }
};

/**
 * Get user's pets medical records
 */
const getUserPetsMedicalHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all pets owned by user across different models
    const corePets = await Pet.find({
      $or: [
        { owner: userId },
        { currentOwnerId: userId },
        { createdBy: userId }
      ]
    }).populate('images', 'url isPrimary').select('name species breed age gender weight');

    let adoptedPets = [];
    const AdoptionPet = mongoose.models.AdoptionPet;
    if (AdoptionPet) {
      adoptedPets = await AdoptionPet.find({
        $or: [
          { adopterUserId: userId },
          { owner: userId }
        ]
      }).populate('images', 'url isPrimary').select('name species breed age gender weight');
    }

    const allPets = [...corePets, ...adoptedPets];

    if (allPets.length === 0) {
      return res.json({
        success: true,
        data: {
          pets: [],
          message: 'No pets found'
        }
      });
    }

    const petIds = allPets.map(p => p._id);

    // Get medical records count for each pet
    const petsWithRecordCounts = await Promise.all(
      allPets.map(async (pet) => {
        const recordCount = await VeterinaryMedicalRecord.countDocuments({
          pet: pet._id,
          owner: userId,
          isActive: true
        });

        const lastVisit = await VeterinaryMedicalRecord.findOne({
          pet: pet._id,
          owner: userId,
          isActive: true
        }).sort({ visitDate: -1 }).select('visitDate diagnosis');

        const upcomingAppointments = await VeterinaryAppointment.countDocuments({
          petId: pet._id,
          ownerId: userId,
          status: { $in: ['confirmed', 'pending_approval'] },
          appointmentDate: { $gte: new Date() }
        });

        return {
          _id: pet._id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          age: pet.age,
          gender: pet.gender,
          weight: pet.weight,
          image: pet.images?.find(i => i.isPrimary)?.url || pet.images?.[0]?.url,
          recordCount,
          lastVisit: lastVisit ? {
            date: lastVisit.visitDate,
            diagnosis: lastVisit.diagnosis
          } : null,
          upcomingAppointments
        };
      })
    );

    res.json({
      success: true,
      data: {
        pets: petsWithRecordCounts
      }
    });
  } catch (error) {
    console.error('Get user pets medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pets medical history',
      error: error.message
    });
  }
};

/**
 * Get comprehensive medical history for user's specific pet
 */
const getUserPetMedicalHistory = async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.user._id;

    // Find pet and verify ownership
    const petResult = await findPetById(petId);
    if (!petResult) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    const { pet, ownerId } = petResult;

    // Verify ownership
    if (ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you do not own this pet'
      });
    }

    // Fetch all medical records for the pet
    const medicalRecords = await VeterinaryMedicalRecord.find({
      pet: petId,
      owner: userId,
      isActive: true
    })
      .populate('veterinary', 'name location phone')
      .populate('staff', 'name specialization')
      .sort({ visitDate: -1 });

    // Fetch vaccination records
    const vaccinations = await VeterinaryVaccinationSchedule.find({
      pet: petId,
      isActive: true
    }).sort({ vaccinationDate: -1, scheduledDate: -1 });

    // Fetch all appointments (past and future)
    const appointments = await VeterinaryAppointment.find({
      petId: petId,
      ownerId: userId
    })
      .populate('serviceId', 'name duration price')
      .populate('storeId', 'name location')
      .sort({ appointmentDate: -1 });

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
        medications: record.medications || [],
        procedures: record.procedures || [],
        tests: record.tests || [],
        vaccinations: record.vaccinations || [],
        notes: record.notes,
        cost: record.totalCost,
        paymentStatus: record.paymentStatus,
        balanceDue: record.totalCost - (record.amountPaid || 0),
        veterinarian: record.staff?.name || 'N/A',
        clinic: record.veterinary?.name || 'N/A',
        clinicLocation: record.veterinary?.location,
        followUp: record.followUpRequired ? {
          required: true,
          date: record.followUpDate,
          notes: record.followUpNotes
        } : null,
        attachments: record.attachments || [],
        recordId: record._id,
        createdAt: record.createdAt
      });
    });

    // Add vaccinations to timeline
    vaccinations.forEach(vac => {
      const vacDate = vac.vaccinationDate || vac.scheduledDate;
      if (vacDate) {
        timeline.push({
          type: 'vaccination',
          date: vacDate,
          title: `${vac.vaccineName} Vaccination`,
          vaccineName: vac.vaccineName,
          status: vac.status,
          batchNumber: vac.batchNumber,
          nextDueDate: vac.nextDueDate,
          notes: vac.notes,
          administeredBy: vac.administeredBy,
          createdAt: vac.createdAt
        });
      }
    });

    // Add appointments to timeline
    appointments.forEach(apt => {
      if (apt.appointmentDate) {
        timeline.push({
          type: 'appointment',
          date: apt.appointmentDate,
          title: apt.serviceId?.name || apt.reason || 'Appointment',
          status: apt.status,
          reason: apt.reason,
          service: apt.serviceId?.name,
          clinic: apt.storeId?.name,
          clinicLocation: apt.storeId?.location,
          timeSlot: apt.timeSlot,
          notes: apt.notes,
          createdAt: apt.createdAt
        });
      }
    });

    // Sort timeline by date (most recent first)
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate health statistics
    const totalVisits = medicalRecords.length;
    const completedVaccinations = vaccinations.filter(v => v.status === 'completed').length;
    const pendingVaccinations = vaccinations.filter(v => 
      v.status === 'scheduled' && new Date(v.scheduledDate) > new Date()
    ).length;
    
    // Recent diagnoses (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentDiagnoses = medicalRecords
      .filter(r => new Date(r.visitDate) >= sixMonthsAgo)
      .map(r => ({
        diagnosis: r.diagnosis,
        date: r.visitDate,
        treatment: r.treatment
      }))
      .filter(d => d.diagnosis);

    // Current/ongoing medications
    const currentMedications = [];
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    medicalRecords
      .filter(r => new Date(r.visitDate) >= threeMonthsAgo && r.medications?.length > 0)
      .forEach(record => {
        record.medications.forEach(med => {
          currentMedications.push({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            prescribedDate: record.visitDate,
            notes: med.notes
          });
        });
      });

    // Upcoming appointments
    const upcomingAppointments = appointments
      .filter(apt => apt.status === 'confirmed' && new Date(apt.appointmentDate) >= new Date())
      .map(apt => ({
        id: apt._id,
        date: apt.appointmentDate,
        time: apt.timeSlot,
        service: apt.serviceId?.name,
        reason: apt.reason,
        clinic: apt.storeId?.name,
        location: apt.storeId?.location,
        status: apt.status
      }));

    // Pending follow-ups
    const pendingFollowUps = medicalRecords
      .filter(r => r.followUpRequired && r.followUpDate && new Date(r.followUpDate) >= new Date())
      .map(r => ({
        recordId: r._id,
        diagnosis: r.diagnosis,
        followUpDate: r.followUpDate,
        notes: r.followUpNotes,
        originalVisitDate: r.visitDate
      }));

    // Total medical expenses
    const totalExpenses = medicalRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const totalPaid = medicalRecords.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    const outstandingBalance = Math.max(0, totalExpenses - totalPaid);

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
          completedVaccinations,
          pendingVaccinations,
          lastVisit: medicalRecords[0]?.visitDate || null,
          nextAppointment: upcomingAppointments[0]?.date || null,
          totalExpenses,
          totalPaid,
          outstandingBalance
        },
        recentDiagnoses: recentDiagnoses.slice(0, 5),
        currentMedications: currentMedications.slice(0, 10),
        upcomingAppointments,
        pendingFollowUps
      }
    });
  } catch (error) {
    console.error('Get user pet medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet medical history',
      error: error.message
    });
  }
};

/**
 * Get specific medical record details for user
 */
const getUserMedicalRecordDetail = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user._id;

    const record = await VeterinaryMedicalRecord.findById(recordId)
      .populate('pet', 'name species breed age gender weight color microchipId')
      .populate({
        path: 'pet',
        populate: { path: 'images', select: 'url isPrimary' }
      })
      .populate('veterinary', 'name location phone email openingHours')
      .populate('staff', 'name specialization');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Verify ownership
    if (record.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get related records (previous visits for context)
    const relatedRecords = await VeterinaryMedicalRecord.find({
      pet: record.pet._id,
      owner: userId,
      _id: { $ne: record._id },
      isActive: true
    })
      .select('visitDate diagnosis treatment')
      .sort({ visitDate: -1 })
      .limit(3);

    res.json({
      success: true,
      data: {
        record: {
          ...record.toObject(),
          balanceDue: Math.max(0, (record.totalCost || 0) - (record.amountPaid || 0))
        },
        relatedRecords
      }
    });
  } catch (error) {
    console.error('Get user medical record detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical record details',
      error: error.message
    });
  }
};

/**
 * Download medical record (for printing/sharing with other vets)
 */
const downloadMedicalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user._id;

    const record = await VeterinaryMedicalRecord.findById(recordId)
      .populate('pet', 'name species breed age gender weight color microchipId dateOfBirth')
      .populate({
        path: 'pet',
        populate: { path: 'images', select: 'url isPrimary' }
      })
      .populate('owner', 'name email phone address')
      .populate('veterinary', 'name location phone email')
      .populate('staff', 'name specialization email');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Verify ownership
    if (record.owner._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Return comprehensive record data (frontend will format for PDF)
    res.json({
      success: true,
      data: {
        record: {
          ...record.toObject(),
          balanceDue: Math.max(0, (record.totalCost || 0) - (record.amountPaid || 0))
        },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Download medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download medical record',
      error: error.message
    });
  }
};

module.exports = {
  getUserPetsMedicalHistory,
  getUserPetMedicalHistory,
  getUserMedicalRecordDetail,
  downloadMedicalRecord
};
