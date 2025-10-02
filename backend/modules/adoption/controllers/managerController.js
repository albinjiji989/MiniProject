const AdoptionPet = require('../models/AdoptionPet');
const AdoptionRequest = require('../models/AdoptionRequest');
const User = require('../../../core/models/User');
const paymentService = require('../../../core/services/paymentService');
const { sendMail } = require('../../../core/utils/email');
const { sendSMS } = require('../../../core/utils/sms');
const csvParser = require('csv-parser');

// Helper to parse CSV buffer
const parseCSVBuffer = (buffer) => new Promise((resolve, reject) => {
  try {
    const results = [];
    const stream = require('stream');
    const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  } catch (err) { reject(err); }
});

// Manager Controllers
const getManagerPets = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = { isActive: true };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { species: { $regex: search, $options: 'i' } },
        { petCode: { $regex: search, $options: 'i' } },
      ];
    }

    const pets = await AdoptionPet.find(query)
      .populate('adopterUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AdoptionPet.countDocuments(query);

    res.json({
      success: true,
      data: {
        pets,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};



// Generate a unique adoption pet code (without creating a pet)
const getNewPetCode = async (req, res) => {
  try {
    const code = await AdoptionPet.generatePetCode();
    return res.json({ success: true, data: { code } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const createPet = async (req, res) => {
  try {
    const petData = {
      ...req.body,
      createdBy: req.user.id
    };

    const pet = new AdoptionPet(petData);
    await pet.save();

    res.status(201).json({
      success: true,
      data: pet,
      message: 'Pet added successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getPetById = async (req, res) => {
  try {
    const pet = await AdoptionPet.findById(req.params.id)
      .populate('adopterUserId', 'name email phone')
      .populate('createdBy', 'name email');

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    res.json({ success: true, data: pet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updatePet = async (req, res) => {
  try {
    const pet = await AdoptionPet.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    res.json({
      success: true,
      data: pet,
      message: 'Pet updated successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const deletePet = async (req, res) => {
  try {
    const pet = await AdoptionPet.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getManagerApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { isActive: true };

    if (status) query.status = status;

    const applications = await AdoptionRequest.find(query)
      .populate('userId', 'name email phone')
      .populate('petId', 'name breed species age')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AdoptionRequest.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const application = await AdoptionRequest.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('petId', 'name breed species age images')
      .populate('reviewedBy', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const approveApplication = async (req, res) => {
  try {
    const { notes } = req.body;
    const application = await AdoptionRequest.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'Application is not in pending status' 
      });
    }

    await application.approve(req.user.id, notes);

    // Reserve the pet
    const pet = await AdoptionPet.findById(application.petId);
    if (pet) {
      pet.reserve(application.userId);
      await pet.save();
    }

    // Send notification to user
    const user = await User.findById(application.userId);
    if (user) {
      await sendMail(user.email, 'Adoption Application Approved', 
        `Your adoption application for ${pet?.name} has been approved. Please proceed with payment.`);
      
      if (user.phone) {
        await sendSMS(user.phone, `Your adoption application for ${pet?.name} has been approved. Please check your email for payment details.`);
      }
    }

    res.json({
      success: true,
      message: 'Application approved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const rejectApplication = async (req, res) => {
  try {
    const { reason, notes } = req.body;
    const application = await AdoptionRequest.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'Application is not in pending status' 
      });
    }

    await application.reject(req.user.id, reason, notes);

    // Make pet available again
    const pet = await AdoptionPet.findById(application.petId);
    if (pet && pet.status === 'reserved') {
      pet.status = 'available';
      pet.adopterUserId = null;
      await pet.save();
    }

    // Send notification to user
    const user = await User.findById(application.userId);
    if (user) {
      await sendMail(user.email, 'Adoption Application Update', 
        `Your adoption application has been reviewed. Unfortunately, it was not approved at this time. Reason: ${reason}`);
    }

    res.json({
      success: true,
      message: 'Application rejected successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createPaymentOrder = async (req, res) => {
  try {
    const { applicationId, amount } = req.body;
    
    const application = await AdoptionRequest.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        error: 'Application must be approved before payment' 
      });
    }

    const orderResult = await paymentService.createOrder(amount, 'INR', {
      applicationId: applicationId,
      userId: application.userId,
      petId: application.petId
    });

    if (!orderResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: orderResult.error 
      });
    }

    // Update application with order details
    application.paymentDetails.razorpayOrderId = orderResult.order.id;
    application.paymentStatus = 'processing';
    await application.save();

    res.json({
      success: true,
      data: {
        orderId: orderResult.order.id,
        amount: orderResult.order.amount,
        currency: orderResult.order.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, applicationId } = req.body;

    const isVerified = paymentService.verifyPayment(signature, orderId, paymentId);
    
    if (!isVerified) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment verification failed' 
      });
    }

    const application = await AdoptionRequest.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Get payment details from Razorpay
    const paymentDetails = await paymentService.getPaymentDetails(paymentId);
    if (!paymentDetails.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to fetch payment details' 
      });
    }

    // Update application with payment details
    application.paymentDetails = {
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      amount: paymentDetails.payment.amount / 100, // Convert from paise
      currency: paymentDetails.payment.currency,
      transactionId: paymentDetails.payment.id
    };

    await application.completePayment(application.paymentDetails);

    // Complete adoption
    const pet = await AdoptionPet.findById(application.petId);
    if (pet) {
      pet.completeAdoption();
      await pet.save();
    }

    res.json({
      success: true,
      message: 'Payment verified and adoption completed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateContract = async (req, res) => {
  try {
    const application = await AdoptionRequest.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.paymentStatus !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment must be completed before generating contract' 
      });
    }

    // Generate contract URL (in real implementation, generate actual PDF)
    const contractURL = `https://your-domain.com/contracts/${application._id}.pdf`;
    
    await application.completeAdoption(contractURL);

    res.json({
      success: true,
      data: { contractURL },
      message: 'Contract generated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getContract = async (req, res) => {
  try {
    const application = await AdoptionRequest.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (!application.contractURL) {
      return res.status(404).json({ 
        success: false, 
        error: 'Contract not generated yet' 
      });
    }

    res.json({
      success: true,
      data: { contractURL: application.contractURL }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getManagerReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = { isActive: true };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const stats = await AdoptionRequest.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const revenue = await AdoptionRequest.aggregate([
      { $match: { ...matchQuery, paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        statusStats: stats,
        totalRevenue: revenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getManagerPets,
  createPet,
  getPetById,
  updatePet,
  deletePet,
  getNewPetCode,
  getManagerApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  createPaymentOrder,
  verifyPayment,
  generateContract,
  getContract,
  getManagerReports,
  // CSV import endpoint: expects multipart/form-data with field name 'file'
  importPetsCSV: async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ success: false, error: 'CSV file is required (field name: file)' });
      }
      const rows = await parseCSVBuffer(req.file.buffer);
      if (!rows || rows.length === 0) {
        return res.status(400).json({ success: false, error: 'CSV appears empty' });
      }

      // Map CSV columns to model fields; support common header variants and handle BOM
      const normalize = (row, key) => {
        const candidates = [key, key.toLowerCase(), key.replace(/([A-Z])/g, '_$1').toLowerCase()];
        const found = Object.keys(row).find(k => {
          // Remove BOM (\uFEFF) and other invisible characters, then normalize
          const cleanKey = String(k).replace(/^\uFEFF/, '').replace(/^\ufeff/, '').trim().toLowerCase();
          return candidates.includes(cleanKey);
        });
        const value = found ? row[found] : undefined;
        return value ? String(value).trim() : undefined;
      };

      // Clean the row keys to remove BOM from the actual data
      const cleanedRows = rows.map(row => {
        const cleanedRow = {};
        Object.keys(row).forEach(key => {
          const cleanKey = key.replace(/^\uFEFF/, '').replace(/^\ufeff/, '').trim();
          cleanedRow[cleanKey] = row[key];
        });
        return cleanedRow;
      });

      // Debug: Add header information to help troubleshoot
      let debugInfo = '';
      if (cleanedRows.length > 0) {
        const originalHeaders = Object.keys(rows[0]);
        const cleanedHeaders = Object.keys(cleanedRows[0]);
        debugInfo = `Original headers: [${originalHeaders.map(h => `"${h}"`).join(', ')}] | Cleaned headers: [${cleanedHeaders.join(', ')}]`;
        console.log('CSV Debug:', debugInfo);
      }

      const results = {
        totalRows: cleanedRows.length,
        successful: [],
        failed: [],
        warnings: []
      };

      // Process each row individually with detailed error handling
      for (let i = 0; i < cleanedRows.length; i++) {
        const row = cleanedRows[i];
        const rowNumber = i + 2; // +2 because CSV row 1 is headers, and we're 0-indexed
        
        try {
          // Extract and validate required fields
          const name = normalize(row, 'name');
          const breed = normalize(row, 'breed');
          const species = normalize(row, 'species') || normalize(row, 'type');
          
          // Check for required fields
          const missingFields = [];
          if (!name) missingFields.push('name');
          if (!breed) missingFields.push('breed');
          if (!species) missingFields.push('species');
          
          if (missingFields.length > 0) {
            results.failed.push({
              row: rowNumber,
              data: row,
              reason: `Missing required fields: ${missingFields.join(', ')}`,
              error: 'MISSING_REQUIRED_FIELDS'
            });
            continue;
          }

          // Process optional fields with smart defaults and validation
          const processedData = {
            name,
            breed,
            species,
            createdBy: req.user.id,
            images: [],
            status: 'available'
          };

          // Age handling
          const ageValue = normalize(row, 'age');
          if (ageValue) {
            const ageNum = Number(ageValue);
            if (!isNaN(ageNum) && ageNum >= 0) {
              processedData.age = ageNum;
            } else {
              results.warnings.push({
                row: rowNumber,
                field: 'age',
                value: ageValue,
                message: 'Invalid age value, defaulting to 0'
              });
              processedData.age = 0;
            }
          } else {
            processedData.age = 0;
          }

          // Age unit handling
          const ageUnitValue = normalize(row, 'ageUnit');
          if (ageUnitValue) {
            const ageUnitLower = ageUnitValue.toLowerCase();
            if (['months', 'years'].includes(ageUnitLower)) {
              processedData.ageUnit = ageUnitLower;
            } else {
              results.warnings.push({
                row: rowNumber,
                field: 'ageUnit',
                value: ageUnitValue,
                message: 'Invalid age unit, defaulting to months'
              });
              processedData.ageUnit = 'months';
            }
          } else {
            processedData.ageUnit = 'months';
          }

          // Gender handling
          const genderValue = normalize(row, 'gender');
          if (genderValue) {
            const genderLower = genderValue.toLowerCase();
            if (['male', 'female'].includes(genderLower)) {
              processedData.gender = genderLower;
            } else {
              results.warnings.push({
                row: rowNumber,
                field: 'gender',
                value: genderValue,
                message: 'Invalid gender, defaulting to male'
              });
              processedData.gender = 'male';
            }
          } else {
            processedData.gender = 'male';
          }

          // Color handling
          processedData.color = normalize(row, 'color') || 'unknown';

          // Weight handling
          const weightValue = normalize(row, 'weight');
          if (weightValue) {
            const weightNum = Number(weightValue);
            if (!isNaN(weightNum) && weightNum >= 0) {
              processedData.weight = weightNum;
            } else {
              results.warnings.push({
                row: rowNumber,
                field: 'weight',
                value: weightValue,
                message: 'Invalid weight value, defaulting to 0'
              });
              processedData.weight = 0;
            }
          } else {
            processedData.weight = 0;
          }

          // Health status handling
          const healthStatusValue = normalize(row, 'healthStatus');
          if (healthStatusValue) {
            const healthStatusLower = healthStatusValue.toLowerCase();
            if (['excellent', 'good', 'fair', 'needs_attention'].includes(healthStatusLower)) {
              processedData.healthStatus = healthStatusLower;
            } else {
              results.warnings.push({
                row: rowNumber,
                field: 'healthStatus',
                value: healthStatusValue,
                message: 'Invalid health status, defaulting to good'
              });
              processedData.healthStatus = 'good';
            }
          } else {
            processedData.healthStatus = 'good';
          }

          // Vaccination status handling
          const vaccinationStatusValue = normalize(row, 'vaccinationStatus');
          if (vaccinationStatusValue) {
            const vaccinationStatusLower = vaccinationStatusValue.toLowerCase();
            if (['up_to_date', 'partial', 'not_vaccinated'].includes(vaccinationStatusLower)) {
              processedData.vaccinationStatus = vaccinationStatusLower;
            } else {
              results.warnings.push({
                row: rowNumber,
                field: 'vaccinationStatus',
                value: vaccinationStatusValue,
                message: 'Invalid vaccination status, defaulting to not_vaccinated'
              });
              processedData.vaccinationStatus = 'not_vaccinated';
            }
          } else {
            processedData.vaccinationStatus = 'not_vaccinated';
          }

          // Temperament handling
          const temperamentValue = normalize(row, 'temperament');
          if (temperamentValue) {
            const temperamentLower = temperamentValue.toLowerCase();
            if (['calm', 'energetic', 'playful', 'shy', 'aggressive', 'friendly'].includes(temperamentLower)) {
              processedData.temperament = temperamentLower;
            } else {
              results.warnings.push({
                row: rowNumber,
                field: 'temperament',
                value: temperamentValue,
                message: 'Invalid temperament, defaulting to friendly'
              });
              processedData.temperament = 'friendly';
            }
          } else {
            processedData.temperament = 'friendly';
          }

          // Description handling
          processedData.description = normalize(row, 'description') || 'No description provided';

          // Adoption fee handling
          const adoptionFeeValue = normalize(row, 'adoptionFee');
          if (adoptionFeeValue) {
            const adoptionFeeNum = Number(adoptionFeeValue);
            if (!isNaN(adoptionFeeNum) && adoptionFeeNum >= 0) {
              processedData.adoptionFee = adoptionFeeNum;
            } else {
              results.warnings.push({
                row: rowNumber,
                field: 'adoptionFee',
                value: adoptionFeeValue,
                message: 'Invalid adoption fee, defaulting to 0'
              });
              processedData.adoptionFee = 0;
            }
          } else {
            processedData.adoptionFee = 0;
          }

          // Try to save the pet
          const pet = new AdoptionPet(processedData);
          const savedPet = await pet.save();
          
          results.successful.push({
            row: rowNumber,
            petId: savedPet._id,
            name: savedPet.name,
            breed: savedPet.breed,
            species: savedPet.species
          });

        } catch (error) {
          results.failed.push({
            row: rowNumber,
            data: row,
            reason: error.message,
            error: 'DATABASE_ERROR'
          });
        }
      }

      // Prepare response with detailed results
      const response = {
        success: true,
        message: `Import completed: ${results.successful.length} successful, ${results.failed.length} failed, ${results.warnings.length} warnings`,
        data: {
          totalRows: results.totalRows,
          successful: results.successful.length,
          failed: results.failed.length,
          warnings: results.warnings.length,
          debugInfo: debugInfo,
          detectedHeaders: cleanedRows.length > 0 ? Object.keys(cleanedRows[0]) : [],
          details: {
            successfulPets: results.successful,
            failedRows: results.failed,
            warnings: results.warnings
          }
        }
      };

      // Return appropriate status code
      if (results.successful.length === 0) {
        return res.status(400).json({
          ...response,
          success: false,
          message: 'No pets were successfully imported'
        });
      } else if (results.failed.length > 0) {
        return res.status(207).json(response); // 207 Multi-Status for partial success
      } else {
        return res.status(200).json(response);
      }

    } catch (error) {
      console.error('Import CSV error:', error);
      res.status(500).json({ success: false, error: 'Failed to import CSV: ' + error.message });
    }
  }
};
