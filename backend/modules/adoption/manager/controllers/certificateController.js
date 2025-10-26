const AdoptionRequest = require('../models/AdoptionRequest');
const AdoptionPet = require('../models/AdoptionPet');
const AdoptionCertificate = require('../models/AdoptionCertificate');
const { sendMail } = require('../../../../core/utils/email');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

// POST /adoption/certificates (manager)
async function generateCertificate(req, res) {
  try {
    const { applicationId, agreementFile } = req.body;
    if (!applicationId) return res.status(400).json({ success: false, error: 'applicationId is required' });

    const application = await AdoptionRequest.findById(applicationId)
      .populate('userId', 'name email')
      .populate('petId', 'name breed species');
    if (!application) return res.status(404).json({ success: false, error: 'Application not found' });

    // Debug logging
    console.log('Certificate generation request:', { 
      applicationId, 
      applicationStatus: application.status,
      paymentStatus: application.paymentStatus
    });

    // Ensure payment completed - this is the key requirement for certificate generation
    // Allow certificate generation for any application that has completed payment, 
    // regardless of its current status in the adoption flow
    if (application.paymentStatus !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: `Payment must be completed before certificate generation. Current payment status: ${application.paymentStatus}` 
      });
    }

    const pet = await AdoptionPet.findById(application.petId);
    if (!pet) return res.status(404).json({ success: false, error: 'Pet not found' });

    // Try to load pdfkit dynamically to generate PDF certificate
    let PDFDocument;
    try {
      PDFDocument = require('pdfkit');
    } catch (e) {
      return res.status(500).json({ 
        success: false, 
        error: 'PDF generator not available. Please install dependency: npm install pdfkit' 
      });
    }

    // Generate unique filename with timestamp and hash
    const timestamp = new Date().getTime();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const filename = `${application._id}_${timestamp}_${randomHash}_certificate.pdf`;
    
    // Generate a professional PDF certificate in memory
    let pdfBuffer;
    await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          pdfBuffer = Buffer.concat(chunks);
          resolve();
        });
        doc.on('error', reject);

        // Header
        doc.fontSize(24).text('PET ADOPTION CERTIFICATE', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(14).text('This certifies that', { align: 'center' });
        doc.moveDown(1);

        // Adopter information
        doc.fontSize(20).text(`${application.userId?.name || 'Adopter'}`, { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(14).text('has successfully completed the adoption of', { align: 'center' });
        doc.moveDown(1);

        // Pet information
        doc.fontSize(18).text(`${application.petId?.name || 'Pet'}`, { align: 'center' });
        doc.fontSize(14).text(`${application.petId?.breed || ''} (${application.petId?.species || ''})`, { align: 'center' });
        doc.moveDown(2);

        // Details
        doc.fontSize(12);
        doc.text(`Certificate ID: ${application._id}`, { align: 'left' });
        doc.text(`Adoption Date: ${new Date().toLocaleDateString()}`, { align: 'left' });
        doc.text(`Adopter Email: ${application.userId?.email || ''}`, { align: 'left' });
        doc.moveDown(2);

        // Commitment section
        doc.text('By signing this certificate, the adopter agrees to provide proper care, nutrition, and veterinary attention to the pet. The adopter understands their responsibility as a pet owner and commits to providing a loving, permanent home.', {
          align: 'left',
          width: 400
        });
        doc.moveDown(3);

        // Signatures
        doc.text('Manager Signature: ________________________', { continued: true });
        doc.text('                 Date: ____________', { align: 'right' });
        doc.moveDown(2);
        doc.text('Adopter Signature: ________________________', { continued: true });
        doc.text('                 Date: ____________', { align: 'right' });

        // Footer
        doc.moveDown(3);
        doc.fontSize(10).text('Issued by Pet Welfare Organization', { align: 'center' });
        doc.text('Contact: info@petwelfare.org | Phone: +91-9876543210', { align: 'center' });

        doc.end();
      } catch (err) { 
        console.error('Certificate PDF generation exception:', err);
        reject(err); 
      }
    });

    // Upload PDF to Cloudinary
    const base64Data = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    
    // Upload to Cloudinary as raw file
    const cloudinaryResult = await cloudinary.uploader.upload(base64Data, {
      folder: 'adoption/manager/certificates',
      public_id: filename.replace('.pdf', ''),
      overwrite: false,
      resource_type: 'raw',
      format: 'pdf'
    });
    
    const fileUrl = cloudinaryResult.secure_url;
    
    console.log('Certificate uploaded to Cloudinary:', fileUrl);

    // Create or upsert certificate for this application
    let certificate = await AdoptionCertificate.findOne({ applicationId: application._id });
    if (!certificate) {
      certificate = new AdoptionCertificate({
        applicationId: application._id,
        petId: application.petId,
        userId: application.userId,
        adoptionDate: pet.adoptionDate || new Date(),
        agreementFile: fileUrl,
        signedByManager: req.user.id,
        signedByUser: application.userId
      });
    } else {
      // update values
      certificate.agreementFile = fileUrl;
      certificate.signedByManager = req.user.id;
      certificate.adoptionDate = certificate.adoptionDate || pet.adoptionDate || new Date();
    }

    await certificate.save();

    // Store URL on application
    application.contractURL = fileUrl;
    application.contractGeneratedAt = new Date();
    if (application.status !== 'completed') {
      await application.updateStatus('completed', req.user.id, 'Certificate generated and adoption completed');
    } else {
      await application.save();
    }

    // Optional notify adopter
    try {
      await sendMail({
        to: application?.email || '', 
        subject: 'Adoption Certificate Ready', 
        html: `
          <h2>Adoption Certificate Ready</h2>
          <p>Hello ${application.userId?.name || 'Adopter'},</p>
          <p>Your adoption certificate for ${application.petId?.name || 'your pet'} is now ready for download.</p>
          <p>You can download it from your adoption applications page.</p>
          <p>Thank you for choosing to adopt!</p>
        `
      });
    } catch (e) {
      console.warn('Failed to send certificate email:', e.message);
    }

    return res.status(201).json({ success: true, data: { certificate, fileUrl } });
  } catch (error) {
    console.error('Certificate generation error:', error);
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

    // For Cloudinary URLs, redirect to the direct URL
    if (fileUrl.includes('cloudinary.com')) {
      console.log('Redirecting to Cloudinary URL:', fileUrl);
      return res.redirect(fileUrl);
    }

    // If relative path (served by our server), stream from disk
    if (/^\//.test(fileUrl)) {
      const backendRoot = path.join(__dirname, '..', '..', '..', '..');
      // FIXED: Use correct path structure that matches where certificates are actually stored
      const diskPath = path.join(backendRoot, 'uploads', 'adoption', 'manager', 'certificate', path.basename(fileUrl));
      console.log('Manager certificate streaming - Backend root:', backendRoot);
      console.log('Manager certificate streaming - File URL:', fileUrl);
      console.log('Manager certificate streaming - File path:', diskPath);
      
      // Check if file exists at the expected path
      if (!fs.existsSync(diskPath)) {
        console.log('Manager certificate streaming - File not found at path:', diskPath);
        return res.status(404).json({ success: false, error: 'File not found' });
      }
      
      // File exists, stream it
      const filename = path.basename(diskPath) || 'certificate.pdf';
      const stat = fs.statSync(diskPath);
      const ext = path.extname(filename).toLowerCase();
      const contentType = ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', stat.size);
      const stream = fs.createReadStream(diskPath);
      stream.on('error', (err) => {
        console.error('Manager certificate streaming error:', err);
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
    console.error('Manager certificate streaming error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { 
  generateCertificate, 
  getCertificateByApplication,
  streamCertificateFile
};