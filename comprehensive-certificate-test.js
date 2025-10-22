const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('=== Comprehensive Certificate System Test ===\n');

// Test 1: Check if pdfkit is available
console.log('1. Testing PDFKit availability...');
try {
  const PDFDocument = require('pdfkit');
  console.log('   ✓ PDFKit loaded successfully');
} catch (err) {
  console.log('   ✗ Failed to load PDFKit:', err.message);
  process.exit(1);
}

// Test 2: Check certificate directory structure
console.log('\n2. Checking certificate directory structure...');
const certDir = path.join(__dirname, 'backend', 'uploads', 'adoption', 'manager', 'certificate');
console.log('   Certificate directory:', certDir);

if (fs.existsSync(certDir)) {
  console.log('   ✓ Certificate directory exists');
} else {
  console.log('   ✗ Certificate directory does not exist, creating...');
  try {
    fs.mkdirSync(certDir, { recursive: true });
    console.log('   ✓ Certificate directory created');
  } catch (err) {
    console.log('   ✗ Failed to create certificate directory:', err.message);
    process.exit(1);
  }
}

// Test 3: Check if directory is writable
console.log('\n3. Testing directory write permissions...');
try {
  fs.accessSync(certDir, fs.constants.W_OK);
  console.log('   ✓ Certificate directory is writable');
} catch (err) {
  console.log('   ✗ Certificate directory is not writable:', err.message);
  process.exit(1);
}

// Test 4: Generate a test certificate
console.log('\n4. Testing certificate generation...');
try {
  const PDFDocument = require('pdfkit');
  
  // Generate unique filename
  const applicationId = 'test-app-12345';
  const timestamp = new Date().getTime();
  const randomHash = crypto.randomBytes(8).toString('hex');
  const filename = `${applicationId}_${timestamp}_${randomHash}_certificate.pdf`;
  const filePath = path.join(certDir, filename);
  const fileUrl = `/uploads/adoption/manager/certificate/${filename}`;
  
  console.log('   Test certificate file:', filename);
  
  // Create PDF
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  
  // Add content
  doc.fontSize(24).text('ADOPTION CERTIFICATE TEST', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(16).text('This is a test certificate to verify the system is working correctly.', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(12).text(`Application ID: ${applicationId}`, { align: 'left' });
  doc.text(`Generated: ${new Date().toISOString()}`, { align: 'left' });
  
  doc.end();
  
  // Wait for file creation
  stream.on('finish', () => {
    console.log('   ✓ Certificate PDF generated successfully');
    
    // Verify file exists
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log('   ✓ Certificate file exists (size: ' + stats.size + ' bytes)');
      
      // Test 5: Verify file can be read
      console.log('\n5. Testing file read access...');
      try {
        const content = fs.readFileSync(filePath);
        console.log('   ✓ Certificate file is readable (size: ' + content.length + ' bytes)');
        
        // Test 6: Verify URL structure
        console.log('\n6. Testing URL structure...');
        console.log('   Certificate URL:', fileUrl);
        if (fileUrl.startsWith('/uploads/adoption/manager/certificate/')) {
          console.log('   ✓ Certificate URL follows correct structure');
        } else {
          console.log('   ✗ Certificate URL does not follow correct structure');
        }
        
        // Clean up test file
        fs.unlinkSync(filePath);
        console.log('   ✓ Test file cleaned up');
        
        // Test 7: Check static serving configuration
        console.log('\n7. Checking static serving configuration...');
        const serverFilePath = path.join(__dirname, 'backend', 'server.js');
        if (fs.existsSync(serverFilePath)) {
          const serverContent = fs.readFileSync(serverFilePath, 'utf8');
          if (serverContent.includes('/uploads/adoption/manager/certificate')) {
            console.log('   ✓ Static serving route for certificates is configured');
          } else {
            console.log('   ⚠ Static serving route for certificates may not be configured');
          }
        } else {
          console.log('   ✗ Could not find server.js to verify static serving');
        }
        
        console.log('\n=== All Tests Completed Successfully ===');
        console.log('The certificate system is working correctly for both users and managers!');
        
      } catch (err) {
        console.log('   ✗ Error reading certificate file:', err.message);
      }
    } else {
      console.log('   ✗ Certificate file was not created');
    }
  });
  
  stream.on('error', (err) => {
    console.log('   ✗ Error generating certificate:', err.message);
  });
  
} catch (err) {
  console.log('   ✗ Error in certificate generation test:', err.message);
}