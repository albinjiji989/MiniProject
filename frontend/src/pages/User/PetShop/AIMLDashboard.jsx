import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { petShopAPI } from '../../../services/api';

const UserAIMLDashboard = () => {
  const { user } = useAuth();
  const [adoptionProbabilities, setAdoptionProbabilities] = useState([]);
  const [pricePredictions, setPricePredictions] = useState([]);
  const [similarPets, setSimilarPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5001';

  const checkAdoptionProbability = async () => {
    setLoading(true);
    setMessage('Calculating adoption probability using Naive Bayes algorithm...');
    try {
      // Fetch available pets from pet shop for adoption probability calculation
      const response = await petShopAPI.listPublicListings({ 
        limit: 100, 
        status: 'available_for_sale' 
      });
      const availablePets = response.data?.data?.items || [];
      
      // Transform pet data for adoption probability analysis
      const petData = availablePets.map(pet => ({
        pet_id: pet._id,
        name: pet.name,
        species: pet.speciesId?.name || 'Unknown',
        breed: pet.breedId?.name || 'Unknown',
        age: pet.age || 0,
        size: pet.size || 'medium',
        price: pet.price || 0
      }));
      
      // Example applicant data for adoption probability (in a real app, this would come from user profile)
      const applicantData = {
        age: user?.age || 30,
        employment_status: "full_time",
        home_type: "house",
        has_garden: true,
        has_other_pets: false,
        pet_experience: "some",
        time_at_home: "8_12_hours",
        adoption_reason: "companionship"
      };
      
      // Send data to ML service for adoption probability analysis
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/predict/adoption-success-probability`, {
        applicant_features: applicantData,
        available_pets: petData
      });
      
      // Transform ML service response to match frontend format
      const formattedData = mlResponse.data.adoption_probabilities.map(prob => ({
        petName: prob.name,
        breed: prob.breed,
        probability: prob.success_probability,
        algorithm: prob.algorithm_used
      }));
      
      setAdoptionProbabilities(formattedData);
      setMessage('Adoption probability calculated using Naive Bayes algorithm!');
    } catch (error) {
      console.error('Error calculating adoption probability:', error);
      setMessage('Error calculating adoption probability: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const predictPriceTrends = async () => {
    setLoading(true);
    setMessage('Predicting price trends using Decision Tree algorithm...');
    try {
      // Fetch available pets from pet shop for price trend prediction
      const response = await petShopAPI.listPublicListings({ 
        limit: 100, 
        status: 'available_for_sale' 
      });
      const availablePets = response.data?.data?.items || [];
      
      // Transform pet data for price trend analysis
      const petData = availablePets.map(pet => ({
        pet_id: pet._id,
        name: pet.name,
        species: pet.speciesId?.name || 'Unknown',
        breed: pet.breedId?.name || 'Unknown',
        age: pet.age || 0,
        size: pet.size || 'medium',
        price: pet.price || 0,
        sales_count: pet.salesCount || 0,
        days_in_inventory: pet.createdAt ? 
          Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24)) : 30
      }));
      
      // Send data to ML service for price trend analysis
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/predict/price-trend`, {
        pets: petData
      });
      
      // Transform ML service response to match frontend format
      const formattedData = mlResponse.data.price_trends.map(trend => ({
        breed: trend.breed,
        current_price: trend.current_price,
        predicted_change: trend.predicted_change,
        timeframe: trend.timeframe,
        algorithm: trend.algorithm_used,
        confidence: 85 // Default confidence for Decision Tree
      }));
      
      setPricePredictions(formattedData);
      setMessage('Price predictions completed using Decision Tree algorithm!');
    } catch (error) {
      console.error('Error predicting prices:', error);
      setMessage('Error predicting prices: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const findSimilarPets = async () => {
    setLoading(true);
    setMessage('Finding similar pets using KNN algorithm...');
    try {
      // Fetch pets available in petshop only (for user)
      const response = await petShopAPI.listPublicListings({ 
        limit: 100, 
        status: 'available_for_sale' 
      });
      const availablePets = response.data?.data?.items || [];
      
      // Transform pet data for similarity analysis
      const petData = availablePets.map(pet => ({
        pet_id: pet._id,
        name: pet.name,
        species: pet.speciesId?.name || 'Unknown',
        breed: pet.breedId?.name || 'Unknown',
        age: pet.age || 0,
        size: pet.size || 'medium',
        price: pet.price || 0,
        date_added: pet.createdAt ? new Date(pet.createdAt) : new Date()
      }));
      
      // Example reference pet for similarity search (in a real app, this could be user's pet)
      const referencePet = petData[0] || {
        species: "Dog",
        breed: "Golden Retriever",
        size: "large",
        age: 2
      };
      
      // Send data to ML service for similarity analysis
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/predict/similar-pets`, {
        reference_pet: referencePet,
        available_pets: petData
      });
      
      // Transform ML service response to match frontend format
      const formattedData = mlResponse.data.similar_pets.map(pet => ({
        name: pet.name,
        breed: pet.breed,
        similarity: pet.similarity,
        algorithm: pet.algorithm_used
      }));
      
      setSimilarPets(formattedData);
      setMessage('Similar pets found using KNN algorithm!');
    } catch (error) {
      console.error('Error finding similar pets:', error);
      setMessage('Error finding similar pets: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">AI/ML Dashboard - Pet Shop Insights</h1>
      
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
          <li><span className="font-medium">K-Nearest Neighbors (KNN)</span> - Finds similar pets</li>
          <li><span className="font-medium">Naive Bayes</span> - Calculates adoption success probabilities</li>
          <li><span className="font-medium">Decision Tree</span> - Predicts price trends</li>
        </ul>
      </div>
      
      {/* Adoption Probability Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Adoption Success Probability</h2>
          <button 
            onClick={checkAdoptionProbability}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Check Probability'}
          </button>
        </div>
        
        {adoptionProbabilities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Pet Name</th>
                  <th className="py-2 px-4 border-b">Breed</th>
                  <th className="py-2 px-4 border-b">Success Probability</th>
                  <th className="py-2 px-4 border-b">Algorithm Used</th>
                </tr>
              </thead>
              <tbody>
                {adoptionProbabilities.map((pet, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{pet.petName}</td>
                    <td className="py-2 px-4 border-b">{pet.breed}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded ${
                        pet.probability > 0.8 
                          ? 'bg-green-100 text-green-800' 
                          : pet.probability > 0.7
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {(pet.probability * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {pet.algorithm}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No adoption probabilities available. Click "Check Probability" to calculate using Naive Bayes algorithm.</p>
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
            {loading ? 'Predicting...' : 'Predict Prices'}
          </button>
        </div>
        
        {pricePredictions.length > 0 ? (
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
                {pricePredictions.map((prediction, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{prediction.breed}</td>
                    <td className="py-2 px-4 border-b font-medium">${prediction.current_price}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded ${
                        prediction.predicted_change > 0 
                          ? 'bg-green-100 text-green-800' 
                          : prediction.predicted_change < 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {prediction.predicted_change > 0 ? '+' : ''}{prediction.predicted_change.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">{prediction.timeframe}</td>
                    <td className="py-2 px-4 border-b">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {prediction.algorithm}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No price predictions available. Click "Predict Prices" to load data using Decision Tree algorithm.</p>
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
                        {pet.algorithm}
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

export default UserAIMLDashboard;