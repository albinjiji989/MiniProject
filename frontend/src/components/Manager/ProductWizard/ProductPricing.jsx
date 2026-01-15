import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const ProductPricing = ({ data, onNext, onBack }) => {
  const [formData, setFormData] = useState({
    basePrice: data.pricing?.basePrice || '',
    salePrice: data.pricing?.salePrice || '',
    costPrice: data.pricing?.costPrice || '',
    taxPercentage: data.pricing?.tax?.percentage || 18
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.basePrice || formData.basePrice <= 0) {
      newErrors.basePrice = 'Base price is required and must be greater than 0';
    }
    if (formData.salePrice && formData.salePrice >= formData.basePrice) {
      newErrors.salePrice = 'Sale price must be less than base price';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext({
        pricing: {
          basePrice: parseFloat(formData.basePrice),
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
          tax: {
            percentage: parseFloat(formData.taxPercentage),
            inclusive: false
          }
        }
      });
    }
  };

  const discount = formData.basePrice && formData.salePrice
    ? Math.round(((formData.basePrice - formData.salePrice) / formData.basePrice) * 100)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing</h2>
        <p className="text-gray-600">Set your product pricing and discounts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Price (MRP) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500">₹</span>
            <input
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.basePrice ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
              step="0.01"
            />
          </div>
          {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sale Price (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500">₹</span>
            <input
              type="number"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
              className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.salePrice ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
              step="0.01"
            />
          </div>
          {errors.salePrice && <p className="text-red-500 text-sm mt-1">{errors.salePrice}</p>}
          {discount > 0 && (
            <p className="text-green-600 text-sm mt-1 font-medium">{discount}% OFF</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cost Price (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500">₹</span>
            <input
              type="number"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <p className="text-gray-500 text-sm mt-1">Your cost for this product</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Percentage
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.taxPercentage}
              onChange={(e) => setFormData({ ...formData, taxPercentage: e.target.value })}
              className="w-full pr-8 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="18"
              step="0.01"
            />
            <span className="absolute right-3 top-3 text-gray-500">%</span>
          </div>
        </div>
      </div>

      {/* Price Summary */}
      {formData.basePrice && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Price Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Price:</span>
              <span className="font-medium">₹{parseFloat(formData.basePrice).toFixed(2)}</span>
            </div>
            {formData.salePrice && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Sale Price:</span>
                  <span className="font-medium">₹{parseFloat(formData.salePrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>You Save:</span>
                  <span className="font-medium">
                    ₹{(formData.basePrice - formData.salePrice).toFixed(2)} ({discount}%)
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Customer Pays:</span>
              <span className="font-bold text-lg">
                ₹{(formData.salePrice || formData.basePrice) ? parseFloat(formData.salePrice || formData.basePrice).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>
      )}

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

export default ProductPricing;
