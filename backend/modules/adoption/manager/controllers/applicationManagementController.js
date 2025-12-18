const AdoptionPet = require('../models/AdoptionPet');
const AdoptionRequest = require('../models/AdoptionRequest');
const User = require('../../../../core/models/User');
const paymentService = require('../../../../core/services/paymentService');
const { sendMail } = require('../../../../core/utils/email');
const { sendSMS } = require('../../../../core/utils/sms');

const getManagerApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { isActive: true };

    if (status) query.status = status;

    const applications = await AdoptionRequest.find(query)
      .populate('userId', 'name email phone')
      .populate('petId', 'name breed species age ageUnit ageDisplay gender adoptionFee healthStatus')
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
      .populate('petId', 'name breed species age ageUnit ageDisplay gender adoptionFee healthStatus images')
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
        try { await sendMail({to: toEmail, subject, html: `Your adoption application for ${pet?.name || 'the pet'} has been approved. Please proceed with payment.`}) } catch (_) {}
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
        try { await sendMail({to: toEmail, subject, html: `Your adoption application has been reviewed. Unfortunately, it was not approved at this time. Reason: ${reason || 'Not provided'}`}) } catch (_) {}
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

const patchApplicationStatus = async (req, res) => {
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
};

// Handover functions
// Schedule handover for adoption - improved with better validation
const scheduleHandover = async (req, res) => {
  try {
    const { id } = req.params
    const { scheduledAt, notes } = req.body || {}
    
    if (!scheduledAt) {
      return res.status(400).json({ success: false, error: 'Scheduled date/time is required' })
    }
    
    // Validate date format
    const scheduleDate = new Date(scheduledAt)
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date/time format' })
    }
    
    // Check that scheduled date is in the future
    const now = new Date()
    if (scheduleDate <= now) {
      return res.status(400).json({ success: false, error: 'Scheduled date must be in the future' })
    }
    
    // Check that scheduled date is within 30 days
    const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    if (scheduleDate > maxDate) {
      return res.status(400).json({ success: false, error: 'Scheduled date must be within 30 days' })
    }
    
    const app = await AdoptionRequest.findById(id)
    if (!app) return res.status(404).json({ success: false, error: 'Application not found' })
    
    // Verify application status
    if (app.status !== 'approved' && app.status !== 'completed' && app.status !== 'payment_completed') {
      return res.status(400).json({ success: false, error: 'Application must be approved before scheduling handover' })
    }
    
    // Verify payment status
    if (app.paymentStatus !== 'completed') {
      return res.status(400).json({ success: false, error: 'Payment must be completed before scheduling handover' })
    }
    
    // Require certificate generated or at least contract present
    if (!app.contractURL) {
      return res.status(400).json({ success: false, error: 'Generate contract/certificate before scheduling handover' })
    }
    
    // For adoption center pickup only - fixed location
    const adoptionCenterLocation = {
      address: 'Adoption Center - Main Branch, 123 Pet Welfare Road, Animal City',
      name: 'Pet Adoption Center',
      phone: '+91-9876543210'
    }
    
    app.handover = app.handover || {}
    app.handover.method = 'pickup' // Only pickup at adoption center
    app.handover.scheduledAt = scheduleDate
    app.handover.location = adoptionCenterLocation
    app.handover.notes = notes || ''
    app.handover.status = 'scheduled' // Add this line to properly set the status
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString() // 6-digit OTP
    app.handover.otp = newOTP
    
    // Store new OTP in history
    if (!app.handover.otpHistory) app.handover.otpHistory = []
    app.handover.otpHistory.push({
      otp: newOTP,
      generatedAt: new Date(),
      used: false
    })
    
    // Limit OTP history to prevent excessive growth
    if (app.handover.otpHistory.length > 10) {
      // Keep only the most recent 10 entries
      app.handover.otpHistory = app.handover.otpHistory.slice(-10)
    }
    
    await app.save()
    
    // Notify user with handover details and OTP
    let emailSent = false
    let emailError = null
    try {
      let toEmail = ''
      if (app?.userId && typeof app.userId === 'object' && app.userId.email) {
        // If userId is already populated with user object
        toEmail = typeof app.userId.email === 'string' && app.userId.email.includes('@') ? app.userId.email : ''
      } else if (app?.userId) {
        // If userId is just an ID, fetch the user
        const u = await User.findById(app.userId).select('email name')
        toEmail = (u && typeof u.email === 'string' && u.email.includes('@')) ? u.email : ''
      }
      let petName = ''
      if (app?.petId && typeof app.petId === 'object' && app.petId.name) {
        petName = app.petId.name
      } else if (app?.petId) {
        const p = await AdoptionPet.findById(app.petId).select('name')
        petName = p?.name || ''
      }
      const subject = 'Adoption Handover Scheduled - OTP Required'
      const scheduled = app.handover?.scheduledAt ? new Date(app.handover.scheduledAt).toLocaleString() : 'soon'
      const message = `Hello${app.userId?.name ? ' ' + app.userId.name : ''}, 
      
Your handover for ${petName || 'your adopted pet'} is scheduled on ${scheduled} at our adoption center.
Location: ${adoptionCenterLocation.address}

IMPORTANT: You must present this OTP code when picking up your pet: ${app.handover.otp}

Please arrive 15 minutes before your scheduled time. No pets will be released without the correct OTP.

Thank you,
Pet Adoption Center`
      if (toEmail && subject) { 
        try { 
          await sendMail({to: toEmail, subject, html: message}) 
          emailSent = true
        } catch (err) {
          emailError = err.message
          console.error('[EMAIL] Failed to send handover email:', err)
        }
      }
    } catch (err) {
      emailError = err.message
      console.error('[EMAIL] Error preparing handover email:', err)
    }
    
    const response = { 
      success: true, 
      data: { ...app.handover, otp: undefined },
      message: emailSent 
        ? 'Handover scheduled and OTP sent to adopter\'s email' 
        : `Handover scheduled${emailError ? ` but email failed to send: ${emailError}` : ' but email could not be sent (no email address found)'}` 
    }
    
    // Add email error info if there was one
    if (emailError) {
      response.emailError = emailError
    }
    
    return res.json(response)
  } catch (e) {
    console.error('[HANDOVER] Error scheduling handover:', e)
    return res.status(500).json({ success: false, error: e.message })
  }
}

// Complete handover with improved OTP verification
const completeHandover = async (req, res) => {
  try {
    const { id } = req.params
    const { otp, proofDocs } = req.body || {}
    const app = await AdoptionRequest.findById(id)
    if (!app) return res.status(404).json({ success: false, error: 'Application not found' })
    if (!app.handover || app.handover.status !== 'scheduled') {
      return res.status(400).json({ success: false, error: 'Handover is not scheduled' })
    }
    
    // Verify OTP with better error handling
    if (!otp) {
      return res.status(400).json({ success: false, error: 'OTP is required' })
    }
    
    if (typeof otp !== 'string' || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, error: 'Invalid OTP format. Must be a 6-digit number.' })
    }
    
    // Enhanced OTP validation - check both current OTP and OTP history
    let isValidOTP = false;
    let otpEntry = null;
    
    // Check current OTP field
    if (app.handover.otp && app.handover.otp === otp) {
      isValidOTP = true;
    }
    
    // Check OTP history if current OTP doesn't match
    if (!isValidOTP && app.handover.otpHistory && Array.isArray(app.handover.otpHistory)) {
      // Find the OTP entry that matches and hasn't been used
      otpEntry = app.handover.otpHistory.find(entry => 
        entry.otp === otp && 
        entry.used !== true &&
        // Check if OTP is not expired (7 days)
        (new Date() - new Date(entry.generatedAt)) / (1000 * 60 * 60 * 24) <= 7
      );
      
      if (otpEntry) {
        isValidOTP = true;
      }
    }
    
    if (!isValidOTP) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid OTP. Please provide the correct OTP sent to your email. If you cannot find it, use the "Regenerate OTP" button.' 
      });
    }
    
    // Check if OTP has expired (valid for 7 days)
    const scheduledTime = new Date(app.handover.scheduledAt);
    const now = new Date();
    const timeDiff = now - scheduledTime;
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      return res.status(400).json({ success: false, error: 'OTP has expired. Please contact the adoption manager to schedule a new handover.' });
    }
    
    // Mark OTP as used
    if (app.handover.otp && app.handover.otp === otp) {
      // Mark current OTP field as undefined
      app.handover.otp = undefined;
    }
    
    // Mark OTP history entry as used if we found it
    if (otpEntry) {
      otpEntry.used = true;
    }
    
    if (Array.isArray(proofDocs)) {
      app.handover.proofDocs = proofDocs.filter(Boolean);
    }
    app.handoverCompletedAt = new Date();
    await app.setHandoverStatus('completed', 'Handover completed with OTP verification');
    
    // Transfer ownership
    try {
      const pet = await AdoptionPet.findById(app.petId)
      if (pet) {
        pet.status = 'adopted'
        pet.adopterUserId = app.userId
        pet.adoptionDate = new Date()
        await pet.save()
        
        // Create core Pet for the adopter preserving petCode
        try {
          const User = require('../../../../core/models/User');
          const Pet = require('../../../../core/models/Pet');
          const PetDetails = require('../../../../core/models/PetDetails');
          const Species = require('../../../../core/models/Species');
          const Breed = require('../../../../core/models/Breed');
          const OwnershipHistory = require('../../../../core/models/OwnershipHistory');
          
          // Resolve species and breed IDs
          let speciesDoc = await Species.findOne({ $or: [ { displayName: pet.species }, { name: pet.species?.toLowerCase() } ] })
          if (!speciesDoc) {
            // fallback: create minimal species? Better: skip to avoid bad data
            throw new Error('Species not found for adopted pet')
          }
          const breedDoc = await Breed.findOne({ name: pet.breed, speciesId: speciesDoc._id })
          if (!breedDoc) {
            throw new Error('Breed not found for adopted pet')
          }

          const pd = await PetDetails.create({
            speciesId: speciesDoc._id,
            breedId: breedDoc._id,
            name: pet.name || 'Pet',
            description: pet.description || '',
            color: pet.color || 'Unknown',
            ageRange: { min: 0, max: 0 },
            weightRange: { min: 0, max: 0, unit: 'kg' },
            typicalLifespan: { min: 0, max: 0, unit: 'years' },
            vaccinationRequirements: [],
            careInstructions: {},
            temperament: Array.isArray(pet.temperament) ? pet.temperament : (pet.temperament ? [pet.temperament] : []),
            specialNeeds: Array.isArray(pet.specialNeeds) ? pet.specialNeeds : [],
            createdBy: app.userId,
          })

          const corePet = new Pet({
            name: pet.name || 'Pet',
            species: speciesDoc._id,
            breed: breedDoc._id,
            petDetails: pd._id,
            owner: app.userId,
            gender: (pet.gender || 'Unknown').toLowerCase() === 'male' ? 'Male' : (pet.gender || 'Unknown').toLowerCase() === 'female' ? 'Female' : 'Unknown',
            color: pet.color || 'Unknown',
            images: (pet.images || []).map(img => ({ url: img.url, caption: img.caption || '', isPrimary: !!img.isPrimary })),
            tags: ['adoption'],
            description: pet.description || '',
            createdBy: app.userId,
            // Preserve code from adoption pet
            petCode: pet.petCode,
            currentStatus: 'Adopted',
          })
          await corePet.save()

          // Centralized registry sync: identity + state
          try {
            const PetRegistryService = require('../../../../../core/services/petRegistryService')
            
            // Create/update registry with source tracking
            await PetRegistryService.upsertAndSetState({
              petCode: pet.petCode,
              name: pet.name || 'Pet',
              species: speciesDoc._id,
              breed: breedDoc._id,
              images: (pet.images || []).map(img => ({ url: img.url, caption: img.caption || '', isPrimary: !!img.isPrimary })),
              source: 'adoption',
              adoptionPetId: pet._id,
              actorUserId: app.userId,
              firstAddedSource: 'adoption_center',
              firstAddedBy: pet.createdBy // The adoption center manager who added it
            }, {
              currentOwnerId: app.userId,
              currentLocation: 'at_owner',
              currentStatus: 'adopted',
              lastTransferAt: new Date()
            })
            
            // Record ownership transfer in registry
            await PetRegistryService.recordOwnershipTransfer({
              petCode: pet.petCode,
              previousOwnerId: pet.createdBy,
              newOwnerId: app.userId,
              transferType: 'adoption',
              transferPrice: Number(app.paymentDetails?.amount || 0),
              transferReason: 'Pet Adoption',
              source: 'adoption',
              notes: 'Adoption completed successfully',
              performedBy: app.userId
            })
          } catch (regErr) {
            console.warn('PetRegistry sync failed (adoption complete):', regErr?.message || regErr)
          }

          // Ownership history entry
          try {
            await OwnershipHistory.create({
              pet: corePet._id,
              previousOwner: pet.createdBy || app.userId,
              newOwner: app.userId,
              transferType: 'Adoption',
              reason: 'Adopted via site',
              transferFee: { amount: Number(app.paymentDetails?.amount || 0), currency: app.paymentDetails?.currency || 'INR', paid: true, paymentMethod: 'Card' },
              createdBy: app.userId,
            })
          } catch (ohErr) {
            console.warn('Ownership history (adoption) create failed:', ohErr?.message)
          }
        } catch (x) {
          console.error('Create core Pet after adoption failed:', x?.message)
        }
      }
      // Update centralized registry if available
      try {
        const PetRegistryService = require('../../../../../core/services/petRegistryService');
        await PetRegistryService.updateState({
          petCode: pet?.petCode,
          currentOwnerId: app.userId,
          currentLocation: 'at_owner',
          currentStatus: 'owned',
          actorUserId: app.userId,
          lastTransferAt: new Date()
        })
      } catch (_) {}
    } catch (err) {
      // Surface minimal info; do not throw to avoid blocking primary flow
      console.warn('Ownership transfer failed:', err?.message || err)
    }
    
    await app.save()
    
    // Notify user
    try {
      let toEmail = ''
      if (app?.userId && typeof app.userId === 'object' && app.userId.email) {
        // If userId is already populated with user object
        toEmail = typeof app.userId.email === 'string' && app.userId.email.includes('@') ? app.userId.email : ''
      } else if (app?.userId) {
        // If userId is just an ID, fetch the user
        const u = await User.findById(app.userId).select('email name')
        toEmail = (u && typeof u.email === 'string' && u.email.includes('@')) ? u.email : ''
      }
      let petName = ''
      if (app?.petId && typeof app.petId === 'object' && app.petId.name) {
        petName = app.petId.name
      } else if (app?.petId) {
        const p = await AdoptionPet.findById(app.petId).select('name')
        petName = p?.name || ''
      }
      const subject = 'Adoption Handover Completed'
      const message = `Congratulations${app.userId?.name ? ' ' + app.userId.name : ''}! 
  
Handover for ${petName || 'your pet'} is completed. Your pet is now officially yours!
The pet will now appear in your dashboard under "My Pets".

Thank you for choosing our adoption center.

Best regards,
Pet Adoption Center`
      if (toEmail && subject) { try { await sendMail({to: toEmail, subject, html: message}) } catch (_) {} }
    } catch (_) {}
    return res.json({ success: true, message: 'Handover completed and ownership transferred' })
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message })
  }
}

// Regenerate OTP for handover
const regenerateHandoverOTP = async (req, res) => {
  try {
    const { id } = req.params
    const app = await AdoptionRequest.findById(id)
    
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' })
    }
    
    if (!app.handover || app.handover.status !== 'scheduled') {
      return res.status(400).json({ success: false, error: 'Handover is not scheduled' })
    }
    
    // Mark current OTP as used if it exists
    if (app.handover.otp) {
      // Add current OTP to history and mark as used
      if (!app.handover.otpHistory) app.handover.otpHistory = []
      app.handover.otpHistory.push({
        otp: app.handover.otp,
        generatedAt: new Date(),
        used: true // Mark as used since we're regenerating
      })
    }
    
    // Generate new 6-digit OTP
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString()
    app.handover.otp = newOTP
    
    // Store new OTP in history
    if (!app.handover.otpHistory) app.handover.otpHistory = []
    app.handover.otpHistory.push({
      otp: newOTP,
      generatedAt: new Date(),
      used: false
    })
    
    await app.save()
    
    // Notify user with new OTP
    let emailSent = false
    let emailError = null
    try {
      let toEmail = ''
      if (app?.userId && typeof app.userId === 'object' && app.userId.email) {
        // If userId is already populated with user object
        toEmail = typeof app.userId.email === 'string' && app.userId.email.includes('@') ? app.userId.email : ''
      } else if (app?.userId) {
        // If userId is just an ID, fetch the user
        const u = await User.findById(app.userId).select('email name')
        toEmail = (u && typeof u.email === 'string' && u.email.includes('@')) ? u.email : ''
      }
      
      let petName = ''
      if (app?.petId && typeof app.petId === 'object' && app.petId.name) {
        petName = app.petId.name
      } else if (app?.petId) {
        const p = await AdoptionPet.findById(app.petId).select('name')
        petName = p?.name || ''
      }
      
      const subject = 'Adoption Handover - New OTP'
      const scheduled = app.handover?.scheduledAt ? new Date(app.handover.scheduledAt).toLocaleString() : 'soon'
      const adoptionCenterLocation = {
        address: 'Adoption Center - Main Branch, 123 Pet Welfare Road, Animal City',
        name: 'Pet Adoption Center',
        phone: '+91-9876543210'
      }
      
      const message = `Hello${app.userId?.name ? ' ' + app.userId.name : ''}, 
      
A new OTP has been generated for your handover of ${petName || 'your adopted pet'} scheduled on ${scheduled} at our adoption center.
Location: ${adoptionCenterLocation.address}

IMPORTANT: You must present this OTP code when picking up your pet: ${newOTP}

Please arrive 15 minutes before your scheduled time. No pets will be released without the correct OTP.

Thank you,
Pet Adoption Center`
      
      if (toEmail && subject) { 
        try { 
          await sendMail({to: toEmail, subject, html: message})
          emailSent = true
        } catch (err) {
          emailError = err.message
          console.error('[EMAIL] Failed to send OTP email:', err)
        } 
      }
    } catch (err) {
      emailError = err.message
      console.error('[EMAIL] Error preparing OTP email:', err)
    }
    
    const message = emailSent 
      ? 'New OTP generated and sent to the adopter\'s email' 
      : `New OTP generated${emailError ? ` but email failed to send: ${emailError}` : ' but email could not be sent (no email address found)'}`;
      
    const response = { 
      success: true, 
      message,
      emailSent
    }
    
    // Add email error info if there was one
    if (emailError) {
      response.emailError = emailError
    }
    
    return res.json(response)
  } catch (e) {
    console.error('[OTP] Error regenerating OTP:', e)
    return res.status(500).json({ success: false, error: e.message })
  }
}

module.exports = {
  getManagerApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  patchApplicationStatus,
  scheduleHandover,
  completeHandover,
  regenerateHandoverOTP
};