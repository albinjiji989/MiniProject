const AdoptionRequest = require('../../manager/models/AdoptionRequest');
const AdoptionCertificate = require('../../manager/models/AdoptionCertificate');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// GET /adoption/certificates/:applicationId/file (owner or manager)
async function streamCertificateFile(req, res) {
  try {
    const { applicationId } = req.params;
    
    // First, try to find the application to check ownership
    const application = await AdoptionRequest.findById(applicationId)
      .populate('userId', 'name email')
      .select('userId contractURL status');
      
    if (!application) {
      console.log('User certificate streaming - Application not found:', applicationId);
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Access control: owner or adoption_manager/admin
    const isOwner = application.userId && application.userId._id.toString() === req.user.id;
    const roles = (req.user.roles || [req.user.role]).filter(Boolean);
    const isPrivileged = roles.includes('adoption_manager') || roles.includes('admin');
    
    console.log('User certificate streaming - Access check:', { 
      userId: req.user.id, 
      ownerId: application.userId._id.toString(), 
      isOwner, 
      roles, 
      isPrivileged 
    });
    
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // Try to get certificate first
    let fileUrl = null;
    const certificate = await AdoptionCertificate.findOne({ applicationId })
      .select('agreementFile userId');
      
    if (certificate && certificate.agreementFile) {
      fileUrl = certificate.agreementFile;
    } else if (application.contractURL) {
      // Fallback to application contractURL
      fileUrl = application.contractURL;
    }

    if (!fileUrl) {
      console.log('User certificate streaming - Certificate not found for application:', applicationId);
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    console.log('User certificate streaming - File URL:', fileUrl);

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
      console.log('User certificate streaming - Backend root:', backendRoot);
      console.log('User certificate streaming - File URL:', fileUrl);
      console.log('User certificate streaming - File path:', diskPath);
      
      // Check if file exists at the expected path
      if (!fs.existsSync(diskPath)) {
        console.log('User certificate streaming - File not found at path:', diskPath);
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
        console.error('User certificate streaming error:', err);
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
    console.error('User certificate streaming error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { 
  streamCertificateFile
};