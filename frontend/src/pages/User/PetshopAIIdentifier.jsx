import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import AIBreedIdentifierWithStock from '../../components/Petshop/AIBreedIdentifierWithStock';
import { useAuth } from '../../contexts/AuthContext';

/**
 * User Petshop AI Identifier Page
 * Allows users to identify pet breeds and check stock availability
 */
const PetshopAIIdentifier = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [identifiedPet, setIdentifiedPet] = useState(null);

  const handleBreedIdentified = (result) => {
    console.log('Breed identified:', result);
    setIdentifiedPet(result);
    
    // Optionally navigate to petshop with filters
    if (result.stockAvailable) {
      // Could navigate to filtered petshop view
      // navigate(`/User/petshop?species=${result.species}&breed=${result.breed}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/User/petshop')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Petshop
            </button>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    AI Pet Identifier
                  </h1>
                  <p className="text-gray-600">
                    Find your perfect pet match using AI technology
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Identifier Component */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AIBreedIdentifierWithStock
                onBreedIdentified={handleBreedIdentified}
                userType="user"
                showStockCheck={true}
              />
            </div>

            {/* Info Sidebar */}
            <div className="space-y-6">
              {/* How it Works */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  How It Works
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Upload Image</p>
                      <p className="text-xs text-gray-600">
                        Upload a clear photo of the pet you're interested in
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">AI Analysis</p>
                      <p className="text-xs text-gray-600">
                        Our AI identifies the breed using advanced CNN technology
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Check Stock</p>
                      <p className="text-xs text-gray-600">
                        Instantly see if we have that breed available
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                      4
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">View & Purchase</p>
                      <p className="text-xs text-gray-600">
                        Browse available pets and make your purchase
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identified Pet Info */}
              {identifiedPet && (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-sm p-6 border-2 border-green-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Last Identified
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Breed</p>
                      <p className="text-lg font-bold text-gray-900">
                        {identifiedPet.breed}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Species</p>
                      <p className="font-medium text-gray-900">
                        {identifiedPet.species}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p className="font-medium text-gray-900">
                        {(identifiedPet.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Stock Status</p>
                      <p className={`font-bold ${
                        identifiedPet.stockAvailable ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {identifiedPet.stockAvailable ? '✅ Available' : '⚠️ Not in Stock'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Technology Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  AI Technology
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Model:</strong> MobileNetV2
                  </p>
                  <p>
                    <strong>Accuracy:</strong> 80-90% for common breeds
                  </p>
                  <p>
                    <strong>Speed:</strong> Results in under 1 second
                  </p>
                  <p>
                    <strong>Training:</strong> 14M+ images from ImageNet
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default PetshopAIIdentifier;
