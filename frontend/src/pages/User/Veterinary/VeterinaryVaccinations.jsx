import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryVaccinations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pets, setPets] = useState([
    { _id: '1', name: 'Max', species: 'Dog', breed: 'Golden Retriever', age: 3 },
    { _id: '2', name: 'Bella', species: 'Cat', breed: 'Persian', age: 2 }
  ]);
  const [selectedPet, setSelectedPet] = useState('');
  const [vaccinationRecords, setVaccinationRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get selected pet from location state
    if (location.state && location.state.selectedPet) {
      const pet = location.state.selectedPet;
      setSelectedPet(pet._id);
      // Load vaccination records for the selected pet
      loadVaccinationRecords();
    }
  }, [location]);

  const loadVaccinationRecords = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch actual vaccination records
      // For now, we'll use sample data
      const sampleRecords = [
        {
          _id: '1',
          vaccineName: 'Rabies',
          dateAdministered: new Date('2023-01-15'),
          nextDueDate: new Date('2024-01-15'),
          batchNumber: 'RB-2023-001',
          administeredBy: 'Dr. Jane Doe',
          notes: 'Routine annual vaccination'
        },
        {
          _id: '2',
          vaccineName: 'DHPP',
          dateAdministered: new Date('2023-01-15'),
          nextDueDate: new Date('2023-07-15'),
          batchNumber: 'DHPP-2023-002',
          administeredBy: 'Dr. Jane Doe',
          notes: '6-month booster'
        },
        {
          _id: '3',
          vaccineName: ' Bordetella',
          dateAdministered: new Date('2023-03-20'),
          nextDueDate: new Date('2023-09-20'),
          batchNumber: 'BRD-2023-003',
          administeredBy: 'Dr. John Smith',
          notes: 'Kennel cough vaccine'
        }
      ];
      
      setVaccinationRecords(sampleRecords);
    } catch (error) {
      console.error('Failed to load vaccination records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePetChange = (e) => {
    setSelectedPet(e.target.value);
  };

  const getStatus = (nextDueDate) => {
    const today = new Date();
    const dueDate = new Date(nextDueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'overdue', days: Math.abs(diffDays) };
    } else if (diffDays <= 30) {
      return { status: 'due_soon', days: diffDays };
    } else {
      return { status: 'up_to_date', days: diffDays };
    }
  };

  const getStatusBadge = (nextDueDate) => {
    const { status, days } = getStatus(nextDueDate);
    
    switch (status) {
      case 'overdue':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Overdue by {days} days</span>;
      case 'due_soon':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Due in {days} days</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Due in {days} days</span>;
    }
  };

  const getNextVaccinationDate = () => {
    if (vaccinationRecords.length === 0) return null;
    
    const upcoming = vaccinationRecords
      .filter(record => getStatus(record.nextDueDate).status !== 'overdue')
      .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
    
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  const nextVaccination = getNextVaccinationDate();

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
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Vaccination Records</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your pet's vaccination history and upcoming appointments
        </p>
      </div>

      {/* Pet Selection or Display */}
      {location.state && location.state.selectedPet ? (
        // Display selected pet info when coming from veterinary session
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Vaccination Records for</h3>
              <p className="text-sm text-blue-700">
                {location.state.selectedPet.name} (
                {location.state.selectedPet.breed?.name || location.state.selectedPet.breed || 'Unknown Breed'} • 
                {location.state.selectedPet.species?.name || location.state.selectedPet.species?.displayName || location.state.selectedPet.species || 'Unknown Species'})
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Show pet selection dropdown when not coming from veterinary session
        <div className="mb-6">
          <label htmlFor="pet-select" className="block text-sm font-medium text-gray-700">
            Select Pet
          </label>
          <div className="mt-1">
            <select
              id="pet-select"
              value={selectedPet}
              onChange={handlePetChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select a pet</option>
              {pets.map((pet) => (
                <option key={pet._id} value={pet._id}>
                  {pet.name} ({pet.species} - {pet.breed})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {selectedPet && (
        <>
          {/* Vaccination Summary */}
          <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Vaccinations</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{vaccinationRecords.length}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Up to Date</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {vaccinationRecords.filter(record => getStatus(record.nextDueDate).status === 'up_to_date').length}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Due Soon</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {vaccinationRecords.filter(record => getStatus(record.nextDueDate).status === 'due_soon').length}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Vaccination Reminder */}
          {nextVaccination && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Next Vaccination Due</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      <span className="font-medium">{nextVaccination.vaccineName}</span> is due on{' '}
                      <span className="font-medium">{new Date(nextVaccination.nextDueDate).toLocaleDateString()}</span>
                    </p>
                    <button
                      onClick={() => navigate('/user/veterinary/book')}
                      className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Schedule Appointment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vaccination Records */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Vaccination History
                </h3>
                <button
                  onClick={() => navigate('/user/veterinary/book?vaccination=true')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Add Vaccination
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : vaccinationRecords.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {vaccinationRecords.map((record) => (
                    <li key={record._id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">{record.vaccineName}</div>
                        <div className="ml-2 flex-shrink-0 flex">
                          {getStatusBadge(record.nextDueDate)}
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <div className="text-sm text-gray-500">
                            Administered: {new Date(record.dateAdministered).toLocaleDateString()}
                          </div>
                          <div className="mt-1 sm:mt-0 sm:ml-4 text-sm text-gray-500">
                            Batch: {record.batchNumber}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <time dateTime={record.nextDueDate}>
                            Next due: {new Date(record.nextDueDate).toLocaleDateString()}
                          </time>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Administered by: {record.administeredBy}
                      </div>
                      {record.notes && (
                        <div className="mt-1 text-sm text-gray-500">
                          Notes: {record.notes}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No vaccination records</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No vaccination records found for this pet.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/user/veterinary/book?vaccination=true')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Schedule Vaccination
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!selectedPet && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a pet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select a pet to view their vaccination records.
          </p>
        </div>
      )}
    </div>
  );
}