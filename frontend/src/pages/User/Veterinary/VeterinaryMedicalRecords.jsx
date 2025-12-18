import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryMedicalRecords() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState('');
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get selected pet from location state
    if (location.state && location.state.selectedPet) {
      const pet = location.state.selectedPet;
      setSelectedPet(pet._id);
      loadMedicalRecords(pet._id);
    } else {
      loadPets();
    }
  }, [location]);

  const loadPets = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would fetch the user's pets
      // For now, we'll use a placeholder array
      const userPets = [
        { _id: '1', name: 'Max', species: 'Dog', breed: 'Golden Retriever' },
        { _id: '2', name: 'Bella', species: 'Cat', breed: 'Persian' },
        { _id: '3', name: 'Charlie', species: 'Dog', breed: 'Bulldog' }
      ];
      setPets(userPets);
    } catch (error) {
      console.error('Failed to load pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMedicalRecords = async (petId) => {
    if (!petId) return;
    
    setLoading(true);
    try {
      // Fetch medical records for the selected pet
      const response = await veterinaryAPI.userListMedicalRecordsForPet(petId);
      setMedicalRecords(response.data.data.medicalRecords || []);
    } catch (error) {
      console.error('Failed to load medical records:', error);
      setMedicalRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePetChange = async (e) => {
    const petId = e.target.value;
    setSelectedPet(petId);
    
    if (petId) {
      setLoading(true);
      try {
        // Fetch medical records for the selected pet
        const response = await veterinaryAPI.userListMedicalRecordsForPet(petId);
        setMedicalRecords(response.data.data.medicalRecords || []);
      } catch (error) {
        console.error('Failed to load medical records:', error);
        setMedicalRecords([]);
      } finally {
        setLoading(false);
      }
    } else {
      setMedicalRecords([]);
    }
  };

  // Function to get the primary image URL or first image URL
  const getPetImageUrl = (pet) => {
    if (!pet || !pet.images || pet.images.length === 0) {
      return '/placeholder-pet.svg';
    }
    
    // Find primary image first
    const primaryImage = pet.images.find(img => img.isPrimary);
    if (primaryImage && primaryImage.url) {
      // Handle relative URLs
      if (primaryImage.url.startsWith('http') || primaryImage.url.startsWith('/')) {
        return primaryImage.url;
      }
      // For relative paths, prepend the API origin
      const apiOrigin = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${apiOrigin}${primaryImage.url.startsWith('/') ? '' : '/'}${primaryImage.url}`;
    }
    
    // Fallback to first image
    const firstImage = pet.images[0];
    if (firstImage && firstImage.url) {
      // Handle relative URLs
      if (firstImage.url.startsWith('http') || firstImage.url.startsWith('/')) {
        return firstImage.url;
      }
      // For relative paths, prepend the API origin
      const apiOrigin = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${apiOrigin}${firstImage.url.startsWith('/') ? '' : '/'}${firstImage.url}`;
    }
    
    return '/placeholder-pet.svg';
  };

  const getVisitTypeLabel = (visitType) => {
    const types = {
      routine_checkup: 'Routine Checkup',
      vaccination: 'Vaccination',
      surgery: 'Surgery',
      emergency: 'Emergency',
      follow_up: 'Follow-up',
      consultation: 'Consultation',
      other: 'Other'
    };
    return types[visitType] || visitType;
  };

  const MedicalRecordDetail = ({ record }) => {
    const pet = pets.find(p => p._id === record.petId) || (record.petId && typeof record.petId === 'object' ? record.petId : null);
    
    return (
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {pet?.images && pet.images.length > 0 ? (
              <img 
                src={getPetImageUrl(pet)} 
                alt={pet.name}
                className="h-10 w-10 rounded-full object-cover mr-3"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-pet.svg';
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span className="text-lg">📅</span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">{getVisitTypeLabel(record.visitType)}</h3>
              <p className="text-sm text-gray-500">
                {new Date(record.visitDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {record.cost && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ${record.cost.toFixed(2)}
              </span>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              record.status === 'completed' ? 'bg-green-100 text-green-800' :
              record.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {record.status || 'Completed'}
            </span>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {record.visitType === 'vaccination' && record.vaccinations && record.vaccinations.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Vaccination Record
            </span>
          )}
          {record.visitType === 'surgery' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Surgical Procedure
            </span>
          )}
          {record.isEmergency && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Emergency Case
            </span>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Pet</p>
            <p className="text-sm text-gray-900">{pet?.name || 'Unknown'} ({pet?.species?.name || pet?.species || ''})</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Veterinarian</p>
            <p className="text-sm text-gray-900">{record.staff?.name || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Clinic</p>
            <p className="text-sm text-gray-900">{record.storeName || 'Not specified'}</p>
          </div>
        </div>
        
        {record.chiefComplaint && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Chief Complaint</p>
            <p className="text-sm text-gray-900">{record.chiefComplaint}</p>
          </div>
        )}
        
        {record.history && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">History</p>
            <p className="text-sm text-gray-900">{record.history}</p>
          </div>
        )}
        
        {record.examinationFindings && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Examination Findings</p>
            <p className="text-sm text-gray-900">{record.examinationFindings}</p>
          </div>
        )}
        
        {record.diagnosis && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Diagnosis</p>
            <p className="text-sm text-gray-900">{record.diagnosis}</p>
          </div>
        )}
        
        {record.treatment && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Treatment</p>
            <p className="text-sm text-gray-900">{record.treatment}</p>
          </div>
        )}
        
        {record.prescription && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Prescription</p>
            <p className="text-sm text-gray-900">{record.prescription}</p>
          </div>
        )}
        
        {record.medications && record.medications.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Medications</p>
            <ul className="mt-1 space-y-2">
              {record.medications.map((med, index) => (
                <li key={index} className="flex justify-between">
                  <span className="text-sm text-gray-900">{med.name}</span>
                  <span className="text-sm text-gray-500">{med.dosage} {med.frequency}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {record.vaccinations && record.vaccinations.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Vaccinations</p>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              {record.vaccinations.map((vac, index) => (
                <div key={index} className="border border-gray-200 rounded p-2">
                  <p className="text-sm font-medium text-gray-900">{vac.vaccineName}</p>
                  <p className="text-xs text-gray-500">
                    Administered: {new Date(vac.dateAdministered).toLocaleDateString()}
                  </p>
                  {vac.nextDueDate && (
                    <p className="text-xs text-gray-500">
                      Next Due: {new Date(vac.nextDueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {record.notes && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Notes</p>
            <p className="text-sm text-gray-900">{record.notes}</p>
          </div>
        )}
      </div>
    );
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
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Medical Records</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your pets' medical history and records
        </p>
      </div>

      {/* Pet Selection */}
      {location.state && location.state.selectedPet ? (
        // Display selected pet info when coming from veterinary session
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              {location.state.selectedPet.images && location.state.selectedPet.images.length > 0 ? (
                <img 
                  src={getPetImageUrl(location.state.selectedPet)} 
                  alt={location.state.selectedPet.name}
                  className="h-10 w-10 rounded-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-pet.svg';
                  }}
                />
              ) : (
                <span className="text-lg">📅</span>
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Medical Records for {location.state.selectedPet.name}
              </h3>
              <p className="text-xs text-blue-700">
                {location.state.selectedPet.breed?.name || location.state.selectedPet.breed || 'Unknown Breed'}, 
                {location.state.selectedPet.species?.name || location.state.selectedPet.species?.displayName || location.state.selectedPet.species || 'Unknown Species'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Show pet selection dropdown
        <div className="mb-6">
          <label htmlFor="pet-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select a Pet
          </label>
          <select
            id="pet-select"
            value={selectedPet}
            onChange={handlePetChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Select a pet</option>
            {pets.map((pet) => (
              <option key={pet._id} value={pet._id}>
                {pet.name} ({pet.breed})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Medical Records List */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : medicalRecords.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No medical records</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedPet || (location.state && location.state.selectedPet)
                ? "No medical records found for this pet."
                : "Select a pet to view medical records."}
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Medical Records ({medicalRecords.length})
            </h2>
            <div className="space-y-4">
              {medicalRecords.map((record) => (
                <MedicalRecordDetail key={record._id} record={record} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}