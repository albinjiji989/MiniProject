const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('=== Certificate Controller Test ===\n');

try {
  // Load PDFKit
  const PDFDocument = require('pdfkit');
  console.log('✓ PDFKit loaded successfully');
  
  // Test the same path logic as the certificate controller
  const dir = path.join(__dirname, 'backend', 'uploads', 'adoption', 'manager', 'certificate');
  console.log('Certificate directory path:', dir);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('✓ Certificate directory created');
  } else {
    console.log('✓ Certificate directory exists');
  }
  
  // Test if directory is writable
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    console.log('✓ Certificate directory is writable');
  } catch (err) {
    console.log('✗ Certificate directory is not writable:', err.message);
    process.exit(1);
  }
  
  // Generate test certificate
  const applicationId = 'test-application-id';
  const timestamp = new Date().getTime();
  const randomHash = crypto.randomBytes(8).toString('hex');
  const filename = `${applicationId}_${timestamp}_${randomHash}_certificate.pdf`;
  const filePath = path.join(dir, filename);
  const fileUrl = `/uploads/adoption/manager/certificate/${filename}`;
  
  console.log('Test certificate file path:', filePath);
  console.log('Test certificate file URL:', fileUrl);
  
  // Generate PDF
  console.log('Generating test certificate PDF...');
  
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  
  // Header
  doc.fontSize(24).text('PET ADOPTION CERTIFICATE', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(14).text('This certifies that', { align: 'center' });
  doc.moveDown(1);
  
  // Adopter information
  doc.fontSize(20).text('Test Adopter', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(14).text('has successfully completed the adoption of', { align: 'center' });
  doc.moveDown(1);
  
  // Pet information
  doc.fontSize(18).text('Test Pet', { align: 'center' });
  doc.fontSize(14).text('Test Breed (Test Species)', { align: 'center' });
  doc.moveDown(2);
  
  // Details
  doc.fontSize(12);
  doc.text(`Certificate ID: ${applicationId}`, { align: 'left' });
  doc.text(`Adoption Date: ${new Date().toLocaleDateString()}`, { align: 'left' });
  doc.text('Adopter Email: test@example.com', { align: 'left' });
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
  
  stream.on('finish', () => {
    console.log('✓ Certificate PDF generated successfully');
    
    // Verify file was created
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log('✓ Certificate file exists');
      console.log('  File size:', stats.size, 'bytes');
      
      // Test reading the file
      try {
        const fileContent = fs.readFileSync(filePath);
        console.log('✓ Certificate file is readable');
        console.log('  File content size:', fileContent.length, 'bytes');
        
        // Clean up test file
        fs.unlinkSync(filePath);
        console.log('✓ Test certificate file cleaned up');
        
        console.log('\n=== Certificate Controller Test Complete ===');
        console.log('The certificate generation should now work correctly!');
      } catch (err) {
        console.log('✗ Error reading certificate file:', err.message);
      }
    } else {
      console.log('✗ Certificate file was not created');
    }
  });
  
  stream.on('error', (err) => {
    console.log('✗ Error generating certificate PDF:', err.message);
  });
  
} catch (err) {
  console.log('✗ Error in certificate controller test:', err.message);
}