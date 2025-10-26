import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ManagerModuleLayout from '../../../components/Manager/ManagerModuleLayout';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryManagerPatientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: '',
    gender: 'Male',
    weight: '',
    color: '',
    microchip: '',
    ownerId: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerAddress: '',
    medicalHistory: '',
    vaccinationStatus: 'Up to date',
    allergies: '',
    currentMedications: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      loadPatient();
    }
  }, [id]);

  const loadPatient = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch actual patient data
      // For now, we'll use sample data
      const samplePatient = {
        name: 'Max',
        species: 'Dog',
        breed: 'Golden Retriever',
        age: 3,
        gender: 'Male',
        weight: 32,
        color: 'Golden',
        microchip: 'MC-123456789',
        ownerId: 'owner-123',
        ownerName: 'John Smith',
        ownerPhone: '555-0123',
        ownerEmail: 'john@example.com',
        ownerAddress: '123 Main St, Anytown, ST 12345',
        medicalHistory: 'Allergic to penicillin',
        vaccinationStatus: 'Up to date',
        allergies: 'Penicillin',
        currentMedications: 'Heartworm prevention'
      };
      
      setFormData(samplePatient);
    } catch (error) {
      console.error('Failed to load patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Pet name is required';
    if (!formData.species) newErrors.species = 'Species is required';
    if (!formData.breed) newErrors.breed = 'Breed is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (formData.age && isNaN(formData.age)) newErrors.age = 'Age must be a valid number';
    if (!formData.weight) newErrors.weight = 'Weight is required';
    if (formData.weight && isNaN(formData.weight)) newErrors.weight = 'Weight must be a valid number';
    if (!formData.ownerName) newErrors.ownerName = 'Owner name is required';
    if (!formData.ownerPhone) newErrors.ownerPhone = 'Owner phone is required';
    if (formData.ownerEmail && !/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Owner email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const patientData = {
        ...formData,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight)
      };
      
      if (isEdit) {
        // Update existing patient
        await veterinaryAPI.updatePatient(id, patientData);
      } else {
        // Create new patient
        await veterinaryAPI.createPatient(patientData);
      }
      
      navigate('/manager/veterinary/patients');
    } catch (error) {
      console.error('Failed to save patient:', error);
      alert('Failed to save patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSpeciesOptions = () => {
    return [
      'Dog',
      'Cat',
      'Bird',
      'Rabbit',
      'Hamster',
      'Guinea Pig',
      'Fish',
      'Reptile',
      'Other'
    ];
  };

  const getGenderOptions = () => {
    return [
      'Male',
      'Female',
      'Neutered Male',
      'Spayed Female'
    ];
  };

  const getVaccinationStatusOptions = () => {
    return [
      'Up to date',
      'Overdue',
      'Not started',
      'Incomplete'
    ];
  };

  return (
    <ManagerModuleLayout
      title={isEdit ? "Edit Patient" : "Add New Patient"}
      subtitle={isEdit ? "Update patient details" : "Register a new patient"}
      actions={[
        {
          label: 'Back to Patients',
          onClick: () => navigate('/manager/veterinary/patients')
        }
      ]}
    >
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Patient Information */}
              <div className="sm:col-span-6">
                <h3 className="text-lg font-medium text-gray-900">Patient Information</h3>
                <p className="mt-1 text-sm text-gray-500">Basic information about the pet</p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Pet Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="species" className="block text-sm font-medium text-gray-700">
                  Species <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="species"
                    name="species"
                    value={formData.species}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.species ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  >
                    {getSpeciesOptions().map((species) => (
                      <option key={species} value={species}>{species}</option>
                    ))}
                  </select>
                  {errors.species && <p className="mt-1 text-sm text-red-600">{errors.species}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="breed" className="block text-sm font-medium text-gray-700">
                  Breed <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="breed"
                    id="breed"
                    value={formData.breed}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.breed ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.breed && <p className="mt-1 text-sm text-red-600">{errors.breed}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  Age (years) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="age"
                    id="age"
                    min="0"
                    step="0.1"
                    value={formData.age}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.age ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <div className="mt-1">
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {getGenderOptions().map((gender) => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                  Weight (kg) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="weight"
                    id="weight"
                    min="0"
                    step="0.1"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.weight ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.weight && <p className="mt-1 text-sm text-red-600">{errors.weight}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                  Color/Markings
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="color"
                    id="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="microchip" className="block text-sm font-medium text-gray-700">
                  Microchip Number
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="microchip"
                    id="microchip"
                    value={formData.microchip}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Owner Information */}
              <div className="sm:col-span-6 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Owner Information</h3>
                <p className="mt-1 text-sm text-gray-500">Information about the pet's owner</p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                  Owner Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="ownerName"
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.ownerName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.ownerName && <p className="mt-1 text-sm text-red-600">{errors.ownerName}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="ownerPhone"
                    id="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.ownerPhone ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.ownerPhone && <p className="mt-1 text-sm text-red-600">{errors.ownerPhone}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="ownerEmail"
                    id="ownerEmail"
                    value={formData.ownerEmail}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.ownerEmail ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.ownerEmail && <p className="mt-1 text-sm text-red-600">{errors.ownerEmail}</p>}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="ownerAddress" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="mt-1">
                  <textarea
                    id="ownerAddress"
                    name="ownerAddress"
                    rows={3}
                    value={formData.ownerAddress}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Medical Information */}
              <div className="sm:col-span-6 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Medical Information</h3>
                <p className="mt-1 text-sm text-gray-500">Medical history and current status</p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="vaccinationStatus" className="block text-sm font-medium text-gray-700">
                  Vaccination Status
                </label>
                <div className="mt-1">
                  <select
                    id="vaccinationStatus"
                    name="vaccinationStatus"
                    value={formData.vaccinationStatus}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {getVaccinationStatusOptions().map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700">
                  Medical History
                </label>
                <div className="mt-1">
                  <textarea
                    id="medicalHistory"
                    name="medicalHistory"
                    rows={3}
                    value={formData.medicalHistory}
                    onChange={handleInputChange}
                    placeholder="Previous illnesses, surgeries, chronic conditions..."
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
                  Allergies
                </label>
                <div className="mt-1">
                  <textarea
                    id="allergies"
                    name="allergies"
                    rows={2}
                    value={formData.allergies}
                    onChange={handleInputChange}
                    placeholder="Known allergies to medications or foods..."
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="currentMedications" className="block text-sm font-medium text-gray-700">
                  Current Medications
                </label>
                <div className="mt-1">
                  <textarea
                    id="currentMedications"
                    name="currentMedications"
                    rows={2}
                    value={formData.currentMedications}
                    onChange={handleInputChange}
                    placeholder="Medications currently being administered..."
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/manager/veterinary/patients')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEdit ? 'Update Patient' : 'Create Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ManagerModuleLayout>
  );
}