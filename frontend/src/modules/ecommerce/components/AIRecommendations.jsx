import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { 
  TrendingUp, 
  Award, 
  ShoppingBag,
  Sparkles, 
  Clock,
  Star,
  ChevronRight
} from 'lucide-react';

/**
 * AI/ML Powered Product Recommendations
 * Professional e-commerce recommendation system
 */
const AIRecommendations = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState({
    best_sellers: [],
    trending: [],
    most_bought: [],
    recommended_for_you: [],
    new_arrivals: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ecommerce/ai/recommendations');
      
      if (response.data.success) {
        setRecommendations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const trackClick = async (productId) => {
    try {
      await api.post('/ecommerce/ai/recommendations/track-click', { productId });
    } catch (error) {
      console.error('Track click error:', error);
    }
  };

  const handleProductClick = (product) => {
    trackClick(product._id);
    navigate(`/user/ecommerce/product/${product.slug || product._id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        {error}
      </div>
    );
  }

  const hasRecommendations = 
    recommendations.best_sellers?.length > 0 ||
    recommendations.trending?.length > 0 ||
    recommendations.most_bought?.length > 0 ||
    recommendations.recommended_for_you?.length > 0 ||
    recommendations.new_arrivals?.length > 0;

  if (!hasRecommendations) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-lg">
          <Sparkles className="w-5 h-5" />
          <p className="font-medium">AI-powered recommendations will appear here as you browse and shop!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Best Sellers */}
      {recommendations.best_sellers?.length > 0 && (
        <RecommendationSection
          title="🏆 Best Sellers"
          subtitle="Top-rated products loved by customers"
          icon={<Award className="w-6 h-6" />}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
          products={recommendations.best_sellers}
          onClick={handleProductClick}
          badge="BEST SELLER"
          badgeColor="bg-yellow-500"
        />
      )}

      {/* Most Bought */}
      {recommendations.most_bought?.length > 0 && (
        <RecommendationSection
          title="🔥 Most Bought"
          subtitle="Products customers can't get enough of"
          icon={<ShoppingBag className="w-6 h-6" />}
          color="text-red-600"
          bgColor="bg-red-50"
          products={recommendations.most_bought}
          onClick={handleProductClick}
          badge="HOT"
          badgeColor="bg-red-500"
        />
      )}

      {/* Trending Now */}
      {recommendations.trending?.length > 0 && (
        <RecommendationSection
          title="📈 Trending Now"
          subtitle="What everyone's checking out right now"
          icon={<TrendingUp className="w-6 h-6" />}
          color="text-orange-600"
          bgColor="bg-orange-50"
          products={recommendations.trending}
          onClick={handleProductClick}
          badge="TRENDING"
          badgeColor="bg-orange-500"
        />
      )}

      {/* Recommended For You */}
      {recommendations.recommended_for_you?.length > 0 && (
        <RecommendationSection
          title="✨ Recommended For You"
          subtitle="Picked just for you based on your interests"
          icon={<Sparkles className="w-6 h-6" />}
          color="text-purple-600"
          bgColor="bg-purple-50"
          products={recommendations.recommended_for_you}
          onClick={handleProductClick}
          badge="FOR YOU"
          badgeColor="bg-purple-500"
        />
      )}

      {/* New Arrivals */}
      {recommendations.new_arrivals?.length > 0 && (
        <RecommendationSection
          title="🎯 New Arrivals"
          subtitle="Fresh products just added"
          icon={<Clock className="w-6 h-6" />}
          color="text-green-600"
          bgColor="bg-green-50"
          products={recommendations.new_arrivals}
          onClick={handleProductClick}
          badge="NEW"
          badgeColor="bg-green-500"
        />
      )}
    </div>
  );
};

// Recommendation Section Component
const RecommendationSection = ({ 
  title, 
  subtitle, 
  icon, 
  color, 
  bgColor,
  products, 
  onClick,
  badge,
  badgeColor
}) => {
  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${bgColor} ${color}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
        </div>
        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          View All
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.slice(0, 10).map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onClick={() => onClick(product)}
            badge={badge}
            badgeColor={badgeColor}
          />
        ))}
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onClick, badge, badgeColor }) => {
  const basePrice = product.pricing?.basePrice || 0;
  const salePrice = product.pricing?.salePrice || 0;
  const finalPrice = salePrice > 0 ? salePrice : basePrice;
  const discount = salePrice > 0 && basePrice > 0 
    ? Math.round(((basePrice - salePrice) / basePrice) * 100) 
    : 0;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={product.images?.[0]?.url || '/placeholder-product.png'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {/* Badge */}
        {badge && (
          <div className={`absolute top-2 left-2 ${badgeColor} text-white text-xs font-bold px-2 py-1 rounded`}>
            {badge}
          </div>
        )}
        
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            {discount}% OFF
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 h-10 mb-2">
          {product.name}
        </h3>

        {/* Rating */}
        {product.ratings?.average > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
              <span className="font-semibold">{product.ratings.average.toFixed(1)}</span>
              <Star className="w-3 h-3 fill-white" />
            </div>
            <span className="text-xs text-gray-500">({product.ratings.count})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">₹{finalPrice.toFixed(0)}</span>
          {discount > 0 && (
            <span className="text-sm text-gray-500 line-through">
              ₹{basePrice.toFixed(0)}
            </span>
          )}
        </div>

        {/* Stock Warning */}
        {product.inventory?.stock > 0 && product.inventory.stock < 10 && (
          <p className="text-xs text-red-600 mt-1 font-medium">
            Only {product.inventory.stock} left!
          </p>
        )}
      </div>
    </div>
  );
};

export default AIRecommendations;
