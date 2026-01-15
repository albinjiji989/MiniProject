import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const ProductInventory = ({ data, onNext, onBack }) => {
  const [formData, setFormData] = useState({
    sku: data.inventory?.sku || '',
    stock: data.inventory?.stock || 0,
    lowStockThreshold: data.inventory?.lowStockThreshold || 10,
    trackInventory: data.inventory?.trackInventory !== false,
    allowBackorder: data.inventory?.allowBackorder || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({
      inventory: {
        ...formData,
        stock: parseInt(formData.stock),
        lowStockThreshold: parseInt(formData.lowStockThreshold)
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Inventory</h2>
        <p className="text-gray-600">Manage stock and inventory settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SKU (Stock Keeping Unit)
          </label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., PED-DOG-10KG-001"
          />
          <p className="text-gray-500 text-sm mt-1">Unique identifier for this product</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min="0"
          />
          <p className="text-gray-500 text-sm mt-1">Available units in stock</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Low Stock Threshold
          </label>
          <input
            type="number"
            value={formData.lowStockThreshold}
            onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="10"
            min="0"
          />
          <p className="text-gray-500 text-sm mt-1">Alert when stock falls below this number</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={formData.trackInventory}
            onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })}
            className="w-5 h-5"
          />
          <div>
            <p className="font-medium text-gray-900">Track Inventory</p>
            <p className="text-sm text-gray-600">Enable stock tracking for this product</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={formData.allowBackorder}
            onChange={(e) => setFormData({ ...formData, allowBackorder: e.target.checked })}
            className="w-5 h-5"
          />
          <div>
            <p className="font-medium text-gray-900">Allow Backorders</p>
            <p className="text-sm text-gray-600">Allow customers to order when out of stock</p>
          </div>
        </label>
      </div>

      {/* Stock Status */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Stock Status</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            formData.stock > formData.lowStockThreshold ? 'bg-green-500' :
            formData.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm font-medium">
            {formData.stock > formData.lowStockThreshold ? 'In Stock' :
             formData.stock > 0 ? 'Low Stock' : 'Out of Stock'}
          </span>
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

export default ProductInventory;
