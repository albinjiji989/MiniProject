import React, { useState, useEffect } from 'react';
import { petsAPI, adoptionAPI, petShopAPI } from '../../../services/api';
import UserLayout from '../../../components/Layout/UserLayout';

export default function TestVeterinaryAPI() {
  const [results, setResults] = useState({
    ownedPets: null,
    adoptedPets: null,
    purchasedPets: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testAPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Testing API calls...');
      
      // Test owned pets
      console.log('Testing owned pets API...');
      const ownedPetsRes = await petsAPI.getMyPets();
      console.log('Owned pets result:', ownedPetsRes);
      setResults(prev => ({ ...prev, ownedPets: ownedPetsRes }));
      
      // Test adopted pets
      console.log('Testing adopted pets API...');
      const adoptedPetsRes = await adoptionAPI.getMyAdoptedPets();
      console.log('Adopted pets result:', adoptedPetsRes);
      setResults(prev => ({ ...prev, adoptedPets: adoptedPetsRes }));
      
      // Test purchased pets
      console.log('Testing purchased pets API...');
      const purchasedPetsRes = await petShopAPI.getMyPurchasedPets();
      console.log('Purchased pets result:', purchasedPetsRes);
      setResults(prev => ({ ...prev, purchasedPets: purchasedPetsRes }));
      
    } catch (err) {
      console.error('API test error:', err);
      setError(err.message || 'Failed to test APIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPIs();
  }, []);

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Veterinary API Test</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Owned Pets</h2>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
                  {results.ownedPets ? JSON.stringify(results.ownedPets, null, 2) : 'No data'}
                </pre>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Adopted Pets</h2>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
                  {results.adoptedPets ? JSON.stringify(results.adoptedPets, null, 2) : 'No data'}
                </pre>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Purchased Pets</h2>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
                  {results.purchasedPets ? JSON.stringify(results.purchasedPets, null, 2) : 'No data'}
                </pre>
              </div>
              
              <button
                onClick={testAPIs}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Test Again
              </button>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}