import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';
import ManagerModuleLayout from '../../../components/Manager/ManagerModuleLayout';

export default function VeterinaryConsultation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Medical Record Form Data
  const [medicalRecord, setMedicalRecord] = useState({
    // Vital Signs
    temperature: '',
    weight: '',
    heartRate: '',
    respiratoryRate: '',
    bloodPressure: '',
    
    // Examination
    chiefComplaint: '',
    symptoms: '',
    physicalExamination: '',
    diagnosis: '',
    
    // Treatment
    treatment: '',
    prescriptions: [],
    vaccinations: [],
    procedures: [],
    
    // Follow-up
    followUpRequired: false,
    followUpDate: '',
    followUpNotes: '',
    
    // Additional
    notes: '',
    recommendations: ''
  });

  const [newPrescription, setNewPrescription] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  const [newVaccination, setNewVaccination] = useState({
    vaccineName: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    nextDueDate: ''
  });

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      const response = await veterinaryAPI.managerGetAppointmentById(appointmentId);
      const apt = response.data.data.appointment;
      
      console.log('Loaded appointment:', apt);
      console.log('Pet data:', apt.petId);
      
      setAppointment(apt);
      
      // Pre-fill symptoms if available
      if (apt.symptoms) {
        setMedicalRecord(prev => ({
          ...prev,
          symptoms: apt.symptoms,
          chiefComplaint: apt.reason || ''
        }));
      }
      
      // Update appointment status to in_consultation
      if (apt.status !== 'in_consultation' && apt.status !== 'completed') {
        await veterinaryAPI.managerUpdateAppointment(appointmentId, {
          status: 'in_consultation'
        });
      }
    } catch (error) {
      console.error('Failed to load appointment:', error);
      alert('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setMedicalRecord(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPrescription = () => {
    if (!newPrescription.medication || !newPrescription.dosage) {
      alert('Please fill in medication name and dosage');
      return;
    }
    setMedicalRecord(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, { ...newPrescription, id: Date.now() }]
    }));
    setNewPrescription({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
  };

  const removePrescription = (id) => {
    setMedicalRecord(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(p => p.id !== id)
    }));
  };

  const addVaccination = () => {
    if (!newVaccination.vaccineName) {
      alert('Please enter vaccine name');
      return;
    }
    setMedicalRecord(prev => ({
      ...prev,
      vaccinations: [...prev.vaccinations, { ...newVaccination, id: Date.now(), date: new Date().toISOString() }]
    }));
    setNewVaccination({
      vaccineName: '',
      manufacturer: '',
      batchNumber: '',
      expiryDate: '',
      nextDueDate: ''
    });
  };

  const removeVaccination = (id) => {
    setMedicalRecord(prev => ({
      ...prev,
      vaccinations: prev.vaccinations.filter(v => v.id !== id)
    }));
  };

  const handleSaveAndComplete = async () => {
    // Validation
    if (!medicalRecord.diagnosis) {
      alert('Please enter a diagnosis before completing the consultation');
      return;
    }

    setSaving(true);
    try {
      // Get petId - it should be the ObjectId string
      let petId = appointment.petId;
      
      // If petId is an object (shouldn't happen now), try to extract the _id
      if (petId && typeof petId === 'object' && petId._id) {
        petId = petId._id;
      }
      
      // Convert to string if it's an ObjectId object
      if (petId && typeof petId === 'object' && petId.toString) {
        petId = petId.toString();
      }
      
      console.log('Saving medical record for appointment:', appointment);
      console.log('Pet ID extracted:', petId);
      console.log('Pet ID type:', typeof petId);
      
      if (!petId || typeof petId !== 'string' || petId.length !== 24) {
        console.error('Invalid Pet ID extracted from appointment:', {
          petId,
          type: typeof petId,
          appointment
        });
        alert('Pet information is invalid. Cannot save medical record. Please contact support.');
        setSaving(false);
        return;
      }
      
      // Create medical record
      const medicalRecordData = {
        petId: petId,
        appointmentId: appointment._id,
        visitDate: new Date().toISOString(),
        visitType: appointment.visitType || 'consultation',
        
        // Vital signs
        vitalSigns: {
          temperature: medicalRecord.temperature ? parseFloat(medicalRecord.temperature) : undefined,
          weight: medicalRecord.weight ? parseFloat(medicalRecord.weight) : undefined,
          heartRate: medicalRecord.heartRate ? parseInt(medicalRecord.heartRate) : undefined,
          respiratoryRate: medicalRecord.respiratoryRate ? parseInt(medicalRecord.respiratoryRate) : undefined,
          bloodPressure: medicalRecord.bloodPressure || undefined
        },
        
        // Examination details
        chiefComplaint: medicalRecord.chiefComplaint,
        symptoms: medicalRecord.symptoms,
        physicalExamination: medicalRecord.physicalExamination,
        diagnosis: medicalRecord.diagnosis,
        treatment: medicalRecord.treatment,
        
        // Prescriptions and vaccinations
        prescriptions: medicalRecord.prescriptions.map(p => ({
          medication: p.medication,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
          instructions: p.instructions
        })),
        
        vaccinations: medicalRecord.vaccinations.map(v => ({
          vaccineName: v.vaccineName,
          manufacturer: v.manufacturer,
          batchNumber: v.batchNumber,
          dateAdministered: v.date,
          expiryDate: v.expiryDate,
          nextDueDate: v.nextDueDate
        })),
        
        // Follow-up
        followUpRequired: medicalRecord.followUpRequired,
        followUpDate: medicalRecord.followUpDate || undefined,
        followUpNotes: medicalRecord.followUpNotes || undefined,
        
        // Additional notes
        notes: medicalRecord.notes,
        recommendations: medicalRecord.recommendations
      };

      await veterinaryAPI.managerCreateMedicalRecord(medicalRecordData);
      
      // Update appointment status to completed
      await veterinaryAPI.managerUpdateAppointment(appointmentId, {
        status: 'completed'
      });

      alert('Consultation completed and medical record saved successfully!');
      navigate('/manager/veterinary/appointments');
    } catch (error) {
      console.error('Failed to save medical record:', error);
      alert('Failed to save medical record: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ManagerModuleLayout title="Loading...">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ManagerModuleLayout>
    );
  }

  if (!appointment) {
    return (
      <ManagerModuleLayout title="Appointment Not Found">
        <div className="text-center py-12">
          <p className="text-gray-500">Appointment not found</p>
          <button
            onClick={() => navigate('/manager/veterinary/appointments')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Appointments
          </button>
        </div>
      </ManagerModuleLayout>
    );
  }

  const steps = [
    { id: 1, name: 'Vital Signs', icon: '🩺' },
    { id: 2, name: 'Examination', icon: '🔍' },
    { id: 3, name: 'Diagnosis & Treatment', icon: '💊' },
    { id: 4, name: 'Prescriptions & Vaccines', icon: '💉' },
    { id: 5, name: 'Follow-up & Notes', icon: '📋' }
  ];

  return (
    <ManagerModuleLayout
      title="Veterinary Consultation"
      subtitle={`Appointment #${appointment.appointmentNumber || appointment._id.slice(-6)}`}
    >
      {/* Patient Info Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
              🐾
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{appointment.petId?.name}</h2>
              <p className="text-sm text-gray-600">
                {appointment.petId?.species} • {appointment.petId?.breed}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Owner: {appointment.ownerId?.name} • {appointment.ownerId?.phone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Appointment Date</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.timeSlot}
            </p>
            <p className="text-sm text-gray-500 mt-2">Service</p>
            <p className="text-sm font-medium text-gray-900">
              {appointment.serviceId?.name || appointment.reason}
            </p>
          </div>
        </div>
        
        {appointment.symptoms && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm font-medium text-yellow-800">Reported Symptoms:</p>
            <p className="text-sm text-yellow-700 mt-1">{appointment.symptoms}</p>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex flex-col items-center ${
                  currentStep === step.id
                    ? 'text-blue-600'
                    : currentStep > step.id
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                    currentStep === step.id
                      ? 'bg-blue-100'
                      : currentStep > step.id
                      ? 'bg-green-100'
                      : 'bg-gray-100'
                  }`}
                >
                  {step.icon}
                </div>
                <span className="text-xs mt-1 font-medium">{step.name}</span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Vital Signs */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature (°F)
              </label>
              <input
                type="number"
                step="0.1"
                value={medicalRecord.temperature}
                onChange={(e) => handleInputChange('temperature', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 101.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={medicalRecord.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 25.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heart Rate (bpm)
              </label>
              <input
                type="number"
                value={medicalRecord.heartRate}
                onChange={(e) => handleInputChange('heartRate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Respiratory Rate (breaths/min)
              </label>
              <input
                type="number"
                value={medicalRecord.respiratoryRate}
                onChange={(e) => handleInputChange('respiratoryRate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Pressure
              </label>
              <input
                type="text"
                value={medicalRecord.bloodPressure}
                onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 120/80"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next: Examination
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Examination */}
      {currentStep === 2 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Physical Examination</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chief Complaint <span className="text-red-500">*</span>
              </label>
              <textarea
                value={medicalRecord.chiefComplaint}
                onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Main reason for visit..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symptoms Observed
              </label>
              <textarea
                value={medicalRecord.symptoms}
                onChange={(e) => handleInputChange('symptoms', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Detailed symptoms observed during examination..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Physical Examination Findings
              </label>
              <textarea
                value={medicalRecord.physicalExamination}
                onChange={(e) => handleInputChange('physicalExamination', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="General appearance, body condition, skin/coat, eyes, ears, nose, mouth/teeth, lymph nodes, cardiovascular, respiratory, abdomen, musculoskeletal, neurological..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next: Diagnosis
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Diagnosis & Treatment */}
      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnosis & Treatment Plan</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis <span className="text-red-500">*</span>
              </label>
              <textarea
                value={medicalRecord.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Primary diagnosis and any differential diagnoses..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">This field is required to complete the consultation</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Plan
              </label>
              <textarea
                value={medicalRecord.treatment}
                onChange={(e) => handleInputChange('treatment', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Detailed treatment plan including medications, procedures, dietary changes, activity restrictions, etc..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next: Prescriptions
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Prescriptions & Vaccines */}
      {currentStep === 4 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescriptions & Vaccinations</h3>
          
          {/* Prescriptions Section */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3">💊 Prescriptions</h4>
            
            {/* Existing Prescriptions */}
            {medicalRecord.prescriptions.length > 0 && (
              <div className="mb-4 space-y-2">
                {medicalRecord.prescriptions.map((prescription) => (
                  <div key={prescription.id} className="flex items-start justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{prescription.medication}</p>
                      <p className="text-sm text-gray-600">
                        Dosage: {prescription.dosage} | Frequency: {prescription.frequency} | Duration: {prescription.duration}
                      </p>
                      {prescription.instructions && (
                        <p className="text-sm text-gray-500 mt-1">Instructions: {prescription.instructions}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removePrescription(prescription.id)}
                      className="ml-3 text-red-600 hover:text-red-800"
                    >
                      ✗
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add New Prescription */}
            <div className="border border-gray-300 rounded-md p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Add Prescription</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Medication Name *"
                    value={newPrescription.medication}
                    onChange={(e) => setNewPrescription({...newPrescription, medication: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Dosage (e.g., 500mg) *"
                    value={newPrescription.dosage}
                    onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Frequency (e.g., Twice daily)"
                    value={newPrescription.frequency}
                    onChange={(e) => setNewPrescription({...newPrescription, frequency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Duration (e.g., 7 days)"
                    value={newPrescription.duration}
                    onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Special Instructions"
                    value={newPrescription.instructions}
                    onChange={(e) => setNewPrescription({...newPrescription, instructions: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={addPrescription}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                + Add Prescription
              </button>
            </div>
          </div>

          {/* Vaccinations Section */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">💉 Vaccinations</h4>
            
            {/* Existing Vaccinations */}
            {medicalRecord.vaccinations.length > 0 && (
              <div className="mb-4 space-y-2">
                {medicalRecord.vaccinations.map((vaccination) => (
                  <div key={vaccination.id} className="flex items-start justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{vaccination.vaccineName}</p>
                      <p className="text-sm text-gray-600">
                        Manufacturer: {vaccination.manufacturer || 'N/A'} | Batch: {vaccination.batchNumber || 'N/A'}
                      </p>
                      {vaccination.nextDueDate && (
                        <p className="text-sm text-gray-500 mt-1">Next Due: {new Date(vaccination.nextDueDate).toLocaleDateString()}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeVaccination(vaccination.id)}
                      className="ml-3 text-red-600 hover:text-red-800"
                    >
                      ✗
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add New Vaccination */}
            <div className="border border-gray-300 rounded-md p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Add Vaccination</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Vaccine Name *"
                    value={newVaccination.vaccineName}
                    onChange={(e) => setNewVaccination({...newVaccination, vaccineName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Manufacturer"
                    value={newVaccination.manufacturer}
                    onChange={(e) => setNewVaccination({...newVaccination, manufacturer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Batch Number"
                    value={newVaccination.batchNumber}
                    onChange={(e) => setNewVaccination({...newVaccination, batchNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    placeholder="Expiry Date"
                    value={newVaccination.expiryDate}
                    onChange={(e) => setNewVaccination({...newVaccination, expiryDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Next Due Date</label>
                  <input
                    type="date"
                    value={newVaccination.nextDueDate}
                    onChange={(e) => setNewVaccination({...newVaccination, nextDueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={addVaccination}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                + Add Vaccination
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(5)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next: Follow-up
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Follow-up & Notes */}
      {currentStep === 5 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow-up & Additional Notes</h3>
          
          <div className="space-y-4">
            {/* Follow-up Required */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={medicalRecord.followUpRequired}
                onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="followUpRequired" className="ml-2 block text-sm font-medium text-gray-700">
                Follow-up appointment required
              </label>
            </div>

            {/* Follow-up Date */}
            {medicalRecord.followUpRequired && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={medicalRecord.followUpDate}
                    onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Notes
                  </label>
                  <textarea
                    value={medicalRecord.followUpNotes}
                    onChange={(e) => handleInputChange('followUpNotes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Reason for follow-up, what to monitor, etc..."
                  />
                </div>
              </>
            )}

            {/* General Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                General Notes
              </label>
              <textarea
                value={medicalRecord.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional observations, client communications, or notes..."
              />
            </div>

            {/* Recommendations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recommendations for Owner
              </label>
              <textarea
                value={medicalRecord.recommendations}
                onChange={(e) => handleInputChange('recommendations', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Home care instructions, dietary recommendations, activity restrictions, warning signs to watch for, etc..."
              />
            </div>
          </div>

          {/* Summary Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Consultation Summary</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>✓ Vital Signs: {medicalRecord.temperature || medicalRecord.weight || medicalRecord.heartRate ? 'Recorded' : 'Not recorded'}</p>
              <p>✓ Examination: {medicalRecord.physicalExamination ? 'Completed' : 'Pending'}</p>
              <p>✓ Diagnosis: {medicalRecord.diagnosis ? 'Provided' : 'Required'}</p>
              <p>✓ Prescriptions: {medicalRecord.prescriptions.length} added</p>
              <p>✓ Vaccinations: {medicalRecord.vaccinations.length} administered</p>
              <p>✓ Follow-up: {medicalRecord.followUpRequired ? 'Required' : 'Not required'}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={handleSaveAndComplete}
              disabled={saving || !medicalRecord.diagnosis}
              className="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  ✓ Complete Consultation
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </ManagerModuleLayout>
  );
}
