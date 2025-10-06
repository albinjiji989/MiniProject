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
  } catch (err) {
    reject(err);
  }
});

// Special-case parser for poorly formatted stringified arrays/objects: extract URLs
const extractUrls = (text) => {
  if (typeof text !== 'string') return []
  const urls = []
  const re = /(https?:\/\/[^\s'"\]\)]+)/(g)
  let m
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(text)) !== null) {
    if (m[1]) urls.push(m[1])
  }
  return urls
}

// Coerce incoming value into array. Supports:
// - already-array
// - JSON string of array
// - JSON string of object
// - plain string URL (or extract first URL)
const ensureArray = (val) => {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    const s = val.trim()
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return parsed
      if (parsed && typeof parsed === 'object') return [parsed]
    } catch (_) {
      const urls = extractUrls(s)
      if (urls.length) return urls
      if (s) return [s]
    }
  }
  if (val && typeof val === 'object') return [val]
  return []
}

// Internal helper: transfer ownership after handover completion
async function transferOwnershipInternal(application) {
  try {
    const pet = await AdoptionPet.findById(application.petId)
    if (pet) {
      pet.status = 'adopted'
      pet.adopterUserId = application.userId
      pet.adoptionDate = new Date()
      await pet.save()
    }
    // Update centralized registry if available
    try {
      const PetRegistryService = require('../../../core/services/petRegistryService');
      await PetRegistryService.updateState({
        petCode: pet?.petCode,
        currentOwnerId: application.userId,
        currentLocation: 'at_owner',
        currentStatus: 'owned',
        actorUserId: application.userId,
        lastTransferAt: new Date()
      })
    } catch (_) {}
  } catch (err) {
    // Surface minimal info; do not throw to avoid blocking primary flow
    console.warn('Ownership transfer failed:', err?.message || err)
  }
}

// Manager Controllers
const getManagerPets = async (req, res) => {
  try {
    const rawPage = parseInt(req.query.page, 10)
    const rawLimit = parseInt(req.query.limit, 10)
    const page = Math.max(isNaN(rawPage) ? 1 : rawPage, 1)
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 10 : rawLimit, 1), 100)
    const { status, search, fields, lean } = req.query;
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

    // Projection
    let selectFields = '_id name breed species status ageDisplay petCode images age ageUnit'
    if (fields && typeof fields === 'string') {
      selectFields = fields.split(',').map(f => f.trim()).filter(Boolean).join(' ')
      if (!selectFields.includes('_id')) selectFields = `_id ${selectFields}`
      // Ensure raw age fields are present so we can compute ageDisplay for lean queries
      if (!selectFields.includes(' age ')) selectFields += ' age'
      if (!selectFields.includes(' ageUnit ')) selectFields += ' ageUnit'
    }

    let q = AdoptionPet.find(query)
      .select(selectFields)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)

    if (String(lean).toLowerCase() === 'true') q = q.lean()

    let pets = await q

    // If images included, trim to first for list if caller didn't explicitly request otherwise
    // Helper to compute age display when lean results don't include virtuals
    const computeAgeDisplay = (age, ageUnit) => {
      const n = Number(age) || 0
      switch (ageUnit) {
        case 'years':
          return `${n} year${n !== 1 ? 's' : ''}`
        case 'months': {
          const years = Math.floor(n / 12)
          const months = n % 12
          if (years > 0 && months > 0) return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`
          if (years > 0) return `${years} year${years !== 1 ? 's' : ''}`
          return `${months} month${months !== 1 ? 's' : ''}`
        }
        case 'weeks':
          return `${n} week${n !== 1 ? 's' : ''}`
        case 'days':
          return `${n} day${n !== 1 ? 's' : ''}`
        default:
          return `${n}`
      }
    }

    if (Array.isArray(pets)) {
      pets = pets.map(p => {
        if (p.images && Array.isArray(p.images)) {
          const first = p.images[0]
          const next = { ...p, images: first ? [first] : [] }
          // Backfill ageDisplay if missing (common when using lean queries)
          if (!next.ageDisplay && (next.age !== undefined || next.ageUnit !== undefined)) {
            next.ageDisplay = computeAgeDisplay(next.age, next.ageUnit)
          }
          return next
        }
        const next = { ...p }
        if (!next.ageDisplay && (next.age !== undefined || next.ageUnit !== undefined)) {
          next.ageDisplay = computeAgeDisplay(next.age, next.ageUnit)
        }
        return next
      })
    }

    const total = await AdoptionPet.countDocuments(query);

    res.json({
      success: true,
      data: {
        pets,
        pagination: {
          current: page,
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

// Helper: sanitize incoming images/documents so we never store base64 in DB
const sanitizeMedia = (input, isDocument = false) => {
  const arr = Array.isArray(input) ? input : []
  const out = []
  for (const item of arr) {
    const obj = typeof item === 'string' ? { url: item } : (item || {})
    const url = typeof obj.url === 'string' ? obj.url.trim() : ''
    // reject data URLs or excessively long inline values
    if (!url || url.startsWith('data:') || url.length > 1024) continue
    // allow only URLs/paths we serve (absolute http(s) or our /modules/* path)
    if (/^https?:\/\//i.test(url) || url.startsWith('/modules/')) {
      if (isDocument) {
        // For documents, include required fields
        out.push({ 
          url, 
          name: obj.name || url.split('/').pop() || 'document',
          type: obj.type || 'application/pdf',
          uploadedAt: obj.uploadedAt || new Date()
        })
      } else {
        // For images
        out.push({ url, caption: obj.caption || '', isPrimary: !!obj.isPrimary })
      }
    }
  }
  return out
}

const createPet = async (req, res) => {
  try {
    const petData = { ...req.body, createdBy: req.user.id };
    
    // Debug logging
    console.log('Raw documents received:', typeof req.body?.documents, req.body?.documents);
    
    // Enforce images/documents as URL paths only
    petData.images = sanitizeMedia(ensureArray(req.body?.images), false)
    petData.documents = sanitizeMedia(ensureArray(req.body?.documents), true)
    
    console.log('Processed documents:', petData.documents);
    console.log('AdoptionPet schema paths:', Object.keys(AdoptionPet.schema.paths));
    console.log('Documents schema:', AdoptionPet.schema.paths.documents);
    
    const pet = new AdoptionPet(petData);
    await pet.save();

    // Respond immediately to avoid blocking UI on downstream integrations
    res.status(201).json({
      success: true,
      data: pet,
      message: 'Pet added successfully'
    });

    // Fire-and-forget: Upsert centralized registry entry without blocking the response
    // Capture minimal data needed to avoid accessing mutated req/pet later
    const _petSnapshot = {
      id: pet._id,
      petCode: pet.petCode,
      name: pet.name,
      images: pet.images || [],
      speciesName: pet.species,
      breedName: pet.breed,
    }
    const _actorUserId = req.user.id

    setImmediate(async () => {
      try {
        const PetRegistryService = require('../../../core/services/petRegistryService');
        const Species = require('../../../core/models/Species');
        const Breed = require('../../../core/models/Breed');

        // AdoptionPet uses string names for species/breed, registry needs ObjectIds.
        const speciesDoc = await Species.findOne({ name: { $regex: new RegExp(`^${_petSnapshot.speciesName}$`, 'i') } });
        const breedDoc = await Breed.findOne({ name: { $regex: new RegExp(`^${_petSnapshot.breedName}$`, 'i') } });

        await PetRegistryService.upsertAndSetState({
          petCode: _petSnapshot.petCode,
          name: _petSnapshot.name,
          species: speciesDoc ? speciesDoc._id : undefined,
          breed: breedDoc ? breedDoc._id : undefined,
          images: _petSnapshot.images,
          source: 'adoption',
          adoptionPetId: _petSnapshot.id,
          actorUserId: _actorUserId,
        }, {
          currentLocation: 'at_adoption_center',
          currentStatus: 'available',
        });
      } catch (regErr) {
        console.warn('PetRegistry upsert failed (create adoption pet):', regErr?.message || regErr);
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getPetById = async (req, res) => {
  try {
    const { fields, lean } = req.query
    let selectFields = undefined
    if (fields && typeof fields === 'string') {
      selectFields = fields.split(',').map(f => f.trim()).filter(Boolean).join(' ')
      if (selectFields && !selectFields.includes('_id')) selectFields = `_id ${selectFields}`
    }
    let q = AdoptionPet.findById(req.params.id)
    if (selectFields) q = q.select(selectFields)
    q = q.populate('adopterUserId', 'name email phone').populate('createdBy', 'name email')
    if (String(lean).toLowerCase() === 'true') q = q.lean()

    const pet = await q

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    res.json({ success: true, data: pet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Media-only endpoint
const getPetMedia = async (req, res) => {
  try {
    const pet = await AdoptionPet.findById(req.params.id).select('_id images documents').lean()
    if (!pet) return res.status(404).json({ success: false, error: 'Pet not found' })
    res.json({ success: true, data: { images: pet.images || [], documents: pet.documents || [] } })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

const updatePet = async (req, res) => {
  try {
    const update = { ...req.body, updatedBy: req.user.id }
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'images')) {
      update.images = sanitizeMedia(ensureArray(req.body.images), false)
    }
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'documents')) {
      update.documents = sanitizeMedia(ensureArray(req.body.documents), true)
    }
    const pet = await AdoptionPet.findByIdAndUpdate(
      req.params.id,
      update,
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
    const { Types } = require('mongoose')
    const id = req.params.id
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid pet id' })
    }
    const pet = await AdoptionPet.findByIdAndUpdate(
      id,
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

// Bulk delete (soft-delete) pets by ids
const bulkDeletePets = async (req, res) => {
  try {
    const { ids } = req.body || {}
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids must be a non-empty array' })
    }
    const { Types } = require('mongoose')
    const validIds = ids.filter(id => Types.ObjectId.isValid(id))
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid ids provided' })
    }
    const result = await AdoptionPet.updateMany({ _id: { $in: validIds } }, { $set: { isActive: false } })
    return res.json({ success: true, data: { requested: ids.length, valid: validIds.length, modified: result.modifiedCount || result.nModified || 0 } })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

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

    // Manager-side document checklist enforcement
    const docCount = ((application.documents || []).length) || ((application.applicationData?.documents || []).length) || 0
    if (docCount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one applicant document (e.g., ID or address proof) is required before approval.'
      })
    }

    await application.approve(req.user.id, notes);

    // Reserve the pet
    const pet = await AdoptionPet.findById(application.petId);
    if (pet) {
      pet.reserve(application.userId);
      await pet.save();
    }

    // Send notification to user (safe guards)
    const user = await User.findById(application.userId);
    if (user) {
      const toEmail = typeof user.email === 'string' && user.email.includes('@') ? user.email : ''
      const subject = 'Adoption Application Approved'
      if (toEmail && subject) {
        try { await sendMail(toEmail, subject, `Your adoption application for ${pet?.name || 'the pet'} has been approved. Please proceed with payment.`) } catch (_) {}
      }
      if (typeof user.phone === 'string' && user.phone.trim()) {
        try { await sendSMS(user.phone, `Your adoption application for ${pet?.name || 'the pet'} has been approved. Please check your email for payment details.`) } catch (_) {}
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

    // Send notification to user (safe guards)
    const user = await User.findById(application.userId);
    if (user) {
      const toEmail = typeof user.email === 'string' && user.email.includes('@') ? user.email : ''
      const subject = 'Adoption Application Update'
      if (toEmail && subject) {
        try { await sendMail(toEmail, subject, `Your adoption application has been reviewed. Unfortunately, it was not approved at this time. Reason: ${reason || 'Not provided'}`) } catch (_) {}
      }
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

    // Update centralized registry to reflect new owner (adopter)
    try {
      const PetRegistryService = require('../../../core/services/petRegistryService');
      await PetRegistryService.updateState({
        petCode: pet?.petCode,
        currentOwnerId: application.userId,
        currentLocation: 'at_owner',
        currentStatus: 'owned',
        actorUserId: application.userId,
        lastTransferAt: new Date()
      });
    } catch (regErr) {
      console.warn('PetRegistry state sync failed (adoption complete):', regErr?.message || regErr);
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
    const application = await AdoptionRequest.findById(req.params.applicationId).populate('petId', 'name breed species').populate('userId', 'name email');
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.paymentStatus !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment must be completed before generating contract' 
      });
    }

    // Try to load pdfkit dynamically
    let PDFDocument
    try { PDFDocument = require('pdfkit') } catch (e) {
      return res.status(500).json({ success: false, error: 'PDF generator not available. Please install dependency: npm install pdfkit' })
    }
    const fs = require('fs')
    const path = require('path')

    // Prepare output directory
    const dir = path.join(__dirname, '..', 'uploads', 'documents', 'contracts')
    try { fs.mkdirSync(dir, { recursive: true }) } catch (_) {}
    const filename = `${String(application._id)}.pdf`
    const filePath = path.join(dir, filename)
    const fileUrl = `/modules/adoption/uploads/documents/contracts/${filename}`

    // Generate a simple PDF
    await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 })
        const stream = fs.createWriteStream(filePath)
        doc.pipe(stream)

        // Title
        doc.fontSize(20).text('Adoption Agreement / Certificate', { align: 'center' })
        doc.moveDown(1)
        doc.fontSize(12)
        // Body
        doc.text(`Certificate ID: ${application._id}`)
        doc.text(`Date: ${new Date().toLocaleDateString()}`)
        doc.moveDown(1)
        doc.text(`Adopter: ${application.userId?.name || 'Adopter'} (${application.userId?.email || ''})`)
        doc.text(`Pet: ${application.petId?.name || 'Pet'} — ${application.petId?.breed || ''} (${application.petId?.species || ''})`)
        doc.moveDown(1)
        doc.text('This certifies that the above-named adopter has completed the adoption of the pet described herein. All responsibilities and care for the pet are transferred to the adopter as of the date stated.', { align: 'left' })
        doc.moveDown(2)
        doc.text('Manager Signature: ___________________________', { continued: false })
        doc.moveDown(1)
        doc.text('Adopter Signature: ___________________________', { continued: false })
        doc.end()

        stream.on('finish', resolve)
        stream.on('error', reject)
      } catch (err) { reject(err) }
    })

    await application.completeAdoption(fileUrl);

    res.json({
      success: true,
      data: { contractURL: fileUrl },
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
  getPetMedia,
  updatePet,
  deletePet,
  getNewPetCode,
  uploadPetMedia: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
      const allowed = ['image/jpeg','image/png','image/webp','image/gif'];
      if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({ success: false, error: 'Only image files are allowed' });
      }
      const path = require('path');
      const fs = require('fs');
      const crypto = require('crypto');
      const extMap = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
      const filename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${extMap[req.file.mimetype] || ''}`;
      const uploadDir = path.join(__dirname, '..', 'uploads', 'images', 'pets', 'managers');
      try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (_) {}
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      const url = `/modules/adoption/uploads/images/pets/managers/${filename}`;
      return res.status(201).json({ success: true, data: { url, name: filename, type: req.file.mimetype } });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },
  uploadPetDocument: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
      const allowed = ['image/jpeg','image/png','image/webp','image/gif','application/pdf'];
      if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({ success: false, error: 'Only images or PDF files are allowed' });
      }
      const path = require('path');
      const fs = require('fs');
      const crypto = require('crypto');
      const extMap = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'application/pdf': '.pdf' };
      const filename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${extMap[req.file.mimetype] || ''}`;
      const uploadDir = path.join(__dirname, '..', 'uploads', 'documents', 'pets', 'managers');
      try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (_) {}
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      const url = `/modules/adoption/uploads/documents/pets/managers/${filename}`;
      return res.status(201).json({ success: true, data: { url, name: filename, type: req.file.mimetype } });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },
  getManagerApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  patchApplicationStatus: async (req, res) => {
    try {
      const { status, notes, reason } = req.body || {};
      if (!status) {
        return res.status(400).json({ success: false, error: 'status is required' });
      }
      if (!['approved', 'rejected'].includes(String(status).toLowerCase())) {
        return res.status(400).json({ success: false, error: 'Only approved/rejected supported via PATCH' });
      }
      if (String(status).toLowerCase() === 'approved') {
        return await approveApplication(req, res);
      } else {
        req.body.reason = reason || req.body.reason || 'Not specified';
        req.body.notes = notes || req.body.notes || '';
        return await rejectApplication(req, res);
      }
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
  createPaymentOrder,
  verifyPayment,
  generateContract,
  getContract,
  getManagerReports,
  bulkDeletePets,
 


  // Handover: schedule/update/complete
  scheduleHandover: async (req, res) => {
    try {
      const { id } = req.params
      const { method = 'pickup', scheduledAt, location = {}, notes = '' } = req.body || {}
      const app = await AdoptionRequest.findById(id)
      if (!app) return res.status(404).json({ success: false, error: 'Application not found' })
      // Require certificate generated or at least contract present
      if (!app.contractURL) {
        return res.status(400).json({ success: false, error: 'Generate contract/certificate before scheduling handover' })
      }
      app.handover = app.handover || {}
      app.handover.method = method
      app.handover.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
      app.handover.location = {
        address: location?.address || app.handover?.location?.address || '',
        lat: location?.lat ?? app.handover?.location?.lat,
        lng: location?.lng ?? app.handover?.location?.lng,
      }
      app.handover.notes = notes
      await app.setHandoverStatus('scheduled', 'Handover scheduled')
      await app.save()
      // Notify user (best-effort)
      try {
        let toEmail = ''
        if (app?.userId && typeof app.userId === 'object' && app.userId.email) {
          toEmail = app.userId.email
        } else if (app?.userId) {
          const u = await User.findById(app.userId).select('email name')
          toEmail = (u && typeof u.email === 'string') ? u.email : ''
        }
        let petName = ''
        if (app?.petId && typeof app.petId === 'object' && app.petId.name) {
          petName = app.petId.name
        } else if (app?.petId) {
          const p = await AdoptionPet.findById(app.petId).select('name')
          petName = p?.name || ''
        }
        const subject = 'Adoption Handover Scheduled'
        const scheduled = app.handover?.scheduledAt ? new Date(app.handover.scheduledAt).toLocaleString() : 'soon'
        const address = app.handover?.location?.address || 'designated location'
        const message = `Hello${app.userId?.name ? ' ' + app.userId.name : ''}, your handover for ${petName || 'your adopted pet'} is scheduled on ${scheduled} at ${address}.`
        if (toEmail && subject) { try { await sendMail(toEmail, subject, message) } catch (_) {} }
      } catch (_) {}
      return res.json({ success: true, data: app.handover })
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message })
    }
  },
  updateHandover: async (req, res) => {
    try {
      const { id } = req.params
      const { method, scheduledAt, location, notes } = req.body || {}
      const app = await AdoptionRequest.findById(id)
      if (!app) return res.status(404).json({ success: false, error: 'Application not found' })
      if (!app.handover || app.handover.status === 'none') {
        return res.status(400).json({ success: false, error: 'Handover not scheduled' })
      }
      if (method) app.handover.method = method
      if (scheduledAt) app.handover.scheduledAt = new Date(scheduledAt)
      if (location) {
        app.handover.location = {
          address: location?.address || app.handover?.location?.address || '',
          lat: location?.lat ?? app.handover?.location?.lat,
          lng: location?.lng ?? app.handover?.location?.lng,
        }
      }
      if (typeof notes === 'string') app.handover.notes = notes
      await app.save()
      return res.json({ success: true, data: app.handover })
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message })
    }
  },
  completeHandover: async (req, res) => {
    try {
      const { id } = req.params
      const { proofDocs } = req.body || {}
      const app = await AdoptionRequest.findById(id)
      if (!app) return res.status(404).json({ success: false, error: 'Application not found' })
      if (!app.handover || app.handover.status !== 'scheduled') {
        return res.status(400).json({ success: false, error: 'Handover is not scheduled' })
      }
      if (Array.isArray(proofDocs)) {
        app.handover.proofDocs = proofDocs.filter(Boolean)
      }
      app.handoverCompletedAt = new Date()
      await app.setHandoverStatus('completed', 'Handover completed')
      await transferOwnershipInternal(app)
      await app.save()
      // Notify user (best-effort)
      try {
        let toEmail = ''
        if (app?.userId && typeof app.userId === 'object' && app.userId.email) {
          toEmail = app.userId.email
        } else if (app?.userId) {
          const u = await User.findById(app.userId).select('email name')
          toEmail = (u && typeof u.email === 'string') ? u.email : ''
        }
        let petName = ''
        if (app?.petId && typeof app.petId === 'object' && app.petId.name) {
          petName = app.petId.name
        } else if (app?.petId) {
          const p = await AdoptionPet.findById(app.petId).select('name')
          petName = p?.name || ''
        }
        const subject = 'Adoption Handover Completed'
        const message = `Congratulations${app.userId?.name ? ' ' + app.userId.name : ''}! Handover for ${petName || 'your pet'} is completed. Your certificate is available in your dashboard.`
        if (toEmail && subject) { try { await sendMail(toEmail, subject, message) } catch (_) {} }
      } catch (_) {}
      return res.json({ success: true, message: 'Handover completed and ownership transferred' })
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message })
    }
  },
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
