import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Upload, X, Image as ImageIcon } from 'lucide-react';
import { api } from '../../../services/api';

const ProductImages = ({ data, onNext, onBack }) => {
  const [images, setImages] = useState(data.images || []);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    try {
      setUploading(true);
      
      // Create FormData for upload
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      // Upload to Cloudinary via backend
      const response = await api.post('/ecommerce/manager/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const newImages = response.data.data.map((img, index) => ({
          ...img,
          isPrimary: images.length === 0 && index === 0,
          order: images.length + index
        }));
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index) => {
    const imageToRemove = images[index];
    
    try {
      // Delete from Cloudinary
      await api.delete('/ecommerce/manager/images/delete', {
        data: { publicId: imageToRemove.publicId }
      });

      const newImages = images.filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }
      setImages(newImages);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const setPrimary = (index) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    setImages(newImages);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({ images });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Images</h2>
        <p className="text-gray-600">Add high-quality images of your product (minimum 1 image)</p>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <label htmlFor="image-upload" className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Uploading images...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">Click to upload images</p>
              <p className="text-gray-500 text-sm">PNG, JPG up to 5MB each</p>
            </>
          )}
        </label>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.url}
                alt={image.alt}
                className={`w-full h-40 object-cover rounded-lg ${
                  image.isPrimary ? 'ring-4 ring-blue-500' : ''
                }`}
              />
              {image.isPrimary && (
                <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Primary
                </span>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2">
                {!image.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(index)}
                    className="opacity-0 group-hover:opacity-100 bg-white text-gray-700 px-3 py-1 rounded text-sm"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> All images are stored securely in the cloud. Use high-quality images with white background for best results.
        </p>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          disabled={uploading}
          className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <button
          type="submit"
          disabled={images.length === 0 || uploading}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};

export default ProductImages;
