import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Filter, Grid, List, Star, Heart, ShoppingCart, ChevronDown } from 'lucide-react';
import { getSessionId, getDeviceType } from '../../utils/session';

/**
 * Shop Page - Browse All Products (Flipkart Style)
 */
const Shop = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'popularity',
    search: searchParams.get('search') || ''
  });
  const [pagination, setPagination] = useState({});

  const trackProductClick = async (productId) => {
    try {
      await api.post(`/ecommerce/products/${productId}/view`, {
        source: filters.search ? 'search' : filters.category ? 'category' : 'shop',
        deviceType: getDeviceType(),
        sessionId: getSessionId()
      });
    } catch (error) {
      console.debug('Click tracking failed:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters]);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 24,
        sortBy: filters.sortBy,
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/ecommerce/products?${params}`);
      console.log('Products response:', response.data);
      setProducts(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/ecommerce/categories?limit=50');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {filters.search ? `Search results for "${filters.search}"` : 'All Products'}
            </h1>
            <p className="text-gray-600">
              {pagination.total || 0} products found
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg border border-gray-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="popularity">Popularity</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="rating">Customer Rating</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => {
                    setFilters({ category: '', minPrice: '', maxPrice: '', sortBy: 'popularity', search: '' });
                    setSearchParams({});
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={!filters.category}
                        onChange={() => handleFilterChange('category', '')}
                        className="text-blue-600"
                      />
                      <span className="text-sm">All Categories</span>
                    </label>
                    {categories.map((cat) => (
                      <label key={cat._id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          checked={filters.category === cat._id}
                          onChange={() => handleFilterChange('category', cat._id)}
                          className="text-blue-600"
                        />
                        <span className="text-sm">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
                <button
                  onClick={() => {
                    setFilters({ category: '', minPrice: '', maxPrice: '', sortBy: 'popularity', search: '' });
                    setSearchParams({});
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'space-y-4'
                }>
                  {products.map((product) => (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      viewMode={viewMode}
                      onProductClick={trackProductClick}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => fetchProducts(page)}
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

// Product Card Component
const ProductCard = ({ product, viewMode, onProductClick }) => {
  const finalPrice = product.pricing?.salePrice || product.pricing?.basePrice || 0;
  const discount = product.pricing?.salePrice && product.pricing?.basePrice
    ? Math.round(((product.pricing.basePrice - product.pricing.salePrice) / product.pricing.basePrice) * 100)
    : 0;

  const handleClick = () => {
    if (onProductClick) {
      onProductClick(product._id);
    }
  };

  if (viewMode === 'list') {
    return (
      <Link
        to={`/user/ecommerce/product/${product.slug}`}
        onClick={handleClick}
        className="bg-white rounded-lg p-4 hover:shadow-lg transition-shadow border border-gray-200 flex gap-4"
      >
        <img
          src={product.images?.[0]?.url || '/placeholder-product.png'}
          alt={product.name}
          className="w-32 h-32 object-cover rounded"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
          {product.attributes?.brand && (
            <p className="text-sm text-gray-500 mb-2">{product.attributes.brand}</p>
          )}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.shortDescription}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">₹{finalPrice.toFixed(0)}</span>
              {discount > 0 && (
                <>
                  <span className="text-sm text-gray-500 line-through">₹{product.pricing.basePrice.toFixed(0)}</span>
                  <span className="text-sm text-green-600 font-semibold">{discount}% off</span>
                </>
              )}
            </div>
            {product.ratings?.average > 0 && (
              <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-sm">
                <span className="font-semibold">{product.ratings.average.toFixed(1)}</span>
                <Star className="w-3 h-3 fill-white" />
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/user/ecommerce/product/${product.slug}`}
      onClick={handleClick}
      className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-200 group"
    >
      <div className="relative">
        <img
          src={product.images?.[0]?.url || '/placeholder-product.png'}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
            {discount}% OFF
          </div>
        )}
        <button className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100">
          <Heart className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="p-4">
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

        <div className="flex items-baseline gap-2 mb-3">
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

export default Shop;
