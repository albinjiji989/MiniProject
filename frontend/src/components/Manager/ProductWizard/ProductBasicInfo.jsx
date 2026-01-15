import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const ProductBasicInfo = ({ data, onNext, isFirstStep }) => {
  const [formData, setFormData] = useState({
    name: data.name || '',
    shortDescription: data.shortDescription || '',
    description: data.description || '',
    tags: data.tags?.join(', ') || ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.name.length < 10) newErrors.name = 'Product name should be at least 10 characters';
    if (formData.description.length < 50) newErrors.description = 'Description should be at least 50 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext({
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-gray-600">Let's start with the essential details about your product</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Pedigree Adult Dry Dog Food, Chicken & Vegetables, 10kg"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        <p className="text-gray-500 text-sm mt-1">
          {formData.name.length}/200 characters (minimum 10)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Short Description
        </label>
        <input
          type="text"
          value={formData.shortDescription}
          onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Brief one-line description"
          maxLength={150}
        />
        <p className="text-gray-500 text-sm mt-1">{formData.shortDescription.length}/150 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={8}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Provide detailed information about your product including features, benefits, ingredients, etc."
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        <p className="text-gray-500 text-sm mt-1">
          {formData.description.length} characters (minimum 50)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags (comma separated)
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., dog food, chicken, adult, premium"
        />
        <p className="text-gray-500 text-sm mt-1">
          Add relevant tags to help customers find your product
        </p>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          type="submit"
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};

export default ProductBasicInfo;
