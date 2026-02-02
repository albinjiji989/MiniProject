import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { petsAPI, userPetsAPI, adoptionAPI, petShopAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function SimpleVeterinaryPetSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUserPets();
  }, []);

  const loadUserPets = async () => {
    setLoading(true);
    try {
      // Load all types of pets like the main dashboard does
      const [ownedRes, adoptedRes, purchasedRes] = await Promise.allSettled([
        userPetsAPI.list({}),
        adoptionAPI.getMyAdoptedPets(),
        petShopAPI.getMyPurchasedPets()
      ]);

      let allPets = [];
      
      // Process user-created pets
      if (ownedRes.status === 'fulfilled') {
        const userPets = Array.isArray(ownedRes.value.data?.data) ? ownedRes.value.data.data : (ownedRes.value.data?.data?.pets || []);
        console.log('Owned pets:', userPets);
        userPets.forEach(pet => {
          allPets.push({
            ...pet,
            source: 'user',
            sourceLabel: 'My Pet',
            isUserCreated: true,
            userPetId: pet._id
          });
        });
      }

      // Process adopted pets
      if (adoptedRes.status === 'fulfilled') {
        const adoptedPets = Array.isArray(adoptedRes.value.data?.data) ? adoptedRes.value.data.data : (adoptedRes.value.data?.data?.pets || []);
        console.log('Adopted pets:', adoptedPets);
        adoptedPets.forEach(pet => {
          allPets.push({
            ...pet,
            source: 'adoption',
            sourceLabel: 'Adopted Pet',
            tags: ['adoption']
          });
        });
      }

      // Process purchased pets - handle multiple possible response structures
      if (purchasedRes.status === 'fulfilled') {
        console.log('Purchased pets raw response:', purchasedRes.value.data);
        
        let purchasedPets = [];
        
        // Try different response structures
        if (Array.isArray(purchasedRes.value.data?.data?.pets)) {
          purchasedPets = purchasedRes.value.data.data.pets;
        } else if (Array.isArray(purchasedRes.value.data?.data)) {
          purchasedPets = purchasedRes.value.data.data;
        } else if (Array.isArray(purchasedRes.value.data?.pets)) {
          purchasedPets = purchasedRes.value.data.pets;
        } else if (Array.isArray(purchasedRes.value.data)) {
          purchasedPets = purchasedRes.value.data;
        }
        
        console.log('Purchased pets processed:', purchasedPets);
        
        purchasedPets.forEach(pet => {
          // Handle case where pet might be nested in petId
          const petData = pet.petId || pet;
          allPets.push({
            ...petData,
            source: 'purchased',
            sourceLabel: 'Purchased Pet',
            tags: ['purchased']
          });
        });
      } else {
        console.error('Failed to fetch purchased pets:', purchasedRes.reason);
      }

      console.log('All pets combined:', allPets);

      // Remove duplicates based on petCode or _id
      const uniquePets = allPets.filter((pet, index, self) => 
        index === self.findIndex(p => (p.petCode || p._id) === (pet.petCode || pet._id))
      );

      console.log('Unique pets:', uniquePets);
      setPets(uniquePets);
    } catch (error) {
      console.error('Failed to load pets:', error);
      setPets([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handlePetSelect = (pet) => {
    // Validate pet object before navigation
    if (!pet || !pet._id) {
      console.error('Invalid pet object:', pet);
      return;
    }
    // Navigate to pet-specific dashboard with selected pet
    navigate('/user/veterinary/pet-dashboard', { state: { selectedPet: pet } });
  };

  const filteredPets = pets.filter(pet => 
    pet && 
    typeof pet === 'object' &&
    pet.name && 
    typeof pet.name === 'string' &&
    (pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pet.breed && typeof pet.breed === 'string' && pet.breed.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (pet.species && typeof pet.species === 'string' && pet.species.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Function to get pet image URL
  const getPetImageUrl = (pet) => {
    if (!pet || !pet.images || pet.images.length === 0) {
      return '/placeholder-pet.svg';
    }
    
    // Find primary image first
    const primaryImage = pet.images.find(img => img.isPrimary);
    if (primaryImage && primaryImage.url) {
      return primaryImage.url;
    }
    
    // Fallback to first image
    const firstImage = pet.images[0];
    if (firstImage && firstImage.url) {
      return firstImage.url;
    }
    
    return '/placeholder-pet.svg';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/user/veterinary')}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Veterinary
        </button>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Select Pet for Veterinary Visit</h1>
            <p className="mt-1 text-sm text-gray-500">
              Choose a pet to schedule a veterinary appointment
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
            placeholder="Search pets by name, breed, or species..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Pets Grid */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPets.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pets found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No pets match your search.' : 'You have not added any pets yet.'}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPets.map((pet) => {
              // Ensure pet has a valid ID
              if (!pet || !pet._id) {
                console.warn('Skipping pet without valid ID:', pet);
                return null;
              }
              
              return (
                <li key={pet._id} className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200">
                  <div className="p-6 flex flex-col">
                    <div className="flex-1 flex flex-col">
                      <div className="flex-shrink-0 mx-auto bg-gray-200 rounded-full w-24 h-24 flex items-center justify-center">
                        {pet.images && Array.isArray(pet.images) && pet.images.length > 0 ? (
                          <img 
                            className="rounded-full w-24 h-24 object-cover"
                            src={getPetImageUrl(pet)}
                            alt={typeof pet.name === 'string' ? pet.name : 'Pet'}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-pet.svg';
                            }}
                          />
                        ) : (
                          <span className="text-3xl">🐾</span>
                        )}
                      </div>
                      <div className="mt-4 text-center">
                        <h3 className="text-lg font-medium text-gray-900">{typeof pet.name === 'string' ? pet.name : 'Unknown Pet'}</h3>
                        <p className="text-sm text-gray-500">
                          {/* Handle different data structures for breed and species */}
                          {typeof pet.breed === 'string' ? pet.breed : 
                           (pet.breed && typeof pet.breed === 'object' && pet.breed.name) ? pet.breed.name : 
                           (pet.breedId && typeof pet.breedId === 'object' && pet.breedId.name) ? pet.breedId.name : 
                           'Unknown Breed'} • 
                          {typeof pet.species === 'string' ? pet.species : 
                           (pet.species && typeof pet.species === 'object' && pet.species.name) ? pet.species.name : 
                           (pet.speciesId && typeof pet.speciesId === 'object' && pet.speciesId.displayName) ? pet.speciesId.displayName : 
                           'Unknown Species'}
                        </p>
                        {/* Handle different age structures */}
                        {pet.age && typeof pet.age === 'object' && (
                          <p className="text-sm text-gray-500 mt-1">
                            Age: {pet.age.years || pet.age.value || 0} years, {pet.age.months || 0} months
                          </p>
                        )}
                        {/* Handle simple age value */}
                        {pet.age && typeof pet.age === 'number' && (
                          <p className="text-sm text-gray-500 mt-1">
                            Age: {pet.age} {pet.ageUnit || 'years'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        onClick={() => handlePetSelect(pet)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Select for Appointment
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}