import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Plus, X } from 'lucide-react';

const ProductSpecifications = ({ data, onNext, onBack }) => {
  const [specifications, setSpecifications] = useState(data.specifications || []);
  const [petType, setPetType] = useState(data.petType || ['all']);
  const [brand, setBrand] = useState(data.attributes?.brand || '');

  const addSpecification = () => {
    setSpecifications([...specifications, { name: '', value: '', unit: '' }]);
  };

  const updateSpecification = (index, field, value) => {
    const newSpecs = [...specifications];
    newSpecs[index][field] = value;
    setSpecifications(newSpecs);
  };

  const removeSpecification = (index) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({
      specifications: specifications.filter(s => s.name && s.value),
      petType,
      attributes: { ...data.attributes, brand }
    });
  };

  const petTypes = ['all', 'dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Specifications</h2>
        <p className="text-gray-600">Add detailed specifications for your product</p>
      </div>

      {/* Pet Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Suitable For <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {petTypes.map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={petType.includes(type)}
                onChange={(e) => {
                  if (type === 'all') {
                    setPetType(e.target.checked ? ['all'] : []);
                  } else {
                    const newTypes = e.target.checked
                      ? [...petType.filter(t => t !== 'all'), type]
                      : petType.filter(t => t !== type);
                    setPetType(newTypes.length === 0 ? ['all'] : newTypes);
                  }
                }}
                className="mr-2"
              />
              <span className="capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brand
        </label>
        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Pedigree, Royal Canin"
        />
      </div>

      {/* Dynamic Specifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Product Specifications
          </label>
          <button
            type="button"
            onClick={addSpecification}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Specification
          </button>
        </div>

        <div className="space-y-3">
          {specifications.map((spec, index) => (
            <div key={index} className="flex gap-3 items-start">
              <input
                type="text"
                value={spec.name}
                onChange={(e) => updateSpecification(index, 'name', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Name (e.g., Weight, Size, Material)"
              />
              <input
                type="text"
                value={spec.value}
                onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Value (e.g., 10, Large, Plastic)"
              />
              <input
                type="text"
                value={spec.unit}
                onChange={(e) => updateSpecification(index, 'unit', e.target.value)}
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Unit (kg)"
              />
              <button
                type="button"
                onClick={() => removeSpecification(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {specifications.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            No specifications added yet. Click "Add Specification" to add product details.
          </p>
        )}
      </div>

      {/* Common Specification Examples */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Common Specifications:</p>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Weight, Size, Dimensions</p>
          <p>• Material, Color, Flavor</p>
          <p>• Age Group (Puppy, Adult, Senior)</p>
          <p>• Breed Specific (if applicable)</p>
          <p>• Ingredients, Nutritional Info</p>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
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

export default ProductSpecifications;
