import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { veterinaryAPI, petAPI } from '../../../services/api';

const VeterinaryManagerNewAppointment = () => {
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [petLookupLoading, setPetLookupLoading] = useState(false);
  const [petInfo, setPetInfo] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    petCode: '',
    serviceId: '',
    appointmentDate: '',
    timeSlot: '',
    reason: '',
    bookingType: 'routine',
    visitType: 'routine_checkup',
    symptoms: '',
    amount: 50,
    notes: ''
  });

  // Load services on component mount
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await veterinaryAPI.managerGetServices();
      setServices(response.data.data?.services || []);
    } catch (error) {
      console.error('Failed to load services:', error);
      setErrorMessage('Failed to load services. Please refresh the page.');
    }
  };

  // Pet lookup function
  const lookupPetByCode = async (petCode) => {
    if (!petCode || petCode.length < 3) {
      setPetInfo(null);
      return;
    }

    setPetLookupLoading(true);
    try {
      console.log('🔍 Looking up pet code:', petCode);
      
      const response = await petAPI.getCentralizedPet(petCode);
      const foundPet = response.data.data;
      
      if (foundPet) {
        console.log('✅ Found pet:', foundPet);
        
        // Extract species and breed names
        const getDisplayName = (item) => {
          if (!item) return 'Unknown';
          if (typeof item === 'string') return item;
          if (typeof item === 'object') {
            return item.displayName || item.name || 'Unknown';
          }
          return 'Unknown';
        };

        const petInfo = {
          petId: foundPet._id,
          petCode: foundPet.petCode,
          name: foundPet.name || 'Unnamed Pet',
          species: getDisplayName(foundPet.species) || getDisplayName(foundPet.sourceData?.speciesId) || 'Unknown Species',
          breed: getDisplayName(foundPet.breed) || getDisplayName(foundPet.sourceData?.breedId) || 'Unknown Breed',
          source: foundPet.source,
          owner: {
            id: foundPet.currentOwnerId?._id || foundPet.currentOwnerId,
            name: foundPet.currentOwnerId?.name || 'Pet Owner',
            email: foundPet.currentOwnerId?.email || ''
          }
        };

        setPetInfo(petInfo);
        setErrors(prev => ({ ...prev, petCode: '' }));
        console.log('✅ Pet lookup successful:', petInfo);
      } else {
        setPetInfo(null);
        setErrors(prev => ({ 
          ...prev, 
          petCode: `Pet not found with code "${petCode}". Please check the pet code and try again.` 
        }));
      }
    } catch (error) {
      console.error('Pet lookup failed:', error);
      setPetInfo(null);
      if (error.response?.status === 404) {
        setErrors(prev => ({ 
          ...prev, 
          petCode: `Pet not found with code "${petCode}". Please check the pet code and try again.` 
        }));
      } else {
        setErrors(prev => ({ ...prev, petCode: 'Failed to lookup pet. Please try again.' }));
      }
    } finally {
      setPetLookupLoading(false);
    }
  };
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Handle pet code lookup with debouncing
    if (name === 'petCode') {
      clearTimeout(window.petCodeTimeout);
      window.petCodeTimeout = setTimeout(() => {
        lookupPetByCode(value);
      }, 500);
    }

    // Auto-update amount when service changes
    if (name === 'serviceId') {
      const selectedService = services.find(s => s._id === value);
      if (selectedService) {
        setFormData(prev => ({ ...prev, amount: selectedService.price }));
      }
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.petCode) newErrors.petCode = 'Pet code is required';
    if (!petInfo) newErrors.petCode = 'Please enter a valid pet code';
    if (!formData.serviceId) newErrors.serviceId = 'Service is required';
    if (!formData.appointmentDate) newErrors.appointmentDate = 'Appointment date is required';
    if (!formData.timeSlot) newErrors.timeSlot = 'Time slot is required';
    if (!formData.reason) newErrors.reason = 'Reason is required';
    
    // Validate appointment date is not in the past
    const selectedDate = new Date(formData.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      newErrors.appointmentDate = 'Appointment date cannot be in the past';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const appointmentData = {
        petId: petInfo.petId,
        ownerId: petInfo.owner.id,
        serviceId: formData.serviceId,
        appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
        reason: formData.reason,
        bookingType: formData.bookingType,
        visitType: formData.visitType,
        symptoms: formData.symptoms,
        amount: formData.amount,
        notes: formData.notes,
        status: 'confirmed',
        paymentStatus: 'pending'
      };

      await veterinaryAPI.managerCreateAppointment(appointmentData);
      setSuccessMessage('Appointment created successfully!');
      
      setTimeout(() => {
        navigate('/manager/veterinary/appointments');
      }, 1500);
    } catch (error) {
      console.error('Failed to create appointment:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create appointment. Please try again.';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) continue;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate('/manager/veterinary/appointments')}
            className="group inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 mb-8 transition-all duration-200"
          >
            <svg className="mr-2 h-4 w-4 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Appointments
          </button>
          
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Create New Appointment</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enter pet code to automatically load pet and owner information, then schedule the appointment with ease
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-8 bg-green-50 border-l-4 border-green-400 rounded-xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xl font-semibold text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-400 rounded-xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xl font-semibold text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
        {/* Main Form Container */}
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
          <form onSubmit={handleSubmit}>
            {/* Pet Lookup Section */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-8">
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                Pet Information Lookup
              </h2>
              
              {/* Pet Code Input */}
              <div className="mb-8">
                <label htmlFor="petCode" className="block text-lg font-semibold text-blue-100 mb-4">
                  Pet Code <span className="text-yellow-300 text-xl">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="petCode"
                    id="petCode"
                    value={formData.petCode}
                    onChange={handleInputChange}
                    placeholder="Enter pet code (e.g., HAK39168, TGV34152)"
                    className={`w-full bg-white border-3 rounded-2xl pl-12 pr-16 py-5 text-xl font-medium focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 shadow-lg ${
                      errors.petCode ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  {petLookupLoading && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {errors.petCode && (
                  <div className="mt-3 p-4 bg-red-500 bg-opacity-20 border border-red-300 rounded-xl">
                    <p className="text-red-100 font-medium">{errors.petCode}</p>
                  </div>
                )}
                <p className="mt-4 text-blue-100 text-lg flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Enter the pet's unique code to automatically load pet and owner details
                </p>
              </div>
            </div>
            {/* Pet Information Display */}
            {petInfo && (
              <div className="px-8 py-8 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-b-4 border-green-200">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-green-200 transform hover:scale-105 transition-transform duration-300">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                        <span className="text-2xl">🐾</span>
                      </div>
                      Pet Details
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                        <span className="text-lg font-semibold text-gray-600">Name:</span>
                        <span className="text-xl font-bold text-gray-900">{petInfo.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                        <span className="text-lg font-semibold text-gray-600">Species:</span>
                        <span className="text-xl text-gray-800">{petInfo.species}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                        <span className="text-lg font-semibold text-gray-600">Breed:</span>
                        <span className="text-xl text-gray-800">{petInfo.breed}</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-lg font-semibold text-gray-600">Code:</span>
                        <span className="text-xl font-mono bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 rounded-xl border-2 border-blue-200">{petInfo.petCode}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-blue-200 transform hover:scale-105 transition-transform duration-300">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                        <span className="text-2xl">👤</span>
                      </div>
                      Owner Details
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                        <span className="text-lg font-semibold text-gray-600">Name:</span>
                        <span className="text-xl font-bold text-gray-900">{petInfo.owner.name}</span>
                      </div>
                      {petInfo.owner.email && (
                        <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                          <span className="text-lg font-semibold text-gray-600">Email:</span>
                          <span className="text-xl text-gray-800">{petInfo.owner.email}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-3">
                        <span className="text-lg font-semibold text-gray-600">Source:</span>
                        <span className={`px-4 py-2 rounded-full text-lg font-bold shadow-lg ${
                          petInfo.source === 'user' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                          petInfo.source === 'adoption' ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white' :
                          petInfo.source === 'petshop' ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white' :
                          'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                        }`}>
                          {petInfo.source === 'user' ? '🏠 User Pet' :
                           petInfo.source === 'adoption' ? '🏥 Adoption' :
                           petInfo.source === 'petshop' ? '🏪 Pet Shop' :
                           petInfo.source}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Appointment Details Section */}
            <div className="px-8 py-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-10 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Appointment Details
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                {/* Service Selection */}
                <div className="space-y-3">
                  <label htmlFor="serviceId" className="block text-lg font-bold text-gray-700 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Service <span className="text-red-500 text-xl">*</span>
                  </label>
                  <select
                    id="serviceId"
                    name="serviceId"
                    value={formData.serviceId}
                    onChange={handleInputChange}
                    className={`w-full border-3 rounded-2xl px-6 py-5 text-lg font-medium focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 shadow-lg ${
                      errors.serviceId ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <option value="">🏥 Select a service</option>
                    {services.map(service => (
                      <option key={service._id} value={service._id}>
                        {service.name} - ₹{service.price}
                      </option>
                    ))}
                  </select>
                  {errors.serviceId && <p className="mt-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 font-medium">{errors.serviceId}</p>}
                </div>

                {/* Amount */}
                <div className="space-y-3">
                  <label htmlFor="amount" className="block text-lg font-bold text-gray-700 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Amount (₹) <span className="text-red-500 text-xl">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl font-bold">₹</span>
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full border-3 border-gray-200 rounded-2xl pl-12 pr-6 py-5 text-lg font-medium focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 shadow-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-500 italic">💡 Amount will auto-update when you select a service</p>
                </div>

                {/* Appointment Date */}
                <div className="space-y-3">
                  <label htmlFor="appointmentDate" className="block text-lg font-bold text-gray-700 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Appointment Date <span className="text-red-500 text-xl">*</span>
                  </label>
                  <input
                    type="date"
                    name="appointmentDate"
                    id="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full border-3 rounded-2xl px-6 py-5 text-lg font-medium focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 shadow-lg ${
                      errors.appointmentDate ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  {errors.appointmentDate && <p className="mt-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 font-medium">{errors.appointmentDate}</p>}
                </div>

                {/* Time Slot */}
                <div className="space-y-3">
                  <label htmlFor="timeSlot" className="block text-lg font-bold text-gray-700 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time Slot <span className="text-red-500 text-xl">*</span>
                  </label>
                  <select
                    id="timeSlot"
                    name="timeSlot"
                    value={formData.timeSlot}
                    onChange={handleInputChange}
                    className={`w-full border-3 rounded-2xl px-6 py-5 text-lg font-medium focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 shadow-lg ${
                      errors.timeSlot ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <option value="">🕐 Select a time slot</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {errors.timeSlot && <p className="mt-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 font-medium">{errors.timeSlot}</p>}
                </div>
              </div>
              {/* Reason */}
              <div className="space-y-3 mb-8">
                <label htmlFor="reason" className="block text-lg font-bold text-gray-700 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Reason for Visit <span className="text-red-500 text-xl">*</span>
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={5}
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Describe the reason for the visit in detail..."
                  className={`w-full border-3 rounded-2xl px-6 py-5 text-lg font-medium focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 resize-none shadow-lg ${
                    errors.reason ? 'border-red-400 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {errors.reason && <p className="mt-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 font-medium">{errors.reason}</p>}
              </div>

              {/* Symptoms */}
              <div className="space-y-3 mb-8">
                <label htmlFor="symptoms" className="block text-lg font-bold text-gray-700 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Symptoms
                </label>
                <textarea
                  id="symptoms"
                  name="symptoms"
                  rows={4}
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  placeholder="Describe any symptoms the pet is experiencing..."
                  className="w-full border-3 border-gray-200 rounded-2xl px-6 py-5 text-lg font-medium focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 resize-none shadow-lg"
                />
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <label htmlFor="notes" className="block text-lg font-bold text-gray-700 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes or special instructions..."
                  className="w-full border-3 border-gray-200 rounded-2xl px-6 py-5 text-lg font-medium focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 resize-none shadow-lg"
                />
              </div>
            </div>
            {/* Form Actions */}
            <div className="px-8 py-8 bg-gradient-to-r from-gray-50 to-blue-50 border-t-4 border-blue-200 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                type="button"
                onClick={() => navigate('/manager/veterinary/appointments')}
                className="px-10 py-5 border-3 border-gray-300 rounded-2xl text-xl font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !petInfo}
                className="px-10 py-5 border-3 border-transparent rounded-2xl text-xl font-bold text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-2xl"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-4 h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Appointment...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Appointment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 border-2 border-blue-200 shadow-xl">
          <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Quick Tips & Guidelines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg text-blue-800">
            <div className="flex items-start bg-white rounded-xl p-4 shadow-md">
              <span className="text-blue-600 mr-3 text-2xl">🔍</span>
              <span><strong>Pet Code Lookup:</strong> Enter the pet code to automatically load pet and owner information</span>
            </div>
            <div className="flex items-start bg-white rounded-xl p-4 shadow-md">
              <span className="text-green-600 mr-3 text-2xl">💰</span>
              <span><strong>Auto Pricing:</strong> Service price will automatically update when you select a service</span>
            </div>
            <div className="flex items-start bg-white rounded-xl p-4 shadow-md">
              <span className="text-purple-600 mr-3 text-2xl">✅</span>
              <span><strong>Auto Confirmation:</strong> Manager-created appointments are automatically confirmed</span>
            </div>
            <div className="flex items-start bg-white rounded-xl p-4 shadow-md">
              <span className="text-red-600 mr-3 text-2xl">⚠️</span>
              <span><strong>Required Fields:</strong> All fields marked with * are required for submission</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VeterinaryManagerNewAppointment;