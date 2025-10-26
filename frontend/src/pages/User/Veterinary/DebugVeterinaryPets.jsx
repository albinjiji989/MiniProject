import React, { useState, useEffect } from 'react';
import { petsAPI, adoptionAPI, petShopAPI } from '../../../services/api';
import UserLayout from '../../../components/Layout/UserLayout';

export default function DebugVeterinaryPets() {
  const [debugInfo, setDebugInfo] = useState({
    ownedPets: { loading: false, data: null, error: null },
    adoptedPets: { loading: false, data: null, error: null },
    purchasedPets: { loading: false, data: null, error: null }
  });
  const [allPets, setAllPets] = useState([]);

  const loadOwnedPets = async () => {
    setDebugInfo(prev => ({
      ...prev,
      ownedPets: { loading: true, data: null, error: null }
    }));
    
    try {
      console.log('Calling petsAPI.getMyPets()');
      const response = await petsAPI.getMyPets();
      console.log('Owned pets response:', response);
      setDebugInfo(prev => ({
        ...prev,
        ownedPets: { loading: false, data: response, error: null }
      }));
    } catch (error) {
      console.error('Owned pets error:', error);
      setDebugInfo(prev => ({
        ...prev,
        ownedPets: { loading: false, data: null, error: error.message || 'Unknown error' }
      }));
    }
  };

  const loadAdoptedPets = async () => {
    setDebugInfo(prev => ({
      ...prev,
      adoptedPets: { loading: true, data: null, error: null }
    }));
    
    try {
      console.log('Calling adoptionAPI.getMyAdoptedPets()');
      const response = await adoptionAPI.getMyAdoptedPets();
      console.log('Adopted pets response:', response);
      setDebugInfo(prev => ({
        ...prev,
        adoptedPets: { loading: false, data: response, error: null }
      }));
    } catch (error) {
      console.error('Adopted pets error:', error);
      setDebugInfo(prev => ({
        ...prev,
        adoptedPets: { loading: false, data: null, error: error.message || 'Unknown error' }
      }));
    }
  };

  const loadPurchasedPets = async () => {
    setDebugInfo(prev => ({
      ...prev,
      purchasedPets: { loading: true, data: null, error: null }
    }));
    
    try {
      console.log('Calling petShopAPI.getMyPurchasedPets()');
      const response = await petShopAPI.getMyPurchasedPets();
      console.log('Purchased pets response:', response);
      setDebugInfo(prev => ({
        ...prev,
        purchasedPets: { loading: false, data: response, error: null }
      }));
    } catch (error) {
      console.error('Purchased pets error:', error);
      setDebugInfo(prev => ({
        ...prev,
        purchasedPets: { loading: false, data: null, error: error.message || 'Unknown error' }
      }));
    }
  };

  const loadAllPets = async () => {
    await Promise.all([
      loadOwnedPets(),
      loadAdoptedPets(),
      loadPurchasedPets()
    ]);
  };

  const combinePets = () => {
    const pets = [];
    
    // Add owned pets
    if (debugInfo.ownedPets.data?.data?.data) {
      debugInfo.ownedPets.data.data.data.forEach(pet => {
        pets.push({ ...pet, source: 'owned', sourceLabel: 'Owned Pet' });
      });
    }
    
    // Add adopted pets
    if (debugInfo.adoptedPets.data?.data?.data) {
      debugInfo.adoptedPets.data.data.data.forEach(pet => {
        pets.push({ ...pet, source: 'adopted', sourceLabel: 'Adopted Pet' });
      });
    }
    
    // Add purchased pets
    if (debugInfo.purchasedPets.data?.data?.data) {
      debugInfo.purchasedPets.data.data.data.forEach(pet => {
        pets.push({ ...pet, source: 'purchased', sourceLabel: 'Purchased Pet' });
      });
    }
    
    setAllPets(pets);
  };

  useEffect(() => {
    combinePets();
  }, [debugInfo]);

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Debug Veterinary Pets</h1>
          
          <div className="mb-6">
            <button
              onClick={loadAllPets}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Load All Pets
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Owned Pets */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Owned Pets</h2>
              <button
                onClick={loadOwnedPets}
                disabled={debugInfo.ownedPets.loading}
                className="mb-2 inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {debugInfo.ownedPets.loading ? 'Loading...' : 'Load'}
              </button>
              {debugInfo.ownedPets.error && (
                <div className="text-red-600 text-sm">{debugInfo.ownedPets.error}</div>
              )}
              {debugInfo.ownedPets.data && (
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(debugInfo.ownedPets.data, null, 2)}
                </pre>
              )}
            </div>
            
            {/* Adopted Pets */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Adopted Pets</h2>
              <button
                onClick={loadAdoptedPets}
                disabled={debugInfo.adoptedPets.loading}
                className="mb-2 inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {debugInfo.adoptedPets.loading ? 'Loading...' : 'Load'}
              </button>
              {debugInfo.adoptedPets.error && (
                <div className="text-red-600 text-sm">{debugInfo.adoptedPets.error}</div>
              )}
              {debugInfo.adoptedPets.data && (
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(debugInfo.adoptedPets.data, null, 2)}
                </pre>
              )}
            </div>
            
            {/* Purchased Pets */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Purchased Pets</h2>
              <button
                onClick={loadPurchasedPets}
                disabled={debugInfo.purchasedPets.loading}
                className="mb-2 inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {debugInfo.purchasedPets.loading ? 'Loading...' : 'Load'}
              </button>
              {debugInfo.purchasedPets.error && (
                <div className="text-red-600 text-sm">{debugInfo.purchasedPets.error}</div>
              )}
              {debugInfo.purchasedPets.data && (
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(debugInfo.purchasedPets.data, null, 2)}
                </pre>
              )}
            </div>
          </div>
          
          {/* Combined Pets */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-2">All Pets ({allPets.length})</h2>
            {allPets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPets.map((pet, index) => (
                  <div key={`${pet._id}-${pet.source}-${index}`} className="border rounded-lg p-3">
                    <div className="font-medium">{pet.name}</div>
                    <div className="text-sm text-gray-600">{pet.breed} • {pet.species}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Source: {pet.sourceLabel || pet.source}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">No pets found</div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}