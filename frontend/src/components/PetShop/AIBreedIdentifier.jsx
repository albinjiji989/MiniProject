import { useState } from 'react';
import { Upload, Sparkles, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import aiService from '../../services/aiService';

/**
 * AI-Powered Breed Identifier Component
 * Uses MobileNetV2 CNN for real-time pet breed identification
 */
const AIBreedIdentifier = ({ onBreedIdentified, speciesFilter = null }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [identifying, setIdentifying] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setSelectedImage(file);
    setError(null);
    setResults(null);

    // Create preview
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
      const response = speciesFilter
        ? await aiService.getBreedSuggestions(selectedImage, speciesFilter)
        : await aiService.identifyBreed(selectedImage, 5);

      if (response.success) {
        setResults(response.data);
        
        // Notify parent component if callback provided
        if (onBreedIdentified && response.data.predictions.length > 0) {
          const topPrediction = response.data.predictions[0];
          onBreedIdentified({
            species: topPrediction.species,
            breed: topPrediction.breed,
            confidence: topPrediction.confidence
          });
        }
      } else {
        setError(response.error || 'Failed to identify breed');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to AI service');
    } finally {
      setIdentifying(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-600 rounded-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">AI Breed Identifier</h3>
          <p className="text-sm text-gray-600">Powered by MobileNetV2 CNN</p>
        </div>
      </div>

      {/* Upload Area */}
      {!imagePreview ? (
        <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center bg-white">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageSelect}
            className="hidden"
            id="ai-image-upload"
          />
          <label htmlFor="ai-image-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">Upload Pet Image</p>
            <p className="text-sm text-gray-500">JPG, PNG or WebP (max 10MB)</p>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={imagePreview}
              alt="Selected pet"
              className="w-full h-64 object-cover rounded-lg border-2 border-purple-200"
            />
            <button
              onClick={handleReset}
              className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
            >
              Change Image
            </button>
          </div>

          {/* Identify Button */}
          {!results && (
            <button
              onClick={handleIdentify}
              disabled={identifying}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {identifying ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Analyzing Image...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Identify Breed
                </>
              )}
            </button>
          )}

          {/* Results */}
          {results && results.predictions && results.predictions.length > 0 && (
            <div className="bg-white rounded-lg p-4 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-bold text-gray-900">Identification Results</h4>
              </div>

              {/* Processing Time */}
              <p className="text-xs text-gray-500 mb-3">
                Processed in {results.processing_time} using {results.model}
              </p>

              {/* Top Prediction */}
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Top Match</span>
                  <span className="text-lg font-bold text-purple-600">
                    {(results.predictions[0].confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <h5 className="text-xl font-bold text-gray-900 mb-1">
                  {results.predictions[0].breed}
                </h5>
                <p className="text-sm text-gray-600">
                  Species: {results.predictions[0].species}
                </p>
              </div>

              {/* Other Predictions */}
              {results.predictions.length > 1 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Other Possibilities:</p>
                  <div className="space-y-2">
                    {results.predictions.slice(1, 4).map((pred, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
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

              {/* Use This Result Button */}
              <button
                onClick={() => {
                  if (onBreedIdentified) {
                    const topPred = results.predictions[0];
                    onBreedIdentified({
                      species: topPred.species,
                      breed: topPred.breed,
                      confidence: topPred.confidence
                    });
                  }
                  handleReset();
                }}
                className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
              >
                Use This Result
              </button>
            </div>
          )}

          {/* No Results */}
          {results && results.predictions && results.predictions.length === 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h4 className="font-bold text-yellow-900">No Confident Predictions</h4>
              </div>
              <p className="text-sm text-yellow-800">
                The AI couldn't confidently identify the breed. Please try a clearer image.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>💡 Tip:</strong> For best results, use clear, well-lit photos showing the pet's face and body.
          The AI model is trained on ImageNet with 14M+ images.
        </p>
      </div>
    </div>
  );
};

export default AIBreedIdentifier;
