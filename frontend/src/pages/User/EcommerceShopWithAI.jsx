import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  Star, Filter, X, ChevronDown, Sparkles, 
  ShoppingBag, TrendingUp, Package, Search 
} from 'lucide-react';
import AIBreedIdentifierWithRecommendations from '../../components/Petshop/AIBreedIdentifierWithRecommendations';

/**
 * Enhanced Ecommerce Shop with AI-Powered Breed Recommendations
 * Industry-level product filtering and AI integration
 */
const EcommerceShopWithAI = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedPetType, setSelectedPetType] = useState(searchParams.get('petType') || '');
  const [selectedBreed, setSelectedBreed] = useState(searchParams.get('breed') || '');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || ''
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'popularity');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/ecommerce/categories?parent=root');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: searchParams.get('page') || 1,
        limit: 24,
        sortBy: searchParams.get('sortBy') || 'popularity'
      };

      if (searchParams.get('category')) params.category = searchParams.get('category');
      if (searchParams.get('petType')) params.petType = searchParams.get('petType');
      if (searchParams.get('breed')) params.breed = searchParams.get('breed');
      if (searchParams.get('minPrice')) params.minPrice = searchParams.get('minPrice');
      if (searchParams.get('maxPrice')) params.maxPrice = searchParams.get('maxPrice');
      if (searchParams.get('search')) params.search = searchParams.get('search');
      if (searchParams.get('brand')) params.brand = searchParams.get('brand');
      if (searchParams.get('rating')) params.rating = searchParams.get('rating');

      const response = await api.get('/ecommerce/products', { params });
      
      setProducts(response.data.data || []);
      setFilters(response.data.filters || {});
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    
    newParams.delete('page'); // Reset to page 1 when filters change
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setSelectedCategory('');
    setSelectedPetType('');
    setSelectedBreed('');
    setPriceRange({ min: '', max: '' });
    setSearchQuery('');
  };

  const handleAIRecommendation = (data) => {
    // When AI identifies a breed, automatically filter products
    if (data.species) {
      updateFilters('petType', data.species.toLowerCase());
    }
    if (data.breed) {
      updateFilters('breed', data.breed);
    }
    setShowAIPanel(false);
  };

  const activeFiltersCount = [
    selectedCategory,
    selectedPetType,
    selectedBreed,
    priceRange.min,
    priceRange.max,
    searchQuery
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with AI Button */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && updateFilters('search', searchQuery)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
            >
              <Sparkles className="w-5 h-5" />
              AI Recommendations
            </button>
          </div>
        </div>
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">AI-Powered Product Finder</h3>
              <button
                onClick={() => setShowAIPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <AIBreedIdentifierWithRecommendations
              userType="user"
              onBreedIdentified={handleAIRecommendation}
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Pet Type Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Pet Type</h4>
                <div className="space-y-2">
                  {['dog', 'cat', 'bird', 'fish', 'rabbit'].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="petType"
                        checked={selectedPetType === type}
                        onChange={() => {
                          setSelectedPetType(type);
                          updateFilters('petType', type);
                        }}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">{type}</span>
                    </label>
                  ))}
                  {selectedPetType && (
                    <button
                      onClick={() => {
                        setSelectedPetType('');
                        updateFilters('petType', '');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Category</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.map((cat) => (
                      <label key={cat._id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === cat._id}
                          onChange={() => {
                            setSelectedCategory(cat._id);
                            updateFilters('category', cat._id);
                          }}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{cat.name}</span>
                      </label>
                    ))}
                    {selectedCategory && (
                      <button
                        onClick={() => {
                          setSelectedCategory('');
                          updateFilters('category', '');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Price Range</h4>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <button
                  onClick={() => {
                    updateFilters('minPrice', priceRange.min);
                    updateFilters('maxPrice', priceRange.max);
                  }}
                  className="w-full mt-2 bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>

              {/* Brand Filter */}
              {filters.brands && filters.brands.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Brand</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filters.brands.slice(0, 10).map((brand) => (
                      <label key={brand} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          onChange={(e) => updateFilters('brand', e.target.checked ? brand : '')}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Rating</h4>
                <div className="space-y-2">
                  {[4, 3, 2].map((rating) => (
                    <label key={rating} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        onChange={() => updateFilters('rating', rating)}
                        className="text-blue-600"
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
            {/* Sort and Results Info */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {pagination.total > 0 ? (
                  <>
                    Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
                  </>
                ) : (
                  'No products found'
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    updateFilters('sortBy', e.target.value);
                  }}
                  className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="popularity">Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="rating">Customer Rating</option>
                  <option value="discount">Discount</option>
                </select>
              </div>
            </div>

            {/* Active Filters Tags */}
            {activeFiltersCount > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4 flex flex-wrap gap-2">
                {selectedPetType && (
                  <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm">
                    Pet: <strong className="capitalize">{selectedPetType}</strong>
                    <button onClick={() => updateFilters('petType', '')} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm">
                    Search: <strong>{searchQuery}</strong>
                    <button onClick={() => updateFilters('search', '')} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="bg-gray-200 h-48 rounded mb-3"></div>
                    <div className="bg-gray-200 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => updateFilters('page', i + 1)}
                        className={`px-4 py-2 rounded ${
                          pagination.page === i + 1
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or use AI recommendations
                </p>
                <button
                  onClick={() => setShowAIPanel(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                >
                  Try AI Recommendations
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product }) => {
  const finalPrice = product.pricing?.salePrice || product.pricing?.basePrice || 0;
  const discount = product.pricing?.salePrice && product.pricing?.basePrice
    ? Math.round(((product.pricing.basePrice - product.pricing.salePrice) / product.pricing.basePrice) * 100)
    : 0;

  return (
    <Link
      to={`/user/ecommerce/product/${product.slug}`}
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
        {product.isBestseller && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
            Bestseller
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

export default EcommerceShopWithAI;
