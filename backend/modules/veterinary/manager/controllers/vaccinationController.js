const VeterinaryVaccinationSchedule = require('../../models/VeterinaryVaccinationSchedule');
const Pet = require('../../../../core/models/Pet');

// Get vaccination schedules
exports.getVaccinationSchedules = async (req, res) => {
  try {
    const { petId, status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const storeId = req.user.storeId;

    const filter = { storeId };
    
    if (petId) filter.pet = petId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [schedules, total] = await Promise.all([
      VeterinaryVaccinationSchedule.find(filter)
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('pet', 'name species breed')
        .populate('owner', 'name email phone')
        .populate('administeredBy', 'name'),
      VeterinaryVaccinationSchedule.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        schedules,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get vaccination schedules error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedules' });
  }
};

// Get single vaccination schedule
exports.getVaccinationSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    const schedule = await VeterinaryVaccinationSchedule.findOne({ _id: id, storeId })
      .populate('pet', 'name species breed age gender')
      .populate('owner', 'name email phone')
      .populate('administeredBy', 'name email')
      .populate('medicalRecordId');

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Get vaccination schedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedule' });
  }
};

// Create vaccination schedule
exports.createVaccinationSchedule = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const storeName = req.user.storeName;

    // Verify pet exists and belongs to owner
    const pet = await Pet.findById(req.body.pet);
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    const schedule = new VeterinaryVaccinationSchedule({
      ...req.body,
      owner: pet.owner,
      storeId,
      storeName,
      createdBy: req.user.id
    });

    await schedule.save();

    res.status(201).json({
      success: true,
      message: 'Vaccination schedule created successfully',
      data: schedule
    });
  } catch (error) {
    console.error('Create vaccination schedule error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create schedule' });
  }
};

// Update vaccination schedule
exports.updateVaccinationSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    const schedule = await VeterinaryVaccinationSchedule.findOne({ _id: id, storeId });
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    Object.assign(schedule, req.body);
    schedule.updatedBy = req.user.id;
    await schedule.save();

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule
    });
  } catch (error) {
    console.error('Update vaccination schedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to update schedule' });
  }
};

// Mark vaccination as completed
exports.completeVaccination = async (req, res) => {
  try {
    const { id } = req.params;
    const { batchNumber, manufacturer, expiryDate, administeredDate, nextDoseDate, notes, sideEffects, medicalRecordId } = req.body;
    const storeId = req.user.storeId;

    const schedule = await VeterinaryVaccinationSchedule.findOne({ _id: id, storeId });
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    schedule.status = 'completed';
    schedule.administeredDate = administeredDate || new Date();
    schedule.administeredBy = req.user.id;
    schedule.batchNumber = batchNumber;
    schedule.manufacturer = manufacturer;
    schedule.expiryDate = expiryDate;
    schedule.nextDoseDate = nextDoseDate;
    schedule.notes = notes;
    schedule.sideEffects = sideEffects;
    schedule.medicalRecordId = medicalRecordId;
    schedule.updatedBy = req.user.id;

    await schedule.save();

    // Create next dose schedule if provided
    if (nextDoseDate) {
      await VeterinaryVaccinationSchedule.create({
        pet: schedule.pet,
        owner: schedule.owner,
        vaccineName: schedule.vaccineName,
        vaccineType: schedule.vaccineType,
        description: schedule.description,
        scheduledDate: nextDoseDate,
        dueDate: nextDoseDate,
        isBooster: true,
        boosterNumber: (schedule.boosterNumber || 0) + 1,
        storeId,
        storeName: schedule.storeName,
        createdBy: req.user.id
      });
    }

    res.json({
      success: true,
      message: 'Vaccination marked as completed',
      data: schedule
    });
  } catch (error) {
    console.error('Complete vaccination error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete vaccination' });
  }
};

// Get due vaccinations
exports.getDueVaccinations = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueVaccinations = await VeterinaryVaccinationSchedule.find({
      storeId,
      status: { $in: ['scheduled', 'due', 'overdue'] },
      dueDate: { $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) } // Next 7 days
    })
      .sort({ dueDate: 1 })
      .populate('pet', 'name species breed')
      .populate('owner', 'name email phone')
      .limit(50);

    res.json({
      success: true,
      data: dueVaccinations
    });
  } catch (error) {
    console.error('Get due vaccinations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch due vaccinations' });
  }
};

// Get vaccination statistics
exports.getVaccinationStats = async (req, res) => {
  try {
    const storeId = req.user.storeId;

    const [
      totalScheduled,
      completedCount,
      dueCount,
      overdueCount,
      upcomingCount
    ] = await Promise.all([
      VeterinaryVaccinationSchedule.countDocuments({ storeId }),
      VeterinaryVaccinationSchedule.countDocuments({ storeId, status: 'completed' }),
      VeterinaryVaccinationSchedule.countDocuments({ storeId, status: 'due' }),
      VeterinaryVaccinationSchedule.countDocuments({ storeId, status: 'overdue' }),
      VeterinaryVaccinationSchedule.countDocuments({ 
        storeId, 
        status: 'scheduled',
        scheduledDate: { $gte: new Date() }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalScheduled,
        completedCount,
        dueCount,
        overdueCount,
        upcomingCount
      }
    });
  } catch (error) {
    console.error('Get vaccination stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};

// Delete vaccination schedule
exports.deleteVaccinationSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    const schedule = await VeterinaryVaccinationSchedule.findOneAndDelete({ _id: id, storeId });
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete vaccination schedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete schedule' });
  }
};
