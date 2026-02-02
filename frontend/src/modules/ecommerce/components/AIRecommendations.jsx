import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { Sparkles, TrendingUp, Eye, Info, X, Star } from 'lucide-react';

/**
 * AI-Powered Product Recommendations with Explanations
 */
const AIRecommendations = ({ limit = 6 }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [limit]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching AI recommendations...');
      const response = await api.get('/ecommerce/recommendations', {
        params: { limit }
      });

      console.log('📦 Recommendations response:', response.data);

      if (response.data.success) {
        const recs = response.data.recommendations || [];
        console.log(`✅ Received ${recs.length} recommendations`);
        setRecommendations(recs);
        
        // Track that recommendations were shown
        recs.forEach(rec => {
          trackInteraction(rec.product._id, 'shown');
        });
      }
    } catch (err) {
      console.error('❌ Error fetching recommendations:', err);
      console.error('Error details:', err.response?.data);
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message || 'Failed to load recommendations');
      }
    } finally {
      setLoading(false);
    }
  };

  const trackInteraction = async (productId, action) => {
    try {
      await api.post(`/ecommerce/recommendations/${productId}/track`, { 
        action,
        sessionId: `session-${Date.now()}`
      });
    } catch (err) {
      // Silently fail tracking
      console.error('Error tracking interaction:', err);
    }
  };

  const handleProductClick = (recommendation) => {
    trackInteraction(recommendation.product._id, 'clicked');
    navigate(`/user/ecommerce/product/${recommendation.product.slug}`);
  };

  const handleViewExplanation = (recommendation) => {
    setSelectedProduct(recommendation);
    setShowExplanationModal(true);
  };

  const closeExplanation = () => {
    setShowExplanationModal(false);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">⚠️ {error}</p>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Recommendations Yet</h3>
        <p className="text-gray-600 mb-4">
          Start shopping to get personalized AI recommendations!
        </p>
        <p className="text-sm text-gray-500">
          Browse products, register your pets, and make purchases to help our AI learn your preferences.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Recommendations</h2>
          <p className="text-sm text-gray-600">Personalized just for you and your pets</p>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.product._id}
            recommendation={recommendation}
            onViewExplanation={handleViewExplanation}
            onProductClick={handleProductClick}
          />
        ))}
      </div>

      {/* Explanation Modal */}
      {showExplanationModal && selectedProduct && (
        <ExplanationModal
          recommendation={selectedProduct}
          onClose={closeExplanation}
        />
      )}
    </div>
  );
};

// Recommendation Card Component
const RecommendationCard = ({ recommendation, onViewExplanation, onProductClick }) => {
  const { product, score, explanation } = recommendation;
  const finalPrice = product.pricing?.salePrice || product.pricing?.basePrice || 0;
  const discount = product.pricing?.salePrice && product.pricing?.basePrice
    ? Math.round(((product.pricing.basePrice - product.pricing.salePrice) / product.pricing.basePrice) * 100)
    : 0;

  const matchPercentage = Math.round(score);
  const getMatchColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-300 group">
      {/* Product Image */}
      <div className="relative cursor-pointer" onClick={() => onProductClick(recommendation)}>
        <img
          src={product.images?.[0]?.url || '/placeholder-product.png'}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        
        {/* Match Score Badge */}
        <div className={`absolute top-2 left-2 ${getMatchColor(score)} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
          {matchPercentage}% Match
        </div>

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            {discount}% OFF
          </div>
        )}

        {/* Bestseller */}
        {product.isBestseller && (
          <div className="absolute bottom-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Bestseller
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 
          className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 h-10 cursor-pointer hover:text-purple-600"
          onClick={() => onProductClick(recommendation)}
        >
          {product.name}
        </h3>

        {/* Brand */}
        {product.attributes?.brand && (
          <p className="text-xs text-gray-500 mb-2">{product.attributes.brand}</p>
        )}

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
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">₹{finalPrice.toFixed(0)}</span>
          {discount > 0 && (
            <>
              <span className="text-sm text-gray-500 line-through">
                ₹{product.pricing.basePrice.toFixed(0)}
              </span>
            </>
          )}
        </div>

        {/* Why Recommended Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewExplanation(recommendation);
          }}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
        >
          <Info className="w-4 h-4" />
          Why recommended?
        </button>
      </div>
    </div>
  );
};

// Explanation Modal Component
const ExplanationModal = ({ recommendation, onClose }) => {
  const { product, score, explanation, features } = recommendation;

  const getFeatureIcon = (featureName) => {
    const icons = {
      petMatch: '🐾',
      purchaseHistory: '🛒',
      viewingHistory: '👁️',
      popularity: '⭐',
      priceMatch: '💰'
    };
    return icons[featureName] || '📊';
  };

  const getFeatureName = (featureName) => {
    const names = {
      petMatch: 'Pet Match',
      purchaseHistory: 'Purchase History',
      viewingHistory: 'Viewing History',
      popularity: 'Popularity',
      priceMatch: 'Price Match'
    };
    return names[featureName] || featureName;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <img
              src={product.images?.[0]?.url || '/placeholder-product.png'}
              alt={product.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-purple-600">{Math.round(score)}% Match</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  explanation.confidence === 'very_high' ? 'bg-green-100 text-green-700' :
                  explanation.confidence === 'high' ? 'bg-blue-100 text-blue-700' :
                  explanation.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {explanation.confidence?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Primary Reason */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Why we recommend this:</h4>
            <p className="text-lg font-medium text-gray-900">{explanation.primary}</p>
            
            {explanation.secondary && explanation.secondary.length > 0 && (
              <ul className="mt-3 space-y-1">
                {explanation.secondary.map((reason, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Feature Breakdown */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4">How we calculated this score:</h4>
            <div className="space-y-4">
              {Object.entries(features).map(([featureName, feature]) => (
                <div key={featureName} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getFeatureIcon(featureName)}</span>
                      <span className="font-semibold text-gray-900">{getFeatureName(featureName)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-purple-600">
                        {feature.contribution?.toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500 block">
                        ({feature.score?.toFixed(0)}/100 × {(feature.weight * 100).toFixed(0)}% weight)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${feature.contribution}%` }}
                    ></div>
                  </div>

                  {/* Details */}
                  {feature.details && (
                    <p className="text-sm text-gray-600 mt-2">{feature.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> Our AI analyzes your pets, browsing history, purchase patterns, 
              and product popularity to create personalized recommendations. Each factor is weighted 
              based on its importance in finding the perfect match for you.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <Link
            to={`/user/ecommerce/product/${product.slug}`}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all text-center"
          >
            View Product
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
