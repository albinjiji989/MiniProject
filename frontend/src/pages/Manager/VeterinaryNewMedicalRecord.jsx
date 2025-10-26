import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { veterinaryAPI } from '../../services/api';

export default function VeterinaryNewMedicalRecord() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    petId: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'consultation',
    chiefComplaint: '',
    history: '',
    examinationFindings: '',
    diagnosis: '',
    treatment: '',
    prescription: '',
    weight: '',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    followUpRequired: false,
    followUpDate: '',
    followUpNotes: '',
    cost: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Pre-fill petId if provided in query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const appointmentId = queryParams.get('appointmentId');
    
    if (appointmentId) {
      // In a real app, you would fetch appointment details and pre-fill the form
      console.log('Pre-filling form with appointment data:', appointmentId);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index][field] = value;
    setFormData(prev => ({
      ...prev,
      medications: updatedMedications
    }));
  };

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '', notes: '' }]
    }));
  };

  const removeMedication = (index) => {
    if (formData.medications.length > 1) {
      const updatedMedications = [...formData.medications];
      updatedMedications.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        medications: updatedMedications
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.petId) newErrors.petId = 'Pet is required';
    if (!formData.visitDate) newErrors.visitDate = 'Visit date is required';
    if (!formData.diagnosis) newErrors.diagnosis = 'Diagnosis is required';
    if (!formData.treatment) newErrors.treatment = 'Treatment is required';
    
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
      // Filter out empty medications
      const medications = formData.medications.filter(med => med.name || med.dosage || med.frequency);
      
      await veterinaryAPI.managerCreateMedicalRecord({
        ...formData,
        medications
      });
      navigate('/manager/veterinary/medical-records');
    } catch (error) {
      console.error('Failed to create medical record:', error);
      // Handle error (show notification, etc.)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/manager/veterinary/medical-records')}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Medical Records
        </button>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">New Medical Record</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new veterinary medical record
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
              <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="petId" className="block text-sm font-medium text-gray-700">
                    Pet <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="petId"
                      id="petId"
                      value={formData.petId}
                      onChange={handleChange}
                      className={`block w-full border ${errors.petId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    />
                    {errors.petId && <p className="mt-1 text-sm text-red-600">{errors.petId}</p>}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700">
                    Visit Date <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="visitDate"
                      id="visitDate"
                      value={formData.visitDate}
                      onChange={handleChange}
                      className={`block w-full border ${errors.visitDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    />
                    {errors.visitDate && <p className="mt-1 text-sm text-red-600">{errors.visitDate}</p>}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="visitType" className="block text-sm font-medium text-gray-700">
                    Visit Type
                  </label>
                  <div className="mt-1">
                    <select
                      id="visitType"
                      name="visitType"
                      value={formData.visitType}
                      onChange={handleChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="routine_checkup">Routine Checkup</option>
                      <option value="vaccination">Vaccination</option>
                      <option value="surgery">Surgery</option>
                      <option value="emergency">Emergency</option>
                      <option value="follow_up">Follow-up</option>
                      <option value="consultation">Consultation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Information */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Clinical Information</h3>
              <div className="mt-4 space-y-6">
                <div>
                  <label htmlFor="chiefComplaint" className="block text-sm font-medium text-gray-700">
                    Chief Complaint
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="chiefComplaint"
                      name="chiefComplaint"
                      rows={2}
                      value={formData.chiefComplaint}
                      onChange={handleChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="history" className="block text-sm font-medium text-gray-700">
                    History
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="history"
                      name="history"
                      rows={3}
                      value={formData.history}
                      onChange={handleChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="examinationFindings" className="block text-sm font-medium text-gray-700">
                    Examination Findings
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="examinationFindings"
                      name="examinationFindings"
                      rows={3}
                      value={formData.examinationFindings}
                      onChange={handleChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">
                      Diagnosis <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="diagnosis"
                        id="diagnosis"
                        value={formData.diagnosis}
                        onChange={handleChange}
                        className={`block w-full border ${errors.diagnosis ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      />
                      {errors.diagnosis && <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="treatment" className="block text-sm font-medium text-gray-700">
                      Treatment <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="treatment"
                        id="treatment"
                        value={formData.treatment}
                        onChange={handleChange}
                        className={`block w-full border ${errors.treatment ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      />
                      {errors.treatment && <p className="mt-1 text-sm text-red-600">{errors.treatment}</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="prescription" className="block text-sm font-medium text-gray-700">
                    Prescription
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="prescription"
                      name="prescription"
                      rows={3}
                      value={formData.prescription}
                      onChange={handleChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Vital Signs */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Vital Signs</h3>
              <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                    Weight (kg)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="weight"
                      id="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                    Temperature (°C)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="temperature"
                      id="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700">
                    Heart Rate (bpm)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="heartRate"
                      id="heartRate"
                      value={formData.heartRate}
                      onChange={handleChange}
                      min="0"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="respiratoryRate" className="block text-sm font-medium text-gray-700">
                    Respiratory Rate (breaths/min)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="respiratoryRate"
                      id="respiratoryRate"
                      value={formData.respiratoryRate}
                      onChange={handleChange}
                      min="0"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Medications */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Medications</h3>
                <button
                  type="button"
                  onClick={addMedication}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Medication
                </button>
              </div>
              <div className="mt-4 space-y-4">
                {formData.medications.map((med, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4">
                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-2">
                        <label htmlFor={`med-name-${index}`} className="block text-sm font-medium text-gray-700">
                          Medication Name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            id={`med-name-${index}`}
                            value={med.name}
                            onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-1">
                        <label htmlFor={`med-dosage-${index}`} className="block text-sm font-medium text-gray-700">
                          Dosage
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            id={`med-dosage-${index}`}
                            value={med.dosage}
                            onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-1">
                        <label htmlFor={`med-frequency-${index}`} className="block text-sm font-medium text-gray-700">
                          Frequency
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            id={`med-frequency-${index}`}
                            value={med.frequency}
                            onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-1">
                        <label htmlFor={`med-duration-${index}`} className="block text-sm font-medium text-gray-700">
                          Duration
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            id={`med-duration-${index}`}
                            value={med.duration}
                            onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          disabled={formData.medications.length === 1}
                          className={`w-full inline-flex justify-center py-2 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                            formData.medications.length === 1 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                          }`}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor={`med-notes-${index}`} className="block text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <div className="mt-1">
                          <textarea
                            id={`med-notes-${index}`}
                            rows={2}
                            value={med.notes}
                            onChange={(e) => handleMedicationChange(index, 'notes', e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Follow-up</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center">
                  <input
                    id="followUpRequired"
                    name="followUpRequired"
                    type="checkbox"
                    checked={formData.followUpRequired}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="followUpRequired" className="ml-2 block text-sm text-gray-900">
                    Follow-up required
                  </label>
                </div>

                {formData.followUpRequired && (
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700">
                        Follow-up Date
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          name="followUpDate"
                          id="followUpDate"
                          value={formData.followUpDate}
                          onChange={handleChange}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="followUpNotes" className="block text-sm font-medium text-gray-700">
                        Follow-up Notes
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="followUpNotes"
                          name="followUpNotes"
                          rows={2}
                          value={formData.followUpNotes}
                          onChange={handleChange}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cost */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Cost</h3>
              <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                    Cost ($)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="cost"
                      id="cost"
                      value={formData.cost}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/manager/veterinary/medical-records')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Medical Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}