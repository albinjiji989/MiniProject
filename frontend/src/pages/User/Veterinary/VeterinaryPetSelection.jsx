import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { petsAPI, adoptionAPI, petShopAPI, userPetsAPI } from '../../../services/api';
import UserLayout from '../../../components/Layout/UserLayout';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';

export default function VeterinaryPetSelection() {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    loadUserPets();
  }, []);

  const loadUserPets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load pets from different sources like the dashboard does
      console.log('Loading user pets from all sources...');
      
      // Load all data in parallel like the dashboard
      const [petsRes, ownedRes, adoptedRes, purchasedRes] = await Promise.allSettled([
        userPetsAPI.list(), // PetNew model pets
        petsAPI.getMyPets(), // Core owned pets
        adoptionAPI.getMyAdoptedPets(), // Adopted pets
        petShopAPI.getMyPurchasedPets() // Purchased pets
      ]);

      console.log('API responses:', { petsRes, ownedRes, adoptedRes, purchasedRes });
      
      // Log detailed error information
      if (petsRes.status === 'rejected') {
        console.error('Failed to load PetNew pets:', petsRes.reason);
      }
      if (ownedRes.status === 'rejected') {
        console.error('Failed to load core owned pets:', ownedRes.reason);
      }
      if (adoptedRes.status === 'rejected') {
        console.error('Failed to load adopted pets:', adoptedRes.reason);
      }
      if (purchasedRes.status === 'rejected') {
        console.error('Failed to load purchased pets:', purchasedRes.reason);
      }

      const allPets = [];

      // Process pets from PetNew model
      if (petsRes.status === 'fulfilled') {
        const petNewPets = petsRes.value.data?.data || [];
        console.log('PetNew pets loaded:', petNewPets.length);
        petNewPets.forEach(pet => {
          allPets.push({
            ...pet,
            source: 'owned',
            sourceLabel: 'Owned Pet'
          });
        });
      }

      // Process core owned pets
      if (ownedRes.status === 'fulfilled') {
        let corePets = [];
        if (ownedRes.value.data?.data?.pets) {
          corePets = Array.isArray(ownedRes.value.data.data.pets) ? ownedRes.value.data.data.pets : [];
        } else if (ownedRes.value.data?.data) {
          corePets = Array.isArray(ownedRes.value.data.data) ? ownedRes.value.data.data : [];
        } else if (Array.isArray(ownedRes.value.data)) {
          corePets = ownedRes.value.data;
        }
        console.log('Core owned pets loaded:', corePets.length);
        corePets.forEach(pet => {
          allPets.push({
            ...pet,
            source: 'owned',
            sourceLabel: 'Owned Pet'
          });
        });
      }

      // Process adopted pets
      if (adoptedRes.status === 'fulfilled') {
        let adoptedPets = [];
        if (adoptedRes.value.data?.data) {
          adoptedPets = Array.isArray(adoptedRes.value.data.data) ? adoptedRes.value.data.data : [];
        } else if (Array.isArray(adoptedRes.value.data)) {
          adoptedPets = adoptedRes.value.data;
        }
        console.log('Adopted pets loaded:', adoptedPets.length);
        adoptedPets.forEach(pet => {
          allPets.push({
            ...pet,
            source: 'adopted',
            sourceLabel: 'Adopted Pet'
          });
        });
      }

      // Process purchased pets
      if (purchasedRes.status === 'fulfilled') {
        let purchasedPets = [];
        if (purchasedRes.value.data?.data) {
          purchasedPets = Array.isArray(purchasedRes.value.data.data) ? purchasedRes.value.data.data : [];
        } else if (Array.isArray(purchasedRes.value.data)) {
          purchasedPets = purchasedRes.value.data;
        }
        console.log('Purchased pets loaded:', purchasedPets.length);
        purchasedPets.forEach(pet => {
          allPets.push({
            ...pet,
            source: 'purchased',
            sourceLabel: 'Purchased Pet'
          });
        });
      }

      // Remove duplicates based on _id
      const uniquePets = allPets.filter((pet, index, self) => 
        index === self.findIndex(p => p._id === pet._id)
      );

      console.log('All unique pets:', uniquePets.length, uniquePets);
      setPets(uniquePets);
      
      // Show a message if no pets were found
      if (uniquePets.length === 0) {
        console.log('No pets found from any source');
      }
    } catch (error) {
      console.error('Failed to load pets:', error);
      setError(`Failed to load your pets. Please try again later. Error: ${error.message || 'Unknown error'}`);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePetSelect = (pet) => {
    setSelectedPet(pet);
  };

  const handleEnterVeterinaryModule = () => {
    if (selectedPet) {
      // Navigate to veterinary dashboard with the selected pet
      navigate('/user/veterinary/dashboard', { 
        state: { selectedPet: selectedPet } 
      });
    }
  };

  const handleAddPet = () => {
    // Navigate to pet creation page
    navigate('/User/pets/add');
  };

  const getSourceBadge = (source) => {
    switch (source) {
      case 'owned':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Owned</span>;
      case 'adopted':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Adopted</span>;
      case 'purchased':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Purchased</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Pet</span>;
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Veterinary Module</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Pets</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                    <p className="mt-2">This might happen if you don't have any pets registered in the system yet.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={loadUserPets}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try Again
                </button>
                <button
                  onClick={handleAddPet}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add a Pet
                </button>
              </div>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Veterinary Module</h1>
          <p className="text-gray-600 mb-6">
            Please select one of your pets to access veterinary services.
          </p>
          <div className="mb-4">
            <button
              onClick={loadUserPets}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh
            </button>
          </div>

          {pets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pets found</h3>
              <p className="text-gray-500 mb-6">
                You need to have a pet registered before using veterinary services.
              </p>
              <div className="mb-4">
                <button
                  onClick={loadUserPets}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-1 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh
                </button>
              </div>
              <button
                onClick={handleAddPet}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add a Pet
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Select a Pet</h2>
                <button
                  onClick={loadUserPets}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-1 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh
                </button>
              </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pets.map((pet) => (
                    <div
                      key={`${pet._id}-${pet.source}`}
                      onClick={() => handlePetSelect(pet)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        selectedPet && selectedPet._id === pet._id
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-900">{pet.name}</h3>
                            <p className="text-xs text-gray-500">
                              {(pet.breed?.name || pet.breed || 'Unknown Breed')} • 
                              {(pet.species?.name || pet.species?.displayName || pet.species || 'Unknown Species')}
                            </p>
                          </div>
                        </div>
                        {getSourceBadge(pet.source)}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        <div>Age: {pet.ageDisplay || `${pet.age} ${pet.ageUnit || 'years'}`}</div>
                        <div>ID: {pet._id}</div>
                        <div>Source: {pet.source}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPet && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Selected Pet: {selectedPet.name}
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          You've selected {selectedPet.name} (
                          {selectedPet.breed?.name || selectedPet.breed || 'Unknown Breed'}, 
                          {selectedPet.species?.name || selectedPet.species?.displayName || selectedPet.species || 'Unknown Species'}) 
                          for veterinary services.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleEnterVeterinaryModule}
                  disabled={!selectedPet}
                  className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                    selectedPet
                      ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Access Veterinary Services
                  <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </UserLayout>
  );
}