import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { petShopManagerAPI } from '../../../services/api';

const PetShopAIMLDashboard = () => {
  const { user } = useAuth();
  const [inventoryPredictions, setInventoryPredictions] = useState([]);
  const [priceTrends, setPriceTrends] = useState([]);
  const [similarPets, setSimilarPets] = useState([]);
  const [restockPredictions, setRestockPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5001';

  const predictInventoryNeeds = async () => {
    setLoading(true);
    setMessage('Analyzing inventory needs using SVM algorithm...');
    try {
      // Fetch actual inventory data from the backend
      const response = await petShopManagerAPI.listInventory({ limit: 100 });
      const inventoryItems = response.data?.data?.items || [];
      
      // Transform inventory data for ML analysis
      const petData = inventoryItems.map(item => ({
        pet_id: item._id,
        name: item.name,
        species: item.speciesId?.name || 'Unknown',
        breed: item.breedId?.name || 'Unknown',
        age: item.age || 0,
        size: item.size || 'medium',
        current_status: item.status || 'in_petshop',
        price: item.price || 0,
        date_added: item.createdAt ? new Date(item.createdAt) : new Date(),
        // Add real sales data if available
        sales_count: item.salesCount || 0,
        days_in_inventory: item.createdAt ? 
          Math.floor((new Date() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24)) : 30
      }));
      
      // Send data to ML service for analysis
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/inventory/predict-restock`, {
        pets: petData
      });
      
      setInventoryPredictions(mlResponse.data.predictions || []);
      setMessage('Inventory analysis completed using SVM algorithm!');
    } catch (error) {
      console.error('Error predicting inventory needs:', error);
      setMessage('Error analyzing inventory: ' + (error.response?.data?.error || error.message || 'Failed to fetch inventory data'));
    } finally {
      setLoading(false);
    }
  };

  const predictRestockNeedsWithNaiveBayes = async () => {
    setLoading(true);
    setMessage('Analyzing restock needs using Naive Bayes algorithm...');
    try {
      // Fetch actual inventory data from the backend
      const response = await petShopManagerAPI.listInventory({ limit: 100 });
      const inventoryItems = response.data?.data?.items || [];
      
      // Transform inventory data for ML analysis
      const petData = inventoryItems.map(item => ({
        pet_id: item._id,
        name: item.name,
        species: item.speciesId?.name || 'Unknown',
        breed: item.breedId?.name || 'Unknown',
        age: item.age || 0,
        size: item.size || 'medium',
        current_status: item.status || 'in_petshop',
        price: item.price || 0,
        date_added: item.createdAt ? new Date(item.createdAt) : new Date(),
        // Add real sales data if available
        sales_count: item.salesCount || 0,
        days_in_inventory: item.createdAt ? 
          Math.floor((new Date() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24)) : 30
      }));
      
      // Send data to ML service for analysis
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/inventory/predict-restock`, {
        pets: petData
      });
      
      // Filter to show only Naive Bayes predictions for pets that need restocking
      const nbPredictions = (mlResponse.data.predictions || [])
        .map(prediction => ({
          ...prediction,
          nb_prediction: prediction.predictions?.naive_bayes || { need_restock: false, confidence: 0 }
        }))
        .filter(prediction => prediction.nb_prediction?.need_restock);
      
      setRestockPredictions(nbPredictions);
      setMessage('Restock analysis completed using Naive Bayes algorithm!');
    } catch (error) {
      console.error('Error predicting restock needs:', error);
      setMessage('Error analyzing restock needs: ' + (error.response?.data?.error || error.message || 'Failed to fetch inventory data'));
    } finally {
      setLoading(false);
    }
  };

  const predictPriceTrends = async () => {
    setLoading(true);
    setMessage('Analyzing price trends using Decision Tree algorithm...');
    try {
      // Fetch actual inventory data from the backend
      const response = await petShopManagerAPI.listInventory({ limit: 100 });
      const inventoryItems = response.data?.data?.items || [];
      
      // Transform inventory data for price trend analysis
      const petData = inventoryItems.map(item => ({
        pet_id: item._id,
        name: item.name,
        species: item.speciesId?.name || 'Unknown',
        breed: item.breedId?.name || 'Unknown',
        age: item.age || 0,
        size: item.size || 'medium',
        current_status: item.status || 'in_petshop',
        price: item.price || 0,
        date_added: item.createdAt ? new Date(item.createdAt) : new Date(),
        sales_count: item.salesCount || 0,
        days_in_inventory: item.createdAt ? 
          Math.floor((new Date() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24)) : 30
      }));
      
      // Send data to ML service for price trend analysis
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/predict/price-trend`, {
        pets: petData
      });
      
      setPriceTrends(mlResponse.data.price_trends || []);
      setMessage('Price trend analysis completed using Decision Tree algorithm!');
    } catch (error) {
      console.error('Error predicting price trends:', error);
      setMessage('Error predicting price trends: ' + (error.response?.data?.error || error.message || 'Failed to fetch inventory data'));
    } finally {
      setLoading(false);
    }
  };

  const findSimilarPets = async () => {
    setLoading(true);
    setMessage('Finding similar pets using KNN algorithm...');
    try {
      // Fetch all pets from the backend (both released and not released)
      const response = await petShopManagerAPI.listInventory({ limit: 100 });
      const allPets = response.data?.data?.items || [];
      
      // Transform pet data for similarity analysis
      const petData = allPets.map(pet => ({
        pet_id: pet._id,
        name: pet.name,
        species: pet.speciesId?.name || 'Unknown',
        breed: pet.breedId?.name || 'Unknown',
        age: pet.age || 0,
        size: pet.size || 'medium',
        status: pet.status || 'in_petshop',
        price: pet.price || 0,
        date_added: pet.createdAt ? new Date(pet.createdAt) : new Date()
      }));
      
      // Example reference pet for similarity search
      const referencePet = petData[0] || {
        species: "Dog",
        breed: "Golden Retriever",
        size: "large",
        age: 2
      };
      
      // Send data to ML service for similarity analysis
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/predict/similar-pets`, {
        reference_pet: referencePet,
        all_pets: petData
      });
      
      setSimilarPets(mlResponse.data.similar_pets || []);
      setMessage('Similar pets found using KNN algorithm!');
    } catch (error) {
      console.error('Error finding similar pets:', error);
      setMessage('Error finding similar pets: ' + (error.response?.data?.error || error.message || 'Failed to fetch inventory data'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">AI/ML Dashboard - Pet Shop Manager</h1>
      
      {/* Status Message */}
      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      {/* Information about algorithms used */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">ML Algorithms Used:</h3>
        <ul className="list-disc pl-5 text-blue-700 space-y-1">
          <li><span className="font-medium">K-Nearest Neighbors (KNN)</span> - Finds similar pets and customers</li>
          <li><span className="font-medium">Decision Tree</span> - Predicts price trends and classifies inventory needs</li>
          <li><span className="font-medium">Naive Bayes</span> - Calculates probabilities for customer behavior and restock predictions</li>
          <li><span className="font-medium">Support Vector Machine (SVM)</span> - Determines inventory restock needs</li>
        </ul>
      </div>
      
      {/* Inventory Management Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Inventory Management</h2>
          <button 
            onClick={predictInventoryNeeds}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
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
                  <th className="py-2 px-4 border-b">Price</th>
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
                    <td className="py-2 px-4 border-b">${prediction.price}</td>
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
          <p className="text-gray-500">No inventory analysis available. Click "Analyze Inventory" to check stock levels using SVM algorithm.</p>
        )}
      </div>
      
      {/* Restock Prediction with Naive Bayes Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Restock Prediction (Naive Bayes)</h2>
          <button 
            onClick={predictRestockNeedsWithNaiveBayes}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Restock Needs'}
          </button>
        </div>
        
        {restockPredictions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Pet Name</th>
                  <th className="py-2 px-4 border-b">Species/Breed</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  <th className="py-2 px-4 border-b">Price</th>
                  <th className="py-2 px-4 border-b">Restock Needed</th>
                  <th className="py-2 px-4 border-b">Confidence</th>
                  <th className="py-2 px-4 border-b">Recommended Qty</th>
                  <th className="py-2 px-4 border-b">Algorithm Used</th>
                </tr>
              </thead>
              <tbody>
                {restockPredictions.map((prediction, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{prediction.name}</td>
                    <td className="py-2 px-4 border-b">{prediction.species}/{prediction.breed}</td>
                    <td className="py-2 px-4 border-b">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {prediction.current_status}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">${prediction.price}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${
                        prediction.nb_prediction?.need_restock 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {prediction.nb_prediction?.need_restock ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${
                        prediction.nb_prediction?.confidence > 0.8 
                          ? 'bg-green-100 text-green-800' 
                          : prediction.nb_prediction?.confidence > 0.6
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {(prediction.nb_prediction?.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className="font-medium">{prediction.recommended_quantity}</span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        Naive Bayes
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No restock predictions available. Click "Analyze Restock Needs" to check stock levels using Naive Bayes algorithm.</p>
        )}
      </div>
      
      {/* Price Trends Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Price Trend Predictions</h2>
          <button 
            onClick={predictPriceTrends}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Trends'}
          </button>
        </div>
        
        {priceTrends.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Breed</th>
                  <th className="py-2 px-4 border-b">Current Price</th>
                  <th className="py-2 px-4 border-b">Predicted Change</th>
                  <th className="py-2 px-4 border-b">Timeframe</th>
                  <th className="py-2 px-4 border-b">Algorithm Used</th>
                </tr>
              </thead>
              <tbody>
                {priceTrends.map((trend, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{trend.breed}</td>
                    <td className="py-2 px-4 border-b font-medium">${trend.current_price}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${
                        trend.predicted_change > 0 
                          ? 'bg-green-100 text-green-800' 
                          : trend.predicted_change < 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {trend.predicted_change > 0 ? '+' : ''}{trend.predicted_change}%
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">{trend.timeframe}</td>
                    <td className="py-2 px-4 border-b">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        Decision Tree
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No price trends available. Click "Analyze Trends" to load data using Decision Tree algorithm.</p>
        )}
      </div>
      
      {/* Similar Pets Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Similar Pets Finder</h2>
          <button 
            onClick={findSimilarPets}
            disabled={loading}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Finding...' : 'Find Similar Pets'}
          </button>
        </div>
        
        {similarPets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Pet Name</th>
                  <th className="py-2 px-4 border-b">Breed</th>
                  <th className="py-2 px-4 border-b">Similarity Score</th>
                  <th className="py-2 px-4 border-b">Algorithm Used</th>
                </tr>
              </thead>
              <tbody>
                {similarPets.map((pet, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{pet.name}</td>
                    <td className="py-2 px-4 border-b">{pet.breed}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded ${
                        pet.similarity > 0.9 
                          ? 'bg-green-100 text-green-800' 
                          : pet.similarity > 0.8
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {(pet.similarity * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        KNN - K-Nearest Neighbors
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No similar pets found. Click "Find Similar Pets" to search using KNN algorithm.</p>
        )}
      </div>
    </div>
  );
};

export default PetShopAIMLDashboard;