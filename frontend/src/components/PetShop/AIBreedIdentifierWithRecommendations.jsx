import { useState } from 'react';
import { Upload, Sparkles, AlertCircle, CheckCircle, Loader, Package, ShoppingBag, ArrowRight, TrendingUp } from 'lucide-react';
import aiService from '../../services/aiService';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * AI-Powered Pet Identifier with Complete Recommendations
 * Industry-level integration: AI → Petshop Inventory → Ecommerce Products
 * 
 * Features:
 * 1. Identify pet breed using CNN
 * 2. Check petshop inventory availability
 * 3. Find related products in ecommerce
 * 4. Smart navigation to filtered product pages
 */
const AIBreedIdentifierWithRecommendations = ({ 
  userType = 'user',
  onBreedIdentified 
}) => {
  const navigate = useNavigate();
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [identifying, setIdentifying] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setSelectedImage(file);
    setError(null);
    setAiResults(null);
    setRecommendations(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleIdentify = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setIdentifying(true);
    setError(null);

    try {
      // Step 1: Identify breed using AI
      const response = await aiService.identifyBreed(selectedImage, 5);

      if (response.success && response.data.predictions.length > 0) {
        setAiResults(response.data);
        
        const topPrediction = response.data.predictions[0];
        
        // Notify parent if callback provided
        if (onBreedIdentified) {
          onBreedIdentified({
            species: topPrediction.species,
            breed: topPrediction.breed,
            confidence: topPrediction.confidence
          });
        }

        // Step 2: Get comprehensive recommendations
        await fetchRecommendations(topPrediction.species, topPrediction.breed);
      } else {
        setError(response.error || 'Failed to identify breed');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to AI service');
    } finally {
      setIdentifying(false);
    }
  };

  const fetchRecommendations = async (species, breed) => {
    setLoadingRecommendations(true);
    
    try {
      const response = await api.get('/petshop/user/ai-recommendations', {
        params: { species, breed }
      });

      if (response.data.success) {
        setRecommendations(response.data.data);
        console.log('✅ Recommendations loaded:', response.data.data);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleViewProducts = () => {
    if (recommendations?.recommendations?.navigationUrl) {
      navigate(recommendations.recommendations.navigationUrl);
    }
  };

  const handleViewPetshop = () => {
    navigate('/User/petshop');
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAiResults(null);
    setRecommendations(null);
    setError(null);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">AI Pet Identifier & Recommender</h3>
          <p className="text-sm text-gray-600">
            Identify breed → Check stock → Find perfect products
          </p>
        </div>
      </div>

      {/* Upload Area */}
      {!imagePreview ? (
        <div className="border-2 border-dashed border-purple-300 rounded-xl p-12 text-center bg-white hover:bg-purple-50 transition-colors">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageSelect}
            className="hidden"
            id="ai-image-upload-rec"
          />
          <label htmlFor="ai-image-upload-rec" className="cursor-pointer">
            <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-gray-700 font-semibold text-lg mb-2">Upload Pet Image</p>
            <p className="text-sm text-gray-500">JPG, PNG or WebP (max 10MB)</p>
            <p className="text-xs text-purple-600 mt-2">Get instant breed identification & product recommendations</p>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={imagePreview}
              alt="Selected pet"
              className="w-full h-80 object-cover rounded-xl border-2 border-purple-200 shadow-md"
            />
            <button
              onClick={handleReset}
              className="absolute top-3 right-3 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 shadow-lg"
            >
              Change Image
            </button>
          </div>

          {/* Identify Button */}
          {!aiResults && (
            <button
              onClick={handleIdentify}
              disabled={identifying}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg transition-all"
            >
              {identifying ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Identify & Get Recommendations
                </>
              )}
            </button>
          )}

          {/* AI Results */}
          {aiResults && aiResults.predictions && aiResults.predictions.length > 0 && (
            <div className="space-y-4">
              {/* Top Prediction Card */}
              <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h4 className="font-bold text-gray-900 text-lg">AI Identification Complete</h4>
                </div>

                <div className="bg-gradient-to-r from-purple-100 via-blue-100 to-pink-100 rounded-xl p-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-600">Top Match</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {(aiResults.predictions[0].confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <h5 className="text-2xl font-bold text-gray-900 mb-2">
                    {aiResults.predictions[0].breed}
                  </h5>
                  <p className="text-sm text-gray-700 font-medium">
                    Species: <span className="text-purple-600">{aiResults.predictions[0].species}</span>
                  </p>
                </div>

                <p className="text-xs text-gray-500">
                  Processed in {aiResults.processing_time} using {aiResults.model}
                </p>
              </div>

              {/* Loading Recommendations */}
              {loadingRecommendations && (
                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200 text-center">
                  <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-blue-800 font-semibold">Finding recommendations...</p>
                  <p className="text-sm text-blue-600 mt-1">Checking inventory & products</p>
                </div>
              )}

              {/* Recommendations */}
              {recommendations && !loadingRecommendations && (
                <div className="space-y-4">
                  {/* Petshop Inventory Status */}
                  <div className={`rounded-xl p-5 border-2 ${
                    recommendations.petshopInventory.available 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-yellow-50 border-yellow-300'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Package className={`w-6 h-6 ${
                        recommendations.petshopInventory.available ? 'text-green-600' : 'text-yellow-600'
                      }`} />
                      <h5 className={`font-bold text-lg ${
                        recommendations.petshopInventory.available ? 'text-green-900' : 'text-yellow-900'
                      }`}>
                        Petshop Inventory
                      </h5>
                    </div>
                    
                    <p className={`text-sm mb-3 ${
                      recommendations.petshopInventory.available ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {recommendations.petshopInventory.message}
                    </p>

                    {recommendations.petshopInventory.available && (
                      <div className="space-y-2 mb-3">
                        {recommendations.petshopInventory.batches.slice(0, 2).map((batch, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-900">
                                {batch.availability?.available || 0} available
                              </span>
                              <span className="text-green-600 font-bold">
                                ₹{batch.price?.min} - ₹{batch.price?.max}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Age: {batch.ageRange?.min}-{batch.ageRange?.max} {batch.ageRange?.unit}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {recommendations.recommendations.viewPetshop && (
                      <button
                        onClick={handleViewPetshop}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <Package className="w-5 h-5" />
                        View in Petshop
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Ecommerce Products */}
                  <div className={`rounded-xl p-5 border-2 ${
                    recommendations.ecommerceProducts.available 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <ShoppingBag className={`w-6 h-6 ${
                        recommendations.ecommerceProducts.available ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                      <h5 className={`font-bold text-lg ${
                        recommendations.ecommerceProducts.available ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        Recommended Products
                      </h5>
                    </div>
                    
                    <p className={`text-sm mb-3 ${
                      recommendations.ecommerceProducts.available ? 'text-blue-800' : 'text-gray-800'
                    }`}>
                      {recommendations.ecommerceProducts.message}
                    </p>

                    {recommendations.ecommerceProducts.available && (
                      <>
                        {/* Featured Products Preview */}
                        {recommendations.ecommerceProducts.featuredProducts.length > 0 && (
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            {recommendations.ecommerceProducts.featuredProducts.slice(0, 4).map((product, index) => (
                              <div key={index} className="bg-white rounded-lg p-3 border border-blue-200 hover:shadow-md transition-shadow">
                                {product.image && (
                                  <img 
                                    src={product.image} 
                                    alt={product.name}
                                    className="w-full h-24 object-cover rounded-md mb-2"
                                  />
                                )}
                                <p className="text-xs font-semibold text-gray-900 line-clamp-2 mb-1">
                                  {product.name}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-blue-600">
                                    ₹{product.price}
                                  </span>
                                  {product.rating > 0 && (
                                    <span className="text-xs text-yellow-600">
                                      ★ {product.rating.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Suggested Categories */}
                        {recommendations.recommendations.suggestedCategories.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-blue-900 mb-2">Popular Categories:</p>
                            <div className="flex flex-wrap gap-2">
                              {recommendations.recommendations.suggestedCategories.map((cat, index) => (
                                <button
                                  key={index}
                                  onClick={() => navigate(cat.url)}
                                  className="px-3 py-1 bg-white border border-blue-300 rounded-full text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                  {cat.name} ({cat.productCount})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleViewProducts}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-2 shadow-md"
                        >
                          <ShoppingBag className="w-5 h-5" />
                          View All {recommendations.ecommerceProducts.totalProducts} Products
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Smart Insights */}
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <h6 className="font-bold text-purple-900">Smart Insights</h6>
                    </div>
                    <ul className="text-sm text-purple-800 space-y-1">
                      {recommendations.recommendations.viewPetshop && (
                        <li>✓ This breed is available in our petshop</li>
                      )}
                      {recommendations.recommendations.viewProducts && (
                        <li>✓ {recommendations.ecommerceProducts.totalProducts} products found for this breed</li>
                      )}
                      {recommendations.ecommerceProducts.categories.length > 0 && (
                        <li>✓ Available in {recommendations.ecommerceProducts.categories.length} categories</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Other Predictions */}
              {aiResults.predictions.length > 1 && (
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Other Possibilities:</p>
                  <div className="space-y-2">
                    {aiResults.predictions.slice(1, 4).map((pred, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => fetchRecommendations(pred.species, pred.breed)}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pred.breed}</p>
                          <p className="text-xs text-gray-500">{pred.species}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <p className="text-xs text-blue-900 leading-relaxed">
          <strong>💡 How it works:</strong> Upload a pet image → AI identifies the breed → 
          We check our petshop inventory → Find perfect products in our store → 
          Get personalized recommendations instantly!
        </p>
      </div>
    </div>
  );
};

export default AIBreedIdentifierWithRecommendations;
