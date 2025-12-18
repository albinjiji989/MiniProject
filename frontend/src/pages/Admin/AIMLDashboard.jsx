import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AdminAIMLDashboard = () => {
  const { user } = useAuth();
  const [modelsStatus, setModelsStatus] = useState({
    knn: { accuracy: 0, status: 'Not Trained' },
    decision_tree: { accuracy: 0, status: 'Not Trained' },
    naive_bayes: { accuracy: 0, status: 'Not Trained' },
    svm: { accuracy: 0, status: 'Not Trained' }
  });
  const [recommendations, setRecommendations] = useState([]);
  const [inventoryPredictions, setInventoryPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5001';

  const trainModels = async () => {
    setLoading(true);
    setMessage('Training models...');
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/api/train-models`);
      
      setModelsStatus({
        knn: { accuracy: response.data.accuracy.knn, status: 'Trained' },
        decision_tree: { accuracy: response.data.accuracy.decision_tree, status: 'Trained' },
        naive_bayes: { accuracy: response.data.accuracy.naive_bayes, status: 'Trained' },
        svm: { accuracy: response.data.accuracy.svm, status: 'Trained' }
      });
      
      setMessage('Models trained successfully!');
    } catch (error) {
      console.error('Error training models:', error);
      setMessage('Error training models: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    setMessage('Fetching recommendations...');
    try {
      // In a real implementation, this would fetch actual user data
      // For now, we'll use a placeholder user ID
      const userId = '12345';
      const response = await axios.get(`${ML_SERVICE_URL}/api/recommendations/user/${userId}`);
      
      setRecommendations(response.data.recommendations || []);
      setMessage('Recommendations fetched!');
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setMessage('Error fetching recommendations: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const predictInventoryNeeds = async () => {
    setLoading(true);
    setMessage('Analyzing inventory needs...');
    try {
      // Example inventory data for prediction
      const inventoryData = {
        pets: [
          { pet_id: '1', name: 'Buddy', species: 'Dog', breed: 'Golden Retriever', age: 2, size: 'large', current_status: 'available_for_sale' },
          { pet_id: '2', name: 'Whiskers', species: 'Cat', breed: 'Persian', age: 1, size: 'small', current_status: 'available_for_sale' },
          { pet_id: '3', name: 'Charlie', species: 'Dog', breed: 'Labrador', age: 3, size: 'large', current_status: 'available_for_sale' }
        ]
      };
      
      const response = await axios.post(`${ML_SERVICE_URL}/api/inventory/predict-restock`, inventoryData);
      
      setInventoryPredictions(response.data.predictions || []);
      setMessage('Inventory analysis completed!');
    } catch (error) {
      console.error('Error predicting inventory needs:', error);
      setMessage('Error analyzing inventory: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">AI/ML Dashboard - Admin</h1>
      
      {/* Status Message */}
      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      {/* Model Training Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Model Training</h2>
          <button 
            onClick={trainModels}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Training...' : 'Train Models'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">K-Nearest Neighbors</h3>
            <p className="text-gray-600">Accuracy: {(modelsStatus.knn.accuracy * 100).toFixed(2)}%</p>
            <p className="text-gray-600">Status: {modelsStatus.knn.status}</p>
            <p className="text-gray-600 mt-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                Used for: Similarity-based recommendations
              </span>
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">Decision Tree</h3>
            <p className="text-gray-600">Accuracy: {(modelsStatus.decision_tree.accuracy * 100).toFixed(2)}%</p>
            <p className="text-gray-600">Status: {modelsStatus.decision_tree.status}</p>
            <p className="text-gray-600 mt-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                Used for: Classification and price trends
              </span>
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">Naive Bayes</h3>
            <p className="text-gray-600">Accuracy: {(modelsStatus.naive_bayes.accuracy * 100).toFixed(2)}%</p>
            <p className="text-gray-600">Status: {modelsStatus.naive_bayes.status}</p>
            <p className="text-gray-600 mt-2">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                Used for: Probability calculations
              </span>
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">Support Vector Machine</h3>
            <p className="text-gray-600">Accuracy: {(modelsStatus.svm.accuracy * 100).toFixed(2)}%</p>
            <p className="text-gray-600">Status: {modelsStatus.svm.status}</p>
            <p className="text-gray-600 mt-2">
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                Used for: Complex pattern recognition
              </span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Recommendations Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Pet Recommendations</h2>
          <button 
            onClick={fetchRecommendations}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Fetching...' : 'Fetch Recommendations'}
          </button>
        </div>
        
        {recommendations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Pet Name</th>
                  <th className="py-2 px-4 border-b">Category</th>
                  <th className="py-2 px-4 border-b">Species</th>
                  <th className="py-2 px-4 border-b">Breed</th>
                  <th className="py-2 px-4 border-b">Price</th>
                  <th className="py-2 px-4 border-b">Algorithm Used</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((pet, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{pet.name}</td>
                    <td className="py-2 px-4 border-b">{pet.category}</td>
                    <td className="py-2 px-4 border-b">{pet.species}</td>
                    <td className="py-2 px-4 border-b">{pet.breed}</td>
                    <td className="py-2 px-4 border-b">${pet.price}</td>
                    <td className="py-2 px-4 border-b">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        KNN - K-Nearest Neighbors
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No recommendations available. Click "Fetch Recommendations" to load data.</p>
        )}
      </div>
      
      {/* Inventory Management Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Inventory Management</h2>
          <button 
            onClick={predictInventoryNeeds}
            disabled={loading}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Inventory'}
          </button>
        </div>
        
        {inventoryPredictions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Pet Name</th>
                  <th className="py-2 px-4 border-b">Species/Breed</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  <th className="py-2 px-4 border-b">Restock Needed</th>
                  <th className="py-2 px-4 border-b">Confidence</th>
                  <th className="py-2 px-4 border-b">Recommended Qty</th>
                  <th className="py-2 px-4 border-b">Algorithm Used</th>
                </tr>
              </thead>
              <tbody>
                {inventoryPredictions.map((prediction, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{prediction.name}</td>
                    <td className="py-2 px-4 border-b">{prediction.species}/{prediction.breed}</td>
                    <td className="py-2 px-4 border-b">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {prediction.current_status}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${
                        prediction.need_restock 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {prediction.need_restock ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${
                        prediction.confidence > 0.8 
                          ? 'bg-green-100 text-green-800' 
                          : prediction.confidence > 0.6
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {(prediction.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className="font-medium">{prediction.recommended_quantity}</span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        SVM - Support Vector Machine
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No inventory analysis available. Click "Analyze Inventory" to check stock levels.</p>
        )}
      </div>
    </div>
  );
};

export default AdminAIMLDashboard;