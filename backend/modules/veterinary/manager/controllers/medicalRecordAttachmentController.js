const { validationResult } = require('express-validator');
const VeterinaryMedicalRecord = require('../../models/VeterinaryMedicalRecord');
const { processEntityImages, processEntityDocuments } = require('../../../../core/utils/imageUploadHandler');
const Image = require('../../../../core/models/Image');
const Document = require('../../../../core/models/Document');

const uploadMedicalRecordAttachments = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { recordId } = req.params;
    const { images, documents } = req.body;
    
    // Verify medical record exists
    const medicalRecord = await VeterinaryMedicalRecord.findById(recordId);
    if (!medicalRecord) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    // Check if user has access to this record
    if (medicalRecord.veterinary.toString() !== req.user.storeId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let savedImages = [];
    let savedDocuments = [];
    
    // Process images
    if (images && Array.isArray(images) && images.length > 0) {
      savedImages = await processEntityImages(
        images,
        'VeterinaryMedicalRecord',
        recordId,
        req.user._id,
        'veterinary',
        'manager'
      );
    }
    
    // Process documents
    if (documents && Array.isArray(documents) && documents.length > 0) {
      savedDocuments = await processEntityDocuments(
        documents,
        'VeterinaryMedicalRecord',
        recordId,
        req.user._id,
        'veterinary',
        'manager'
      );
    }
    
    // Update medical record with attachment references
    if (savedImages.length > 0) {
      const imageAttachments = savedImages.map(img => ({
        name: img.caption || `Image ${medicalRecord.attachments ? medicalRecord.attachments.length + 1 : 1}`,
        url: img.url,
        type: 'image'
      }));
      
      medicalRecord.attachments = [
        ...medicalRecord.attachments || [],
        ...imageAttachments
      ];
    }
    
    if (savedDocuments.length > 0) {
      const documentAttachments = savedDocuments.map(doc => ({
        name: doc.name || `Document ${medicalRecord.attachments ? medicalRecord.attachments.length + 1 : 1}`,
        url: doc.url,
        type: doc.type || 'document'
      }));
      
      medicalRecord.attachments = [
        ...medicalRecord.attachments || [],
        ...documentAttachments
      ];
    }
    
    await medicalRecord.save();

    res.status(200).json({
      success: true,
      message: 'Attachments uploaded successfully and saved to Cloudinary',
      data: {
        images: savedImages,
        documents: savedDocuments,
        medicalRecord
      }
    });
  } catch (error) {
    console.error('Upload attachments error:', error);
    res.status(500).json({ success: false, message: 'Server error while uploading attachments to Cloudinary', error: error.message });
  }
};

const getMedicalRecordAttachments = async (req, res) => {
  try {
    const { recordId } = req.params;
    
    // Verify medical record exists
    const medicalRecord = await VeterinaryMedicalRecord.findById(recordId);
    if (!medicalRecord) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    // Check if user has access to this record
    if (medicalRecord.veterinary.toString() !== req.user.storeId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get images and documents for this record
    const images = await Image.find({ 
      entityType: 'VeterinaryMedicalRecord', 
      entityId: recordId 
    });
    
    const documents = await Document.find({ 
      entityType: 'VeterinaryMedicalRecord', 
      entityId: recordId 
    });

    res.json({
      success: true,
      data: {
        images,
        documents,
        attachments: medicalRecord.attachments || []
      }
    });
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching attachments from Cloudinary', error: error.message });
  }
};

module.exports = {
  uploadMedicalRecordAttachments,
  getMedicalRecordAttachments
};