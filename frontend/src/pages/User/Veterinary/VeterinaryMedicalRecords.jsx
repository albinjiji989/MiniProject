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
        const response = await veterinaryAPI.getUserMedicalRecords(petId);
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
    const pet = pets.find(p => p._id === record.pet);
    
    return (
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{getVisitTypeLabel(record.visitType)}</h3>
            <p className="text-sm text-gray-500">
              {new Date(record.visitDate).toLocaleDateString()}
            </p>
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
            <p className="text-sm text-gray-900">{pet?.name || 'Unknown'} ({pet?.species || ''})</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Veterinarian</p>
            <p className="text-sm text-gray-900">{record.staff?.name || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Clinic</p>
            <p className="text-sm text-gray-900">{record.veterinary?.name || 'Not specified'}</p>
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
                <li key={index} className="text-sm text-gray-900">
                  <span className="font-medium">{med.name}</span> - {med.dosage}, {med.frequency}
                  {med.duration && ` for ${med.duration}`}
                  {med.notes && ` (${med.notes})`}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {record.vaccinations && record.vaccinations.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Vaccinations</p>
            <ul className="mt-1 space-y-2">
              {record.vaccinations.map((vacc, index) => (
                <li key={index} className="text-sm text-gray-900">
                  <span className="font-medium">{vacc.name}</span> - {new Date(vacc.date).toLocaleDateString()}
                  {vacc.nextDueDate && ` (Next due: ${new Date(vacc.nextDueDate).toLocaleDateString()})`}
                  {vacc.batchNumber && ` (Batch: ${vacc.batchNumber})`}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {record.labTests && record.labTests.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Laboratory Tests</p>
            <ul className="mt-1 space-y-2">
              {record.labTests.map((test, index) => (
                <li key={index} className="text-sm text-gray-900">
                  <span className="font-medium">{test.testName}</span> - {test.result || 'Pending'}
                  {test.date && ` (${new Date(test.date).toLocaleDateString()})`}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {record.weight && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Weight</p>
              <p className="text-sm text-gray-900">{record.weight} kg</p>
            </div>
            {record.temperature && (
              <div>
                <p className="text-sm font-medium text-gray-500">Temperature</p>
                <p className="text-sm text-gray-900">{record.temperature}°C</p>
              </div>
            )}
            {record.heartRate && (
              <div>
                <p className="text-sm font-medium text-gray-500">Heart Rate</p>
                <p className="text-sm text-gray-900">{record.heartRate} bpm</p>
              </div>
            )}
            {record.respiratoryRate && (
              <div>
                <p className="text-sm font-medium text-gray-500">Respiratory Rate</p>
                <p className="text-sm text-gray-900">{record.respiratoryRate} rpm</p>
              </div>
            )}
          </div>
        )}
        
        {record.followUpRequired && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Follow-up Required</p>
            {record.followUpDate && (
              <p className="text-sm text-blue-700">Scheduled for: {new Date(record.followUpDate).toLocaleDateString()}</p>
            )}
            {record.followUpNotes && (
              <p className="text-sm text-blue-700 mt-1">{record.followUpNotes}</p>
            )}
          </div>
        )}
        
        {record.attachments && record.attachments.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Attachments</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {record.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                >
                  📎 {attachment.name}
                </a>
              ))}
            </div>
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
              <h3 className="text-sm font-medium text-blue-800">Medical Records for</h3>
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

      {/* Medical Records */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : selectedPet ? (
        medicalRecords.length > 0 ? (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Medical History for {pets.find(p => p._id === selectedPet)?.name || 'Pet'}
              </h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {medicalRecords.length} records
              </span>
            </div>
            <div>
              {medicalRecords.map((record) => (
                <MedicalRecordDetail key={record._id} record={record} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No medical records</h3>
            <p className="mt-1 text-sm text-gray-500">
              No medical records found for this pet.
            </p>
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a pet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select a pet to view their medical records.
          </p>
        </div>
      )}
    </div>
  );
}