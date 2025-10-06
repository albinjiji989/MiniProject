const AdoptionRequest = require('../models/AdoptionRequest');
const AdoptionPet = require('../models/AdoptionPet');
const AdoptionCertificate = require('../models/AdoptionCertificate');
const { sendMail } = require('../../../core/utils/email');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// POST /adoption/certificates (manager)
async function generateCertificate(req, res) {
  try {
    const { applicationId, agreementFile } = req.body;
    if (!applicationId) return res.status(400).json({ success: false, error: 'applicationId is required' });

    const application = await AdoptionRequest.findById(applicationId);
    if (!application) return res.status(404).json({ success: false, error: 'Application not found' });

    // Ensure payment completed and adoption completed in flow
    if (!['payment_completed', 'completed'].includes(application.status)) {
      return res.status(400).json({ success: false, error: 'Application must have completed payment before certificate generation' });
    }

    const pet = await AdoptionPet.findById(application.petId);
    if (!pet) return res.status(404).json({ success: false, error: 'Pet not found' });

    // Create or upsert certificate for this application
    let certificate = await AdoptionCertificate.findOne({ applicationId: application._id });
    if (!certificate) {
      certificate = new AdoptionCertificate({
        applicationId: application._id,
        petId: application.petId,
        userId: application.userId,
        adoptionDate: pet.adoptionDate || new Date(),
        agreementFile: agreementFile || application.contractURL || '',
        signedByManager: req.user.id,
        signedByUser: application.userId
    });
    } else {
      // update values
      certificate.agreementFile = agreementFile || certificate.agreementFile;
      certificate.signedByManager = req.user.id;
      certificate.adoptionDate = certificate.adoptionDate || pet.adoptionDate || new Date();
    }

    await certificate.save();

    // Store URL on application if provided
    if (agreementFile && !application.contractURL) {
      application.contractURL = agreementFile;
      application.contractGeneratedAt = new Date();
      if (application.status !== 'completed') {
        await application.updateStatus('completed', req.user.id, 'Certificate generated and adoption completed');
      } else {
        await application.save();
      }
    }

    // Optional notify adopter
    try {
      await sendMail?.(application?.email || '', 'Adoption Certificate Ready', 'Your adoption certificate is ready to download.');
    } catch (e) {}

    return res.status(201).json({ success: true, data: certificate });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// GET /adoption/certificates/:applicationId (owner or manager)
async function getCertificateByApplication(req, res) {
  try {
    const { applicationId } = req.params;
    const certificate = await AdoptionCertificate.findOne({ applicationId })
      .populate('petId', 'name breed species images')
      .populate('userId', 'name email');
    if (!certificate) return res.status(404).json({ success: false, error: 'Certificate not found' });

    // Access control: owner or adoption_manager/admin
    const isOwner = certificate.userId && certificate.userId._id?.toString() === req.user.id;
    const roles = (req.user.roles || [req.user.role]).filter(Boolean);
    const isPrivileged = roles.includes('adoption_manager') || roles.includes('admin');
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res.json({ success: true, data: certificate });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { generateCertificate, getCertificateByApplication };

// GET /adoption/certificates/:applicationId/file (owner or manager)
async function streamCertificateFile(req, res) {
  try {
    const { applicationId } = req.params;
    // Reuse the access control logic by fetching the certificate and comparing roles
    const certificate = await AdoptionCertificate.findOne({ applicationId })
      .populate('userId', 'name email');

    // Fallback to application contractURL if certificate not created yet
    let fileUrl = certificate?.agreementFile || null;
    if (!fileUrl) {
      const application = await AdoptionRequest.findById(applicationId).select('userId contractURL');
      if (!application) return res.status(404).json({ success: false, error: 'Application not found' });

      // Access control: owner or adoption_manager/admin
      const isOwner = application.userId && application.userId.toString() === req.user.id;
      const roles = (req.user.roles || [req.user.role]).filter(Boolean);
      const isPrivileged = roles.includes('adoption_manager') || roles.includes('admin');
      if (!isOwner && !isPrivileged) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      if (!application.contractURL) return res.status(404).json({ success: false, error: 'Certificate not found' });
      fileUrl = application.contractURL;
    } else {
      // Access control for certificate
      const isOwner = certificate.userId && certificate.userId._id?.toString() === req.user.id;
      const roles = (req.user.roles || [req.user.role]).filter(Boolean);
      const isPrivileged = roles.includes('adoption_manager') || roles.includes('admin');
      if (!isOwner && !isPrivileged) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
    }

    // If relative path (served by our server), stream from disk
    if (/^\//.test(fileUrl)) {
      const backendRoot = path.join(__dirname, '..', '..', '..');
      const diskPath = path.join(backendRoot, fileUrl.replace(/^\//, ''));
      if (!fs.existsSync(diskPath)) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }
      const filename = path.basename(diskPath) || 'certificate.pdf';
      const stat = fs.statSync(diskPath);
      const ext = path.extname(filename).toLowerCase();
      const contentType = ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', stat.size);
      const stream = fs.createReadStream(diskPath);
      stream.on('error', (err) => {
        try { res.destroy(err) } catch (_) {}
      });
      return stream.pipe(res);
    }

    // Otherwise, proxy-download external URL to avoid CORS
    const response = await axios.get(fileUrl, { responseType: 'stream', validateStatus: (s)=>s>=200 && s<400 });
    const contentType = response.headers['content-type'] || 'application/pdf';
    const disposition = response.headers['content-disposition'];
    const fallbackName = (new URL(fileUrl)).pathname.split('/').pop() || 'certificate.pdf';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', disposition || `inline; filename="${fallbackName}"`);
    response.data.pipe(res);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports.streamCertificateFile = streamCertificateFile;
