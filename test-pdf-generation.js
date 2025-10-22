const fs = require('fs');
const path = require('path');

console.log('=== PDF Generation Test ===\n');

// Try to load PDFKit
try {
  const PDFDocument = require('pdfkit');
  console.log('✓ PDFKit loaded successfully');
  
  // Test directory
  const testDir = path.join(__dirname, 'test-output');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Test PDF generation
  const testFilePath = path.join(testDir, 'test-certificate.pdf');
  console.log('Test PDF path:', testFilePath);
  
  // Generate a simple PDF
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(testFilePath);
  doc.pipe(stream);
  
  doc.fontSize(24).text('Test Certificate', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(14).text('This is a test PDF to verify PDFKit is working correctly.', { align: 'center' });
  
  doc.end();
  
  stream.on('finish', () => {
    console.log('✓ Test PDF generated successfully');
    console.log('File exists:', fs.existsSync(testFilePath));
    
    // Clean up
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('✓ Test file cleaned up');
    }
    
    if (fs.existsSync(testDir) && fs.readdirSync(testDir).length === 0) {
      fs.rmdirSync(testDir);
      console.log('✓ Test directory cleaned up');
    }
    
    console.log('\n=== PDF Test Complete ===');
  });
  
  stream.on('error', (err) => {
    console.log('✗ Error generating test PDF:', err.message);
    console.log('\n=== PDF Test Complete ===');
  });
  
} catch (err) {
  console.log('✗ Failed to load PDFKit:', err.message);
  console.log('Try running: npm install pdfkit');
  console.log('\n=== PDF Test Complete ===');
}