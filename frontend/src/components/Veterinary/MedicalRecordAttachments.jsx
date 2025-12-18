import React, { useState, useEffect } from 'react';
import { veterinaryAPI } from '../../services/api';

const MedicalRecordAttachments = ({ recordId, onAttachmentsChange }) => {
  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (recordId) {
      loadAttachments();
    }
  }, [recordId]);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      const response = await veterinaryAPI.managerGetMedicalRecordAttachments(recordId);
      setImages(response.data.data.images || []);
      setDocuments(response.data.data.documents || []);
    } catch (error) {
      console.error('Failed to load attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    const newImageObjects = imageFiles.map(file => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      return new Promise((resolve) => {
        reader.onload = () => {
          resolve({
            file: file,
            url: reader.result,
            name: file.name,
            type: file.type,
            isPrimary: false
          });
        };
      });
    });

    Promise.all(newImageObjects).then(results => {
      setNewImages(prev => [...prev, ...results]);
    });
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    const docFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type.startsWith('image/') ||
      file.name.toLowerCase().endsWith('.pdf')
    );
    
    const newDocObjects = docFiles.map(file => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      return new Promise((resolve) => {
        reader.onload = () => {
          resolve({
            file: file,
            url: reader.result,
            name: file.name,
            type: file.type
          });
        };
      });
    });

    Promise.all(newDocObjects).then(results => {
      setNewDocuments(prev => [...prev, ...results]);
    });
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewDocument = (index) => {
    setNewDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async () => {
    if (newImages.length === 0 && newDocuments.length === 0) {
      return;
    }

    setUploading(true);
    try {
      const attachmentsData = {
        images: newImages.map(img => ({
          url: img.url,
          caption: img.name,
          isPrimary: img.isPrimary
        })),
        documents: newDocuments.map(doc => ({
          url: doc.url,
          name: doc.name,
          type: doc.type
        }))
      };

      const response = await veterinaryAPI.managerUploadMedicalRecordAttachments(recordId, attachmentsData);
      
      // Clear new attachments
      setNewImages([]);
      setNewDocuments([]);
      
      // Reload attachments to show the newly uploaded ones
      await loadAttachments();
      
      // Notify parent component of changes
      if (onAttachmentsChange) {
        onAttachmentsChange(response.data.data);
      }
      
      alert('Attachments uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload attachments:', error);
      alert('Failed to upload attachments. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderImagePreview = (image, index, isNew = false) => (
    <div key={index} className="relative group">
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100">
        <img
          src={image.url}
          alt={image.name || `Image ${index + 1}`}
          className="h-full w-full object-cover object-center"
        />
      </div>
      {isNew && (
        <button
          type="button"
          onClick={() => removeNewImage(index)}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <p className="mt-1 text-xs text-gray-500 truncate">{image.name || `Image ${index + 1}`}</p>
    </div>
  );

  const renderDocumentPreview = (doc, index, isNew = false) => (
    <div key={index} className="relative group flex items-center p-2 border rounded">
      <div className="flex-shrink-0">
        {doc.type === 'application/pdf' || doc.name?.toLowerCase().endsWith('.pdf') ? (
          <div className="h-10 w-10 bg-red-100 rounded flex items-center justify-center">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        ) : (
          <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{doc.name || `Document ${index + 1}`}</p>
        <p className="text-xs text-gray-500">{doc.type || 'Document'}</p>
      </div>
      {isNew && (
        <button
          type="button"
          onClick={() => removeNewDocument(index)}
          className="ml-2 flex-shrink-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-lg font-medium text-gray-900">Medical Record Attachments</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload images and documents related to this medical record. These attachments will be saved to Cloudinary and associated with the pet's medical history.
        </p>
      </div>

      {/* Upload Controls */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Upload Images</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="image-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload files</span>
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Upload Documents</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M12 10h16l-4 4h-12a2 2 0 01-2-2v-14a2 2 0 012-2h20a2 2 0 012 2v8m-12 12l4 4 4-4m-4 4v-12"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="document-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload files</span>
                  <input
                    id="document-upload"
                    name="document-upload"
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    onChange={handleDocumentUpload}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Attachments Preview */}
      {(newImages.length > 0 || newDocuments.length > 0) && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-md font-medium text-gray-900">New Attachments</h4>
            <button
              type="button"
              onClick={uploadAttachments}
              disabled={uploading}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload All'}
            </button>
          </div>

          {newImages.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Images</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {newImages.map((image, index) => renderImagePreview(image, index, true))}
              </div>
            </div>
          )}

          {newDocuments.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Documents</h5>
              <div className="space-y-2">
                {newDocuments.map((doc, index) => renderDocumentPreview(doc, index, true))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Existing Attachments */}
      <div className="border rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">Existing Attachments</h4>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {images.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Images</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((image, index) => renderImagePreview(image, index))}
                </div>
              </div>
            )}

            {documents.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Documents</h5>
                <div className="space-y-2">
                  {documents.map((doc, index) => renderDocumentPreview(doc, index))}
                </div>
              </div>
            )}

            {images.length === 0 && documents.length === 0 && (
              <p className="text-sm text-gray-500">No attachments found.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MedicalRecordAttachments;