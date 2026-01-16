import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Plus } from 'lucide-react';
import AIBreedIdentifierWithStock from '../../../components/Petshop/AIBreedIdentifierWithStock';

/**
 * Manager Petshop AI Identifier Page
 * Allows managers to identify pet breeds for inventory management
 */
const ManagerAIBreedIdentifier = () => {
  const navigate = useNavigate();
  const [identifiedPet, setIdentifiedPet] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleBreedIdentified = (result) => {
    console.log('Breed identified for inventory:', result);
    setIdentifiedPet(result);
    setShowAddForm(true);
  };

  const handleAddToInventory = () => {
    // Navigate to add stock page with pre-filled data
    navigate('/manager/petshop/add-stock', {
      state: {
        species: identifiedPet.species,
        breed: identifiedPet.breed,
        aiConfidence: identifiedPet.confidence
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/manager/petshop')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    AI Breed Identifier
                  </h1>
                  <p className="text-gray-600">
                    Identify breeds for inventory management
                  </p>
                </div>
              </div>
              
              {identifiedPet && (
                <button
                  onClick={handleAddToInventory}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-5 h-5" />
                  Add to Inventory
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Identifier */}
          <div className="lg:col-span-2">
            <AIBreedIdentifierWithStock
              onBreedIdentified={handleBreedIdentified}
              userType="manager"
              showStockCheck={true}
            />

            {/* Quick Actions after Identification */}
            {showAddForm && identifiedPet && (
              <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleAddToInventory}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-5 h-5" />
                    Add New Stock
                  </button>

                  <button
                    onClick={() => navigate('/manager/petshop/inventory')}
                    className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700"
                  >
                    View Existing Stock
                  </button>

                  <button
                    onClick={() => navigate('/manager/petshop/batches')}
                    className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700"
                  >
                    Manage Batches
                  </button>

                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50"
                  >
                    Identify Another Pet
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Manager Guide */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Manager Guide
              </h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Upload Pet Image</p>
                    <p className="text-xs text-gray-600">
                      Upload a photo of the pet you want to add to inventory
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">AI Identifies Breed</p>
                    <p className="text-xs text-gray-600">
                      Get instant breed identification with confidence scores
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Check Existing Stock</p>
                    <p className="text-xs text-gray-600">
                      See if you already have this breed in inventory
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    4
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Add to Inventory</p>
                    <p className="text-xs text-gray-600">
                      Create new stock or update existing batches
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Identified Pet Summary */}
            {identifiedPet && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-sm p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Identified Pet
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Breed</p>
                    <p className="text-xl font-bold text-gray-900">
                      {identifiedPet.breed}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Species</p>
                    <p className="text-lg font-medium text-gray-900">
                      {identifiedPet.species}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">AI Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${identifiedPet.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-blue-600">
                        {(identifiedPet.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Stock</p>
                    <p className={`text-lg font-bold ${
                      identifiedPet.stockAvailable ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {identifiedPet.stockAvailable ? 'In Stock' : 'Not in Stock'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                AI Statistics
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Model</span>
                  <span className="font-medium text-gray-900">MobileNetV2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accuracy</span>
                  <span className="font-medium text-gray-900">80-90%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Time</span>
                  <span className="font-medium text-gray-900">{'<'} 1 second</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supported Breeds</span>
                  <span className="font-medium text-gray-900">100+</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <h4 className="font-bold text-yellow-900 mb-2">💡 Pro Tips</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Use clear, well-lit photos</li>
                <li>• Show the pet's face and body</li>
                <li>• Avoid blurry or dark images</li>
                <li>• Multiple angles improve accuracy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerAIBreedIdentifier;
