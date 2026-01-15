import React from 'react';
import { ChevronLeft, Check, Package } from 'lucide-react';

const ProductReview = ({ data, onBack, onPublish, loading }) => {
  const finalPrice = data.pricing?.salePrice || data.pricing?.basePrice || 0;
  const discount = data.pricing?.salePrice && data.pricing?.basePrice
    ? Math.round(((data.pricing.basePrice - data.pricing.salePrice) / data.pricing.basePrice) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Publish</h2>
        <p className="text-gray-600">Review your product details before publishing</p>
      </div>

      {/* Product Preview */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Images */}
          <div>
            {data.images && data.images.length > 0 ? (
              <img
                src={data.images.find(img => img.isPrimary)?.url || data.images[0]?.url}
                alt={data.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-400" />
              </div>
            )}
            {data.images && data.images.length > 1 && (
              <div className="flex gap-2 mt-2">
                {data.images.slice(0, 4).map((img, index) => (
                  <img
                    key={index}
                    src={img.url}
                    alt={`${data.name} ${index + 1}`}
                    className="w-16 h-16 object-cover rounded"
                  />
                ))}
                {data.images.length > 4 && (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-sm font-medium text-gray-600">
                    +{data.images.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{data.name}</h3>
            {data.shortDescription && (
              <p className="text-gray-600 mb-4">{data.shortDescription}</p>
            )}
            
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-gray-900">₹{finalPrice.toFixed(2)}</span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-gray-500 line-through">
                    ₹{data.pricing.basePrice.toFixed(2)}
                  </span>
                  <span className="text-green-600 font-semibold">{discount}% OFF</span>
                </>
              )}
            </div>

            {data.attributes?.brand && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Brand:</span> {data.attributes.brand}
              </p>
            )}

            {data.petType && data.petType.length > 0 && (
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Suitable for:</span>{' '}
                {data.petType.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
              </p>
            )}

            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${
                data.inventory?.stock > (data.inventory?.lowStockThreshold || 10) ? 'bg-green-500' :
                data.inventory?.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm font-medium">
                {data.inventory?.stock > 0 ? 'In Stock' : 'Out of Stock'}
                {data.inventory?.stock > 0 && ` (${data.inventory.stock} units)`}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div className="border-t border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{data.description}</p>
          </div>
        )}

        {/* Specifications */}
        {data.specifications && data.specifications.length > 0 && (
          <div className="border-t border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Specifications</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.specifications.map((spec, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">{spec.name}:</span>
                  <span className="font-medium text-gray-900">
                    {spec.value} {spec.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Once published, your product will be visible to customers.
          You can edit or unpublish it anytime from the products page.
        </p>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.href = '/manager/ecommerce/products'}
            disabled={loading}
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={loading}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium disabled:opacity-50"
          >
            {loading ? 'Publishing...' : (
              <>
                <Check className="w-5 h-5" />
                Publish Product
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductReview;
