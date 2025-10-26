import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ManagerModuleLayout from '../../../components/Manager/ManagerModuleLayout';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryManagerNewMedicalRecord() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    petId: new URLSearchParams(location.search).get('petId') || '',
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'consultation',
    chiefComplaint: '',
    history: '',
    examinationFindings: '',
    diagnosis: '',
    treatment: '',
    prescription: '',
    medications: [],
    vaccinations: [],
    labTests: [],
    weight: '',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    followUpRequired: false,
    followUpDate: '',
    followUpNotes: '',
    cost: '',
    paymentStatus: 'pending'
  });
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  });
  const [newVaccination, setNewVaccination] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    batchNumber: '',
    notes: ''
  });
  const [newLabTest, setNewLabTest] = useState({
    testName: '',
    result: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    // In a real implementation, you would fetch the list of patients
    // For now, we'll use sample data
    setPets([
      { _id: '1', name: 'Max', species: 'Dog', breed: 'Golden Retriever' },
      { _id: '2', name: 'Bella', species: 'Cat', breed: 'Persian' },
      { _id: '3', name: 'Charlie', species: 'Dog', breed: 'Bulldog' }
    ]);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage && newMedication.frequency) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, { ...newMedication }]
      }));
      setNewMedication({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: ''
      });
    }
  };

  const handleRemoveMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleAddVaccination = () => {
    if (newVaccination.name && newVaccination.date) {
      setFormData(prev => ({
        ...prev,
        vaccinations: [...prev.vaccinations, { ...newVaccination }]
      }));
      setNewVaccination({
        name: '',
        date: new Date().toISOString().split('T')[0],
        nextDueDate: '',
        batchNumber: '',
        notes: ''
      });
    }
  };

  const handleRemoveVaccination = (index) => {
    setFormData(prev => ({
      ...prev,
      vaccinations: prev.vaccinations.filter((_, i) => i !== index)
    }));
  };

  const handleAddLabTest = () => {
    if (newLabTest.testName) {
      setFormData(prev => ({
        ...prev,
        labTests: [...prev.labTests, { ...newLabTest }]
      }));
      setNewLabTest({
        testName: '',
        result: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  };

  const handleRemoveLabTest = (index) => {
    setFormData(prev => ({
      ...prev,
      labTests: prev.labTests.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        visitDate: new Date(formData.visitDate),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined
      };
      
      await veterinaryAPI.managerCreateMedicalRecord(payload);
      navigate('/manager/veterinary/records');
    } catch (error) {
      console.error('Failed to create medical record:', error);
      alert('Failed to create medical record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagerModuleLayout
      title="New Medical Record"
      subtitle="Create a new veterinary medical record"
      actions={[
        {
          label: 'Back to Records',
          onClick: () => navigate('/manager/veterinary/records')
        }
      ]}
    >
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="petId" className="block text-sm font-medium text-gray-700">
                    Select Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="petId"
                    required
                    value={formData.petId}
                    onChange={(e) => handleInputChange('petId', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a patient</option>
                    {pets.map((pet) => (
                      <option key={pet._id} value={pet._id}>
                        {pet.name} ({pet.species} - {pet.breed})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700">
                    Visit Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="visitDate"
                    required
                    value={formData.visitDate}
                    onChange={(e) => handleInputChange('visitDate', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label htmlFor="visitType" className="block text-sm font-medium text-gray-700">
                  Visit Type
                </label>
                <select
                  id="visitType"
                  value={formData.visitType}
                  onChange={(e) => handleInputChange('visitType', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
            
            {/* Clinical Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="chiefComplaint" className="block text-sm font-medium text-gray-700">
                    Chief Complaint
                  </label>
                  <textarea
                    id="chiefComplaint"
                    rows={3}
                    value={formData.chiefComplaint}
                    onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="history" className="block text-sm font-medium text-gray-700">
                    History
                  </label>
                  <textarea
                    id="history"
                    rows={3}
                    value={formData.history}
                    onChange={(e) => handleInputChange('history', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="examinationFindings" className="block text-sm font-medium text-gray-700">
                    Examination Findings
                  </label>
                  <textarea
                    id="examinationFindings"
                    rows={3}
                    value={formData.examinationFindings}
                    onChange={(e) => handleInputChange('examinationFindings', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">
                    Diagnosis
                  </label>
                  <textarea
                    id="diagnosis"
                    rows={3}
                    value={formData.diagnosis}
                    onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="treatment" className="block text-sm font-medium text-gray-700">
                    Treatment
                  </label>
                  <textarea
                    id="treatment"
                    rows={3}
                    value={formData.treatment}
                    onChange={(e) => handleInputChange('treatment', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="prescription" className="block text-sm font-medium text-gray-700">
                    Prescription
                  </label>
                  <textarea
                    id="prescription"
                    rows={3}
                    value={formData.prescription}
                    onChange={(e) => handleInputChange('prescription', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Medications */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Medications</h3>
              <div className="space-y-4">
                {formData.medications.map((med, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <span className="font-medium">{med.name}</span> - {med.dosage}, {med.frequency}
                      {med.duration && ` for ${med.duration}`}
                      {med.notes && ` (${med.notes})`}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
                  <div className="sm:col-span-2">
                    <label htmlFor="medName" className="block text-sm font-medium text-gray-700">
                      Medication Name
                    </label>
                    <input
                      type="text"
                      id="medName"
                      value={newMedication.name}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="medDosage" className="block text-sm font-medium text-gray-700">
                      Dosage
                    </label>
                    <input
                      type="text"
                      id="medDosage"
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="medFrequency" className="block text-sm font-medium text-gray-700">
                      Frequency
                    </label>
                    <input
                      type="text"
                      id="medFrequency"
                      value={newMedication.frequency}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="medDuration" className="block text-sm font-medium text-gray-700">
                      Duration
                    </label>
                    <input
                      type="text"
                      id="medDuration"
                      value={newMedication.duration}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, duration: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="medNotes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <input
                      type="text"
                      id="medNotes"
                      value={newMedication.notes}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Vaccinations */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vaccinations</h3>
              <div className="space-y-4">
                {formData.vaccinations.map((vacc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <span className="font-medium">{vacc.name}</span> - {new Date(vacc.date).toLocaleDateString()}
                      {vacc.nextDueDate && ` (Next: ${new Date(vacc.nextDueDate).toLocaleDateString()})`}
                      {vacc.batchNumber && ` (Batch: ${vacc.batchNumber})`}
                      {vacc.notes && ` (${vacc.notes})`}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVaccination(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
                  <div className="sm:col-span-2">
                    <label htmlFor="vaccName" className="block text-sm font-medium text-gray-700">
                      Vaccine Name
                    </label>
                    <input
                      type="text"
                      id="vaccName"
                      value={newVaccination.name}
                      onChange={(e) => setNewVaccination(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="vaccDate" className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      id="vaccDate"
                      value={newVaccination.date}
                      onChange={(e) => setNewVaccination(prev => ({ ...prev, date: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="vaccNextDue" className="block text-sm font-medium text-gray-700">
                      Next Due Date
                    </label>
                    <input
                      type="date"
                      id="vaccNextDue"
                      value={newVaccination.nextDueDate}
                      onChange={(e) => setNewVaccination(prev => ({ ...prev, nextDueDate: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddVaccination}
                      className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="vaccBatch" className="block text-sm font-medium text-gray-700">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      id="vaccBatch"
                      value={newVaccination.batchNumber}
                      onChange={(e) => setNewVaccination(prev => ({ ...prev, batchNumber: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="vaccNotes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <input
                      type="text"
                      id="vaccNotes"
                      value={newVaccination.notes}
                      onChange={(e) => setNewVaccination(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Laboratory Tests */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Laboratory Tests</h3>
              <div className="space-y-4">
                {formData.labTests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <span className="font-medium">{test.testName}</span> - {test.result || 'Pending'}
                      {test.date && ` (${new Date(test.date).toLocaleDateString()})`}
                      {test.notes && ` (${test.notes})`}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLabTest(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
                  <div className="sm:col-span-2">
                    <label htmlFor="testName" className="block text-sm font-medium text-gray-700">
                      Test Name
                    </label>
                    <input
                      type="text"
                      id="testName"
                      value={newLabTest.testName}
                      onChange={(e) => setNewLabTest(prev => ({ ...prev, testName: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="testResult" className="block text-sm font-medium text-gray-700">
                      Result
                    </label>
                    <input
                      type="text"
                      id="testResult"
                      value={newLabTest.result}
                      onChange={(e) => setNewLabTest(prev => ({ ...prev, result: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="testDate" className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      id="testDate"
                      value={newLabTest.date}
                      onChange={(e) => setNewLabTest(prev => ({ ...prev, date: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddLabTest}
                      className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="sm:col-span-5">
                    <label htmlFor="testNotes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <input
                      type="text"
                      id="testNotes"
                      value={newLabTest.notes}
                      onChange={(e) => setNewLabTest(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Vital Signs */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vital Signs</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="weight"
                    min="0"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    id="temperature"
                    min="0"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    id="heartRate"
                    min="0"
                    value={formData.heartRate}
                    onChange={(e) => handleInputChange('heartRate', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="respiratoryRate" className="block text-sm font-medium text-gray-700">
                    Respiratory Rate (rpm)
                  </label>
                  <input
                    type="number"
                    id="respiratoryRate"
                    min="0"
                    value={formData.respiratoryRate}
                    onChange={(e) => handleInputChange('respiratoryRate', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Follow-up */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Follow-up</h3>
              <div className="flex items-center">
                <input
                  id="followUpRequired"
                  name="followUpRequired"
                  type="checkbox"
                  checked={formData.followUpRequired}
                  onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="followUpRequired" className="ml-2 block text-sm text-gray-900">
                  Follow-up Required
                </label>
              </div>
              
              {formData.followUpRequired && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      id="followUpDate"
                      value={formData.followUpDate}
                      onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="followUpNotes" className="block text-sm font-medium text-gray-700">
                      Follow-up Notes
                    </label>
                    <input
                      type="text"
                      id="followUpNotes"
                      value={formData.followUpNotes}
                      onChange={(e) => handleInputChange('followUpNotes', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Cost and Payment */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cost and Payment</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                    Cost ($)
                  </label>
                  <input
                    type="number"
                    id="cost"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700">
                    Payment Status
                  </label>
                  <select
                    id="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/manager/veterinary/records')}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Create Medical Record'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ManagerModuleLayout>
  );
}