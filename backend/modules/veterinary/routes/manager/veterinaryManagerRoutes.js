const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorizeModule } = require('../../../../core/middleware/auth');
const storeController = require('../../manager/controllers/storeController');
const dashboardController = require('../../manager/controllers/dashboardController');
const staffController = require('../../manager/controllers/staffController');
const appointmentController = require('../../manager/controllers/appointmentController');
const serviceController = require('../../manager/controllers/serviceController');
const patientController = require('../../manager/controllers/patientController');
const medicalController = require('../../user/controllers/medicalRecordsController');
const veterinaryMedicalRecordController = require('../../manager/controllers/veterinaryMedicalRecordController');
const medicalRecordAttachmentController = require('../../manager/controllers/medicalRecordAttachmentController');
const veterinaryAppointmentController = require('../../manager/controllers/veterinaryAppointmentController');
const VeterinaryStaffInvite = require('../../manager/models/VeterinaryStaffInvite');
const { sendMail } = require('../../../../core/utils/email');
const User = require('../../../../core/models/User');
const UserDetails = require('../../../../core/models/UserDetails');

const router = express.Router();

const requireManager = [auth, authorizeModule('veterinary'), (req, res, next) => {
  const role = req.user?.role;
  const hasRole = Array.isArray(role)
    ? (role.includes('manager') || role.includes('veterinary_manager'))
    : (role === 'manager' || role === 'veterinary_manager');
  if (!hasRole) return res.status(403).json({ success: false, message: 'Manager access required' });
  next();
}];

// Allow veterinary workers to operate on medical records
const requireManagerOrWorker = [auth, authorizeModule('veterinary'), (req, res, next) => {
  const role = req.user?.role;
  const ok = Array.isArray(role)
    ? (role.includes('veterinary_manager') || role.includes('veterinary_worker') || role.includes('manager'))
    : (role === 'veterinary_manager' || role === 'veterinary_worker' || role === 'manager');
  if (!ok) return res.status(403).json({ success: false, message: 'Veterinary manager or staff required' });
  next();
}];

// Dashboard Stats
router.get('/dashboard/stats', requireManager, dashboardController.getDashboardStats);
// Removed conflicting route: router.get('/appointments', requireManager, dashboardController.getAppointments);
router.get('/records', requireManager, dashboardController.getMedicalRecords);
router.get('/services', requireManager, dashboardController.getServices);

// Appointments Management
router.post('/appointments', requireManager, [
  body('petId').notEmpty().withMessage('Pet ID is required'),
  body('ownerId').notEmpty().withMessage('Owner ID is required'),
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('timeSlot').notEmpty().withMessage('Time slot is required')
], veterinaryAppointmentController.createAppointment);

router.get('/appointments', requireManager, veterinaryAppointmentController.getAppointments);
router.get('/appointments/:id', requireManager, veterinaryAppointmentController.getAppointmentById);
router.put('/appointments/:id', requireManager, veterinaryAppointmentController.updateAppointment);
router.delete('/appointments/:id', requireManager, veterinaryAppointmentController.deleteAppointment);
router.get('/appointments/slots/available', requireManager, veterinaryAppointmentController.getAvailableTimeSlots);

// Services Management
router.post('/services', requireManager, [
  body('name').notEmpty().withMessage('Service name is required').isLength({ max: 100 }).withMessage('Service name must be less than 100 characters'),
  body('description').notEmpty().withMessage('Description is required').isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('category').optional().isIn(['examination', 'vaccination', 'surgery', 'grooming', 'dentistry', 'other']).withMessage('Invalid category')
], serviceController.createService);

router.get('/services', requireManager, serviceController.getServices);

router.put('/services/:id', requireManager, [
  body('name').optional().isLength({ max: 100 }).withMessage('Service name must be less than 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('category').optional().isIn(['examination', 'vaccination', 'surgery', 'grooming', 'dentistry', 'other']).withMessage('Invalid category')
], serviceController.updateService);

router.delete('/services/:id', requireManager, serviceController.deleteService);
router.patch('/services/:id/toggle', requireManager, serviceController.toggleServiceStatus);

// Patients Management
router.get('/patients', requireManager, patientController.getPatients);
router.get('/patients/:id', requireManager, patientController.getPatientDetails);

// Store setup
router.get('/me/store', requireManager, storeController.getMyStoreInfo);
router.put('/me/store', requireManager, [ body('storeName').optional().isString().isLength({ min: 3 }).withMessage('Store name must be at least 3 characters') ], storeController.updateMyStoreInfo);

// Staff (veterinary staff)
router.get('/staff', requireManager, staffController.listStaff);
router.post('/staff', requireManager, [ body('name').notEmpty().withMessage('Name is required'), body('email').isEmail().withMessage('Valid email is required'), body('phone').notEmpty().withMessage('Phone is required'), body('role').optional().isString().withMessage('Role must be a string') ], staffController.createStaff);
router.put('/staff/:id', requireManager, staffController.updateStaff);
router.delete('/staff/:id', requireManager, staffController.deleteStaff);

// Medical records (manager or staff)
router.post('/pets/:petId/medical-records', requireManagerOrWorker, [ body('visitDate').optional().isISO8601().withMessage('Valid visit date is required') ], medicalController.createRecord);
router.get('/pets/:petId/medical-records', requireManagerOrWorker, medicalController.listRecordsForPet);

// Enhanced veterinary medical records
router.post('/medical-records', requireManagerOrWorker, [
  body('petId').notEmpty().withMessage('Pet ID is required'),
  body('visitDate').isISO8601().withMessage('Valid visit date is required'),
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('treatment').notEmpty().withMessage('Treatment is required')
], veterinaryMedicalRecordController.createMedicalRecord);

router.get('/medical-records/pet/:petId', requireManagerOrWorker, veterinaryMedicalRecordController.getMedicalRecordsByPet);
router.get('/medical-records/:id', requireManagerOrWorker, veterinaryMedicalRecordController.getMedicalRecordById);
router.put('/medical-records/:id', requireManagerOrWorker, veterinaryMedicalRecordController.updateMedicalRecord);
router.delete('/medical-records/:id', requireManagerOrWorker, veterinaryMedicalRecordController.deleteMedicalRecord);

// Medical record attachments
router.post('/medical-records/:recordId/attachments', requireManagerOrWorker, medicalRecordAttachmentController.uploadMedicalRecordAttachments);
router.get('/medical-records/:recordId/attachments', requireManagerOrWorker, medicalRecordAttachmentController.getMedicalRecordAttachments);

// Staff invite (OTP) and verify to create veterinary staff user with temp password
router.post('/staff/invite', requireManager, [ body('name').notEmpty().withMessage('Name is required'), body('email').isEmail().withMessage('Valid email is required'), body('phone').optional() ], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    const { name, email, phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await VeterinaryStaffInvite.updateMany({ email, storeId: req.user.storeId, verified: false }, { $set: { verified: true } });
    await VeterinaryStaffInvite.create({ email, name, phone, storeId: req.user.storeId, otp, expiresAt, invitedBy: req.user.id });
    await sendMail({ to: email, subject: 'Verify veterinary staff invitation', html: `Your code is <b>${otp}</b>. It expires in 10 minutes.` });
    res.json({ success: true, message: 'OTP sent to staff email' });
  } catch (e) {
    console.error('Vet staff invite error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/staff/verify', requireManager, [ body('email').isEmail().withMessage('Valid email is required'), body('otp').matches(/^\d{6}$/).withMessage('OTP must be 6 digits') ], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    const { email, otp } = req.body;
    const invite = await VeterinaryStaffInvite.findOne({ email, storeId: req.user.storeId, verified: false }).sort({ createdAt: -1 });
    if (!invite) return res.status(404).json({ success: false, message: 'Invitation not found' });
    if (invite.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'OTP expired' });
    if (invite.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    // Create veterinary staff login user with temp password
    const existingUser = await User.findOne({ email: invite.email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });
    const tempPassword = Math.random().toString(36).slice(-10) + '1A';
    const staffUser = new User({
      name: invite.name,
      email: invite.email,
      phone: invite.phone || '',
      password: tempPassword,
      role: 'veterinary_worker',
      authProvider: 'local',
      assignedModule: 'veterinary',
      mustChangePassword: true,
      storeId: req.user.storeId,
      storeName: req.user.storeName || ''
    });
    await staffUser.save();

    // Staff profile record
    const VeterinaryStaff = require('../../manager/models/VeterinaryStaff');
    const doc = await VeterinaryStaff.create({ name: invite.name, email: invite.email, phone: invite.phone, role: 'assistant', storeId: req.user.storeId, storeName: req.user.storeName, createdBy: req.user.id });

    // UserDetails for staff
    try { await new UserDetails({ userId: staffUser._id, assignedModule: 'veterinary', storeId: req.user.storeId, storeName: req.user.storeName, storeDetails: { status: 'active' } }).save(); } catch (_) {}

    invite.verified = true;
    await invite.save();

    // Email credentials
    try {
      const subject = 'Your veterinary staff account';
      const html = `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:24px;color:#e6e9ef;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);backdrop-filter: blur(10px); border-radius:16px; overflow:hidden;">
          <tr><td style=\"padding:28px;background:linear-gradient(135deg,#34d399,#0ea5ea);color:#fff;\"><h1 style=\"margin:0;font-size:20px;\">Your staff account is ready</h1></td></tr>
          <tr><td style=\"padding:24px 28px;\">Use these credentials to sign in; you'll be asked to change your password.</td></tr>
          <tr><td style=\"padding:0 28px 24px;\"><b>Email:</b> ${invite.email}<br/><b>Password:</b> ${tempPassword}</td></tr>
        </table></div>`;
      await sendMail({ to: invite.email, subject, html });
    } catch (_) {}

    res.status(201).json({ success: true, message: 'Staff verified and account created', data: { staff: doc, userId: staffUser.id } });
  } catch (e) {
    console.error('Vet staff verify error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;