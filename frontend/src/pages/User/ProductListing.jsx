import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Filter, X, ChevronDown, Star, SlidersHorizontal } from 'lucide-react';

/**
 * Product Listing Page - Flipkart Style
 */
const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(true);

  const currentFilters = {
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    brand: searchParams.get('brand') || '',
    petType: searchParams.get('petType') || '',
    rating: searchParams.get('rating') || '',
    sortBy: searchParams.get('sortBy') || 'popularity',
    page: searchParams.get('page') || '1'
  };

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(currentFilters);
      const response = await api.get(`/ecommerce/user/products?${params}`);
      setProducts(response.data.data);
      setFilters(response.data.filters);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to first page
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentFilters.search ? `Search: "${currentFilters.search}"` : 'All Products'}
            </h1>
            <p className="text-gray-600">
              {pagination.total || 0} products found
            </p>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                {Object.values(currentFilters).some(v => v && v !== 'popularity' && v !== '1') && (
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 text-sm hover:text-blue-700"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Price</h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={currentFilters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={currentFilters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              {/* Brand Filter */}
              {filters.brands && filters.brands.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Brand</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filters.brands.map((brand) => (
                      <label key={brand} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="brand"
                          checked={currentFilters.brand === brand}
                          onChange={() => updateFilter('brand', brand)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Pet Type Filter */}
              {filters.petTypes && filters.petTypes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Pet Type</h3>
                  <div className="space-y-2">
                    {filters.petTypes.map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="petType"
                          checked={currentFilters.petType === type}
                          onChange={() => updateFilter('petType', type)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating Filter */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Customer Rating</h3>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={currentFilters.rating === rating.toString()}
                        onChange={() => updateFilter('rating', rating.toString())}
                        className="w-4 h-4"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-700">{rating}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-500">& above</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              
              <select
                value={currentFilters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="popularity">Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
                <option value="rating">Customer Rating</option>
                <option value="discount">Discount</option>
              </select>
            </div>

            {/* Products */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500 text-lg">No products found</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => updateFilter('page', page.toString())}
                        className={`px-4 py-2 rounded-lg ${
                          page === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Card Component (same as home page)
const ProductCard = ({ product }) => {
  const finalPrice = product.pricing?.salePrice || product.pricing?.basePrice || 0;
  const discount = product.pricing?.salePrice && product.pricing?.basePrice
    ? Math.round(((product.pricing.basePrice - product.pricing.salePrice) / product.pricing.basePrice) * 100)
    : 0;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-200"
    >
      <div className="relative">
        <img
          src={product.images?.[0]?.url || '/placeholder-product.png'}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
            {discount}% OFF
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 h-10">
          {product.name}
        </h3>
        
        {product.attributes?.brand && (
          <p className="text-xs text-gray-500 mb-2">{product.attributes.brand}</p>
        )}
        
        <div className="flex items-center gap-1 mb-2">
          {product.ratings?.average > 0 && (
            <>
              <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                <span className="font-semibold">{product.ratings.average.toFixed(1)}</span>
                <Star className="w-3 h-3 fill-white" />
              </div>
              <span className="text-xs text-gray-500">({product.ratings.count})</span>
            </>
          )}
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">₹{finalPrice.toFixed(0)}</span>
          {discount > 0 && (
            <>
              <span className="text-sm text-gray-500 line-through">
                ₹{product.pricing.basePrice.toFixed(0)}
              </span>
              <span className="text-xs text-green-600 font-semibold">{discount}%</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductListing;
