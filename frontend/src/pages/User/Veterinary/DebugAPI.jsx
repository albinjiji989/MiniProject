import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { petsAPI, adoptionAPI, petShopAPI, userPetsAPI, apiClient } from '../../../services/api';
import UserLayout from '../../../components/Layout/UserLayout';

export default function DebugAPI() {
  const [apiResults, setApiResults] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const testAllAPIs = async () => {
    setLoading(true);
    const results = {};
    
    try {
      // Test userPetsAPI.list() - PetNew model
      try {
        const res1 = await userPetsAPI.list();
        results.userPetsAPI = {
          status: 'success',
          data: res1.data,
          message: 'PetNew model pets loaded successfully'
        };
      } catch (error) {
        results.userPetsAPI = {
          status: 'error',
          error: error.message,
          message: 'Failed to load PetNew model pets'
        };
      }

      // Test petsAPI.getMyPets() - Core owned pets
      try {
        const res2 = await petsAPI.getMyPets();
        results.petsAPI = {
          status: 'success',
          data: res2.data,
          message: 'Core owned pets loaded successfully'
        };
      } catch (error) {
        results.petsAPI = {
          status: 'error',
          error: error.message,
          message: 'Failed to load core owned pets'
        };
      }

      // Test adoptionAPI.getMyAdoptedPets() - Adopted pets
      try {
        const res3 = await adoptionAPI.getMyAdoptedPets();
        results.adoptionAPI = {
          status: 'success',
          data: res3.data,
          message: 'Adopted pets loaded successfully'
        };
      } catch (error) {
        results.adoptionAPI = {
          status: 'error',
          error: error.message,
          message: 'Failed to load adopted pets'
        };
      }

      // Test petShopAPI.getMyPurchasedPets() - Purchased pets
      try {
        const res4 = await petShopAPI.getMyPurchasedPets();
        results.petShopAPI = {
          status: 'success',
          data: res4.data,
          message: 'Purchased pets loaded successfully'
        };
      } catch (error) {
        results.petShopAPI = {
          status: 'error',
          error: error.message,
          message: 'Failed to load purchased pets'
        };
      }

      // Test dashboard APIs like the user dashboard does
      try {
        const [petsRes, ownedRes, resvRes, adoptedRes] = await Promise.allSettled([
          userPetsAPI.list(),
          apiClient.get('/pets/my-pets'),
          apiClient.get('/petshop/user/public/reservations'),
          adoptionAPI.getMyAdoptedPets()
        ]);
        
        results.dashboardAPIs = {
          userPetsAPI: petsRes,
          corePetsAPI: ownedRes,
          petshopReservationsAPI: resvRes,
          adoptionAPI: adoptedRes
        };
      } catch (error) {
        results.dashboardAPIs = {
          status: 'error',
          error: error.message
        };
      }

      setApiResults(results);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAllAPIs();
  }, []);

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">API Debug Tool</h1>
            <button
              onClick={testAllAPIs}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test All APIs'}
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">API Test Results</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {Object.keys(apiResults).length === 0 ? (
                <p className="text-gray-500">Loading test results...</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(apiResults).map(([key, result]) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{key}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.status || 'unknown'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>{result.message || result.error}</p>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-indigo-600">View Data</summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                        {result.error && (
                          <p className="mt-1 text-red-600">Error: {result.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/user/veterinary')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Veterinary
            </button>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}