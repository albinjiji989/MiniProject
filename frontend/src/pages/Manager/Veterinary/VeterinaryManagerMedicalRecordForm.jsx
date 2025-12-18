import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ManagerModuleLayout from '../../../components/Manager/ManagerModuleLayout';
import { veterinaryAPI } from '../../../services/api';
import MedicalRecordAttachments from '../../../components/Veterinary/MedicalRecordAttachments';

export default function VeterinaryManagerMedicalRecordForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEdit = !!id;
  const urlParams = new URLSearchParams(location.search);
  const appointmentId = urlParams.get('appointmentId');
  
  const [formData, setFormData] = useState({
    petId: '',
    veterinaryId: '',
    staffId: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'routine_checkup',
    chiefComplaint: '',
    history: '',
    examinationFindings: '',
    diagnosis: '',
    treatment: '',
    prescription: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }],
    vaccinations: [{ name: '', date: '', nextDueDate: '', batchNumber: '', notes: '' }],
    labTests: [{ testName: '', date: '', result: '', notes: '' }],
    weight: '',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    followUpRequired: false,
    followUpDate: '',
    followUpNotes: '',
    cost: '',
    status: 'completed',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [pets, setPets] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    loadDropdownData();
    if (isEdit) {
      loadMedicalRecord();
    } else if (appointmentId) {
      loadAppointmentData();
    }
  }, [id, appointmentId]);

  const loadDropdownData = async () => {
    try {
      // In a real implementation, this would fetch actual data
      // For now, we'll use sample data
      setPets([
        { _id: '1', name: 'Max', species: 'Dog', breed: 'Golden Retriever' },
        { _id: '2', name: 'Bella', species: 'Cat', breed: 'Persian' },
        { _id: '3', name: 'Charlie', species: 'Dog', breed: 'Bulldog' }
      ]);
      
      setClinics([
        { _id: '1', name: 'Paws & Claws Veterinary Clinic' },
        { _id: '2', name: 'Animal Care Center' }
      ]);
      
      setStaff([
        { _id: '1', name: 'Dr. Jane Doe', role: 'Veterinarian' },
        { _id: '2', name: 'Dr. John Smith', role: 'Veterinarian' },
        { _id: '3', name: 'Sarah Johnson', role: 'Veterinary Technician' }
      ]);
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
    }
  };

  const loadMedicalRecord = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch actual medical record data
      // For now, we'll use sample data
      const sampleRecord = {
        petId: '1',
        veterinaryId: '1',
        staffId: '1',
        visitDate: '2023-10-20',
        visitType: 'routine_checkup',
        chiefComplaint: 'Annual wellness exam',
        history: 'Previous vaccinations up to date. No significant medical history.',
        examinationFindings: 'Alert and responsive. Normal heart rate and respiration. Good body condition.',
        diagnosis: 'Healthy',
        treatment: 'Routine examination and vaccinations administered',
        prescription: 'Annual vaccines: Rabies, DHPP',
        medications: [
          {
            name: 'Rabies Vaccine',
            dosage: '1ml',
            frequency: 'Once',
            duration: 'Single dose',
            notes: 'Administered subcutaneously'
          }
        ],
        vaccinations: [
          {
            name: 'Rabies',
            date: '2023-10-20',
            nextDueDate: '2024-10-20',
            batchNumber: 'RB-2023-001',
            notes: 'Routine annual vaccination'
          }
        ],
        labTests: [
          {
            testName: 'Complete Blood Count',
            date: '2023-10-20',
            result: 'Normal',
            notes: 'All parameters within normal range'
          }
        ],
        weight: '32',
        temperature: '38.5',
        heartRate: '85',
        respiratoryRate: '20',
        followUpRequired: true,
        followUpDate: '2024-04-20',
        followUpNotes: 'Routine 6-month checkup',
        cost: '75.00',
        status: 'completed',
        notes: 'Owner reports pet is eating and drinking normally. No vomiting or diarrhea.'
      };
      
      setFormData(sampleRecord);
    } catch (error) {
      console.error('Failed to load medical record:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointmentData = async () => {
    try {
      // In a real implementation, this would fetch actual appointment data
      // For now, we'll use sample data
      const sampleAppointment = {
        petId: '1',
        veterinaryId: '1',
        staffId: '1',
        visitDate: new Date().toISOString().split('T')[0],
        visitType: 'routine_checkup',
        chiefComplaint: 'Annual checkup and vaccinations',
        history: 'Previous vaccinations up to date. No significant medical history.',
        examinationFindings: '',
        diagnosis: '',
        treatment: '',
        prescription: '',
        medications: [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }],
        vaccinations: [{ name: '', date: '', nextDueDate: '', batchNumber: '', notes: '' }],
        labTests: [{ testName: '', date: '', result: '', notes: '' }],
        weight: '',
        temperature: '',
        heartRate: '',
        respiratoryRate: '',
        followUpRequired: false,
        followUpDate: '',
        followUpNotes: '',
        cost: '75.00',
        status: 'completed',
        notes: ''
      };
      
      setFormData(sampleAppointment);
    } catch (error) {
      console.error('Failed to load appointment data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleArrayInputChange = (index, field, value, arrayName) => {
    setFormData(prev => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addArrayItem = (arrayName) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], 
        arrayName === 'medications' ? { name: '', dosage: '', frequency: '', duration: '', notes: '' } :
        arrayName === 'vaccinations' ? { name: '', date: '', nextDueDate: '', batchNumber: '', notes: '' } :
        { testName: '', date: '', result: '', notes: '' }
      ]
    }));
  };

  const removeArrayItem = (index, arrayName) => {
    setFormData(prev => {
      const newArray = [...prev[arrayName]];
      newArray.splice(index, 1);
      return { ...prev, [arrayName]: newArray };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.petId) newErrors.petId = 'Pet is required';
    if (!formData.veterinaryId) newErrors.veterinaryId = 'Clinic is required';
    if (!formData.staffId) newErrors.staffId = 'Staff member is required';
    if (!formData.visitDate) newErrors.visitDate = 'Visit date is required';
    if (!formData.chiefComplaint) newErrors.chiefComplaint = 'Chief complaint is required';
    if (!formData.history) newErrors.history = 'History is required';
    if (!formData.examinationFindings) newErrors.examinationFindings = 'Examination findings are required';
    if (!formData.diagnosis) newErrors.diagnosis = 'Diagnosis is required';
    if (!formData.treatment) newErrors.treatment = 'Treatment is required';
    if (formData.cost && isNaN(formData.cost)) newErrors.cost = 'Cost must be a valid number';
    if (formData.weight && isNaN(formData.weight)) newErrors.weight = 'Weight must be a valid number';
    if (formData.temperature && isNaN(formData.temperature)) newErrors.temperature = 'Temperature must be a valid number';
    if (formData.heartRate && isNaN(formData.heartRate)) newErrors.heartRate = 'Heart rate must be a valid number';
    if (formData.respiratoryRate && isNaN(formData.respiratoryRate)) newErrors.respiratoryRate = 'Respiratory rate must be a valid number';
    
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
      const recordData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined
      };
      
      let response;
      if (isEdit) {
        // Update existing medical record
        response = await veterinaryAPI.managerUpdateMedicalRecord(id, recordData);
      } else {
        // Create new medical record
        response = await veterinaryAPI.managerCreateMedicalRecord(recordData);
      }
      
      // If we have attachments to upload, do that now
      // Note: In a real implementation, you might want to handle this differently
      // For now, we'll navigate to the record detail page where attachments can be added
      
      navigate('/manager/veterinary/records');
    } catch (error) {
      console.error('Failed to save medical record:', error);
      alert('Failed to save medical record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getVisitTypeOptions = () => {
    return [
      { value: 'routine_checkup', label: 'Routine Checkup' },
      { value: 'vaccination', label: 'Vaccination' },
      { value: 'surgery', label: 'Surgery' },
      { value: 'emergency', label: 'Emergency' },
      { value: 'follow_up', label: 'Follow-up' },
      { value: 'consultation', label: 'Consultation' },
      { value: 'other', label: 'Other' }
    ];
  };

  const getUrgencyOptions = () => {
    return [
      { value: 'normal', label: 'Normal' },
      { value: 'urgent', label: 'Urgent' },
      { value: 'emergency', label: 'Emergency' }
    ];
  };

  const getStatusOptions = () => {
    return [
      { value: 'completed', label: 'Completed' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'scheduled', label: 'Scheduled' }
    ];
  };

  if (loading) {
    return (
      <ManagerModuleLayout
        title={isEdit ? "Edit Medical Record" : "Add New Medical Record"}
        subtitle={isEdit ? "Update medical record details" : "Create a new medical record"}
      >
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </ManagerModuleLayout>
    );
  }

  return (
    <ManagerModuleLayout
      title={isEdit ? "Edit Medical Record" : "Add New Medical Record"}
      subtitle={isEdit ? "Update medical record details" : "Create a new medical record"}
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
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Basic Information */}
              <div className="sm:col-span-6">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="petId" className="block text-sm font-medium text-gray-700">
                  Pet <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="petId"
                    name="petId"
                    value={formData.petId}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.petId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  >
                    <option value="">Select a pet</option>
                    {pets.map((pet) => (
                      <option key={pet._id} value={pet._id}>
                        {pet.name} ({pet.species} - {pet.breed})
                      </option>
                    ))}
                  </select>
                  {errors.petId && <p className="mt-1 text-sm text-red-600">{errors.petId}</p>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="veterinaryId" className="block text-sm font-medium text-gray-700">
                  Clinic <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="veterinaryId"
                    name="veterinaryId"
                    value={formData.veterinaryId}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.veterinaryId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  >
                    <option value="">Select a clinic</option>
                    {clinics.map((clinic) => (
                      <option key={clinic._id} value={clinic._id}>
                        {clinic.name}
                      </option>
                    ))}
                  </select>
                  {errors.veterinaryId && <p className="mt-1 text-sm text-red-600">{errors.veterinaryId}</p>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="staffId" className="block text-sm font-medium text-gray-700">
                  Staff <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="staffId"
                    name="staffId"
                    value={formData.staffId}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.staffId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  >
                    <option value="">Select staff</option>
                    {staff.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                  {errors.staffId && <p className="mt-1 text-sm text-red-600">{errors.staffId}</p>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700">
                  Visit Date <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="visitDate"
                    id="visitDate"
                    value={formData.visitDate}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.visitDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.visitDate && <p className="mt-1 text-sm text-red-600">{errors.visitDate}</p>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="visitType" className="block text-sm font-medium text-gray-700">
                  Visit Type
                </label>
                <div className="mt-1">
                  <select
                    id="visitType"
                    name="visitType"
                    value={formData.visitType}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {getVisitTypeOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              

              {/* Clinical Information */}
              <div className="sm:col-span-6 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Clinical Information</h3>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="chiefComplaint" className="block text-sm font-medium text-gray-700">
                  Chief Complaint <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="chiefComplaint"
                    name="chiefComplaint"
                    rows={3}
                    value={formData.chiefComplaint}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.chiefComplaint ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.chiefComplaint && <p className="mt-1 text-sm text-red-600">{errors.chiefComplaint}</p>}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="history" className="block text-sm font-medium text-gray-700">
                  History <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="history"
                    name="history"
                    rows={3}
                    value={formData.history}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.history ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.history && <p className="mt-1 text-sm text-red-600">{errors.history}</p>}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="examinationFindings" className="block text-sm font-medium text-gray-700">
                  Examination Findings <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="examinationFindings"
                    name="examinationFindings"
                    rows={3}
                    value={formData.examinationFindings}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.examinationFindings ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.examinationFindings && <p className="mt-1 text-sm text-red-600">{errors.examinationFindings}</p>}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">
                  Diagnosis <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="diagnosis"
                    name="diagnosis"
                    rows={2}
                    value={formData.diagnosis}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.diagnosis ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.diagnosis && <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="treatment" className="block text-sm font-medium text-gray-700">
                  Treatment <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="treatment"
                    name="treatment"
                    rows={3}
                    value={formData.treatment}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.treatment ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.treatment && <p className="mt-1 text-sm text-red-600">{errors.treatment}</p>}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="prescription" className="block text-sm font-medium text-gray-700">
                  Prescription
                </label>
                <div className="mt-1">
                  <textarea
                    id="prescription"
                    name="prescription"
                    rows={3}
                    value={formData.prescription}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Medications */}
              <div className="sm:col-span-6 pt-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Medications</h3>
                  <button
                    type="button"
                    onClick={() => addArrayItem('medications')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Medication
                  </button>
                </div>
              </div>

              {formData.medications.map((med, index) => (
                <div key={index} className="sm:col-span-6 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor={`medications-${index}-name`} className="block text-sm font-medium text-gray-700">
                        Medication Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id={`medications-${index}-name`}
                          value={med.name}
                          onChange={(e) => handleArrayInputChange(index, 'name', e.target.value, 'medications')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor={`medications-${index}-dosage`} className="block text-sm font-medium text-gray-700">
                        Dosage
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id={`medications-${index}-dosage`}
                          value={med.dosage}
                          onChange={(e) => handleArrayInputChange(index, 'dosage', e.target.value, 'medications')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`medications-${index}-frequency`} className="block text-sm font-medium text-gray-700">
                        Frequency
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id={`medications-${index}-frequency`}
                          value={med.frequency}
                          onChange={(e) => handleArrayInputChange(index, 'frequency', e.target.value, 'medications')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`medications-${index}-duration`} className="block text-sm font-medium text-gray-700">
                        Duration
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id={`medications-${index}-duration`}
                          value={med.duration}
                          onChange={(e) => handleArrayInputChange(index, 'duration', e.target.value, 'medications')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={() => removeArrayItem(index, 'medications')}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="sm:col-span-6">
                      <label htmlFor={`medications-${index}-notes`} className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <div className="mt-1">
                        <textarea
                          id={`medications-${index}-notes`}
                          rows={2}
                          value={med.notes}
                          onChange={(e) => handleArrayInputChange(index, 'notes', e.target.value, 'medications')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Vaccinations */}
              <div className="sm:col-span-6 pt-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Vaccinations</h3>
                  <button
                    type="button"
                    onClick={() => addArrayItem('vaccinations')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Vaccination
                  </button>
                </div>
              </div>

              {formData.vaccinations.map((vacc, index) => (
                <div key={index} className="sm:col-span-6 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor={`vaccinations-${index}-name`} className="block text-sm font-medium text-gray-700">
                        Vaccine Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id={`vaccinations-${index}-name`}
                          value={vacc.name}
                          onChange={(e) => handleArrayInputChange(index, 'name', e.target.value, 'vaccinations')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor={`vaccinations-${index}-batchNumber`} className="block text-sm font-medium text-gray-700">
                        Batch Number
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id={`vaccinations-${index}-batchNumber`}
                          value={vacc.batchNumber}
                          onChange={(e) => handleArrayInputChange(index, 'batchNumber', e.target.value, 'vaccinations')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`vaccinations-${index}-date`} className="block text-sm font-medium text-gray-700">
                        Date Administered
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          id={`vaccinations-${index}-date`}
                          value={vacc.date}
                          onChange={(e) => handleArrayInputChange(index, 'date', e.target.value, 'vaccinations')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`vaccinations-${index}-nextDueDate`} className="block text-sm font-medium text-gray-700">
                        Next Due Date
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          id={`vaccinations-${index}-nextDueDate`}
                          value={vacc.nextDueDate}
                          onChange={(e) => handleArrayInputChange(index, 'nextDueDate', e.target.value, 'vaccinations')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={() => removeArrayItem(index, 'vaccinations')}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="sm:col-span-6">
                      <label htmlFor={`vaccinations-${index}-notes`} className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <div className="mt-1">
                        <textarea
                          id={`vaccinations-${index}-notes`}
                          rows={2}
                          value={vacc.notes}
                          onChange={(e) => handleArrayInputChange(index, 'notes', e.target.value, 'vaccinations')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Laboratory Tests */}
              <div className="sm:col-span-6 pt-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Laboratory Tests</h3>
                  <button
                    type="button"
                    onClick={() => addArrayItem('labTests')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Test
                  </button>
                </div>
              </div>

              {formData.labTests.map((test, index) => (
                <div key={index} className="sm:col-span-6 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor={`labTests-${index}-testName`} className="block text-sm font-medium text-gray-700">
                        Test Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id={`labTests-${index}-testName`}
                          value={test.testName}
                          onChange={(e) => handleArrayInputChange(index, 'testName', e.target.value, 'labTests')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor={`labTests-${index}-result`} className="block text-sm font-medium text-gray-700">
                        Result
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id={`labTests-${index}-result`}
                          value={test.result}
                          onChange={(e) => handleArrayInputChange(index, 'result', e.target.value, 'labTests')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`labTests-${index}-date`} className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          id={`labTests-${index}-date`}
                          value={test.date}
                          onChange={(e) => handleArrayInputChange(index, 'date', e.target.value, 'labTests')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={() => removeArrayItem(index, 'labTests')}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="sm:col-span-6">
                      <label htmlFor={`labTests-${index}-notes`} className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <div className="mt-1">
                        <textarea
                          id={`labTests-${index}-notes`}
                          rows={2}
                          value={test.notes}
                          onChange={(e) => handleArrayInputChange(index, 'notes', e.target.value, 'labTests')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Vital Signs */}
              <div className="sm:col-span-6 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Vital Signs</h3>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                  Weight (kg)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="weight"
                    id="weight"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.weight ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.weight && <p className="mt-1 text-sm text-red-600">{errors.weight}</p>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                  Temperature (°C)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="temperature"
                    id="temperature"
                    step="0.1"
                    min="0"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.temperature ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.temperature && <p className="mt-1 text-sm text-red-600">{errors.temperature}</p>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700">
                  Heart Rate (bpm)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="heartRate"
                    id="heartRate"
                    min="0"
                    value={formData.heartRate}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.heartRate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.heartRate && <p className="mt-1 text-sm text-red-600">{errors.heartRate}</p>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="respiratoryRate" className="block text-sm font-medium text-gray-700">
                  Respiratory Rate (rpm)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="respiratoryRate"
                    id="respiratoryRate"
                    min="0"
                    value={formData.respiratoryRate}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.respiratoryRate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.respiratoryRate && <p className="mt-1 text-sm text-red-600">{errors.respiratoryRate}</p>}
                </div>
              </div>

              {/* Follow-up */}
              <div className="sm:col-span-6 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Follow-up</h3>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="followUpRequired"
                      name="followUpRequired"
                      type="checkbox"
                      checked={formData.followUpRequired}
                      onChange={handleInputChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="followUpRequired" className="font-medium text-gray-700">
                      Follow-up Required
                    </label>
                  </div>
                </div>
              </div>

              {formData.followUpRequired && (
                <>
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
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Financial Information */}
              <div className="sm:col-span-6 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Financial Information</h3>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                  Cost ($)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="cost"
                    id="cost"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.cost ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {getStatusOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="sm:col-span-6 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Additional Notes</h3>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <div className="mt-1">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/manager/veterinary/records')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEdit ? 'Update Record' : 'Create Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Attachments section - only show for existing records */}
      {isEdit && (
        <div className="mt-6 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <MedicalRecordAttachments recordId={id} />
          </div>
        </div>
      )}
    </ManagerModuleLayout>
  );
}