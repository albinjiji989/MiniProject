import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userPetsAPI, adoptionAPI, petShopAPI, veterinaryAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function ProfessionalVeterinaryBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 4; // Reduced from 5 to 4 (removed doctor selection)
  
  // Data states
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Selection states
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [symptoms, setSymptoms] = useState('');
  
  // Available slots state
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Search/filter
  const [searchTerm, setSearchTerm] = useState('');

  // Step labels
  const stepLabels = ['Select Pet', 'Choose Service', 'Pick Date & Time', 'Confirm'];

  useEffect(() => {
    // Load services when component mounts
    loadAvailableServices();
    
    // Check if pet was passed from navigation
    if (location.state?.selectedPet) {
      const pet = location.state.selectedPet;
      setSelectedPet(normalizePet(pet));
      setCurrentStep(2);
    } else {
      loadAllPets();
    }
  }, [location.state]);

  // Load available services from API
  const loadAvailableServices = async () => {
    setLoadingServices(true);
    try {
      const response = await veterinaryAPI.getAvailableServices();
      if (response.data?.success) {
        const { services: fetchedServices, clinics: fetchedClinics } = response.data.data;
        setServices(fetchedServices || []);
        setClinics(fetchedClinics || []);
        // Automatically select the first clinic if available
        if (fetchedClinics && fetchedClinics.length > 0) {
          setSelectedClinic(fetchedClinics[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      // Keep empty arrays if fetch fails
      setServices([]);
      setClinics([]);
    } finally {
      setLoadingServices(false);
    }
  };

  // Normalize pet data from different sources
  const normalizePet = (pet) => {
    let speciesName = 'Unknown';
    if (typeof pet.species === 'string' && pet.species) {
      speciesName = pet.species;
    } else if (pet.species && typeof pet.species === 'object') {
      speciesName = pet.species.displayName || pet.species.name || 'Unknown';
    }
    
    let breedName = 'Unknown';
    if (typeof pet.breed === 'string' && pet.breed) {
      breedName = pet.breed;
    } else if (pet.breed && typeof pet.breed === 'object') {
      breedName = pet.breed.name || 'Unknown';
    }
    
    const source = pet.source || 'owned';
    const sourceLabels = {
      owned: { label: 'My Pet', badge: 'bg-purple-100 text-purple-800' },
      adopted: { label: 'Adopted', badge: 'bg-green-100 text-green-800' },
      purchased: { label: 'Purchased', badge: 'bg-blue-100 text-blue-800' },
      adoption: { label: 'Adopted', badge: 'bg-green-100 text-green-800' },
      petshop: { label: 'Purchased', badge: 'bg-blue-100 text-blue-800' }
    };
    
    return {
      ...pet,
      species: speciesName,
      breed: breedName,
      source,
      sourceLabel: sourceLabels[source]?.label || 'Pet',
      sourceBadge: sourceLabels[source]?.badge || 'bg-gray-100 text-gray-800'
    };
  };

  const loadAllPets = async () => {
    setLoading(true);
    try {
      const [ownedRes, adoptedRes, purchasedRes] = await Promise.allSettled([
        userPetsAPI.list({}),
        adoptionAPI.getMyAdoptedPets(),
        petShopAPI.getMyPurchasedPets()
      ]);

      let allPets = [];
      
      if (ownedRes.status === 'fulfilled') {
        const userPets = Array.isArray(ownedRes.value.data?.data) 
          ? ownedRes.value.data.data 
          : (ownedRes.value.data?.data?.pets || []);
        userPets.forEach(pet => allPets.push(normalizePet({ ...pet, source: 'owned' })));
      }

      if (adoptedRes.status === 'fulfilled') {
        const adoptedPets = Array.isArray(adoptedRes.value.data?.data) 
          ? adoptedRes.value.data.data 
          : (adoptedRes.value.data?.data?.pets || []);
        adoptedPets.forEach(pet => allPets.push(normalizePet({ ...pet, source: 'adopted' })));
      }

      if (purchasedRes.status === 'fulfilled') {
        const responseData = purchasedRes.value.data?.data;
        const purchasedPets = Array.isArray(responseData) 
          ? responseData 
          : (responseData?.pets || []);
        purchasedPets.forEach(pet => allPets.push(normalizePet({ ...pet, source: 'purchased' })));
      }

      setPets(allPets);
    } catch (error) {
      console.error('Failed to load pets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots based on clinic's working hours and service duration
  const generateTimeSlots = (clinic, service, date) => {
    if (!clinic || !service || !date) return [];
    
    const selectedDateObj = new Date(date);
    const dayOfWeek = selectedDateObj.getDay();
    
    // Check if clinic works on this day
    if (!clinic.workingDays.includes(dayOfWeek)) {
      return [];
    }
    
    const slots = [];
    const [startHour, startMin] = clinic.workingHours.start.split(':').map(Number);
    const [endHour, endMin] = clinic.workingHours.end.split(':').map(Number);
    
    let currentTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    const slotDuration = service.duration;
    
    // Lunch break: 1:00 PM - 2:00 PM
    const lunchStart = 13 * 60;
    const lunchEnd = 14 * 60;
    
    while (currentTime + slotDuration <= endTime) {
      // Skip lunch break
      if (currentTime >= lunchStart && currentTime < lunchEnd) {
        currentTime = lunchEnd;
        continue;
      }
      
      // Skip if slot overlaps with lunch
      if (currentTime < lunchStart && currentTime + slotDuration > lunchStart) {
        currentTime = lunchEnd;
        continue;
      }
      
      const hours = Math.floor(currentTime / 60);
      const mins = currentTime % 60;
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      
      const timeString = `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
      const endTimeMinutes = currentTime + slotDuration;
      const endHours = Math.floor(endTimeMinutes / 60);
      const endMins = endTimeMinutes % 60;
      const endPeriod = endHours >= 12 ? 'PM' : 'AM';
      const displayEndHours = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours;
      const endTimeString = `${displayEndHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')} ${endPeriod}`;
      
      slots.push({
        startTime: timeString,
        endTime: endTimeString,
        display: `${timeString} - ${endTimeString}`,
        value: timeString
      });
      
      currentTime += 30; // Move to next 30-minute interval
    }
    
    return slots;
  };

  // Fetch available slots (combining API + local generation)
  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedService || !selectedClinic) {
      setAvailableSlots([]);
      return;
    }
    
    setLoadingSlots(true);
    try {
      // Generate slots based on clinic's schedule
      const generatedSlots = generateTimeSlots(selectedClinic, selectedService, selectedDate);
      
      // Try to get booked slots from API
      try {
        const response = await veterinaryAPI.getAvailableTimeSlots(selectedDate);
        if (response.data?.success) {
          const bookedSlots = response.data.data.bookedSlots || [];
          // Filter out booked slots
          const available = generatedSlots.filter(
            slot => !bookedSlots.includes(slot.value)
          );
          setAvailableSlots(available);
        } else {
          setAvailableSlots(generatedSlots);
        }
      } catch {
        // If API fails, use generated slots
        setAvailableSlots(generatedSlots);
      }
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (currentStep === 3) { // Changed from 4 to 3 since we removed doctor step
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedClinic, selectedService, currentStep]);

  // Get pet image
  const getPetImage = (pet) => {
    if (pet?.images?.length > 0) {
      const primary = pet.images.find(img => img.isPrimary);
      if (primary?.url) return primary.url;
      if (pet.images[0]?.url) return pet.images[0].url;
    }
    if (pet?.imageUrl) return pet.imageUrl;
    if (pet?.imageIds?.[0]?.url) return pet.imageIds[0].url;
    if (pet?.profileImage) return pet.profileImage;
    return '/placeholder-pet.svg';
  };

  // Get min date (today or tomorrow based on time)
  const getMinDate = () => {
    const now = new Date();
    // If it's past 4 PM, start from tomorrow
    if (now.getHours() >= 16) {
      now.setDate(now.getDate() + 1);
    }
    return now.toISOString().split('T')[0];
  };

  // Get max date (30 days ahead)
  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  // Check if selected date is valid for clinic
  const isClinicAvailable = (date) => {
    if (!selectedClinic || !date) return true;
    const dayOfWeek = new Date(date).getDay();
    return selectedClinic.workingDays.includes(dayOfWeek);
  };

  // Navigation
  const goToStep = (step) => {
    if (step < currentStep || canProceedToStep(step)) {
      setCurrentStep(step);
    }
  };

  const canProceedToStep = (step) => {
    switch (step) {
      case 2: return selectedPet !== null;
      case 3: return selectedPet !== null && selectedService !== null;
      case 4: return selectedPet !== null && selectedService !== null && 
                     selectedDate !== '' && selectedTimeSlot !== null;
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS && canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/user/veterinary');
    }
  };

  // Submit booking
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const bookingData = {
        petId: selectedPet.petCode || selectedPet._id, // Use petCode if available
        serviceId: selectedService._id,
        appointmentDate: selectedDate,
        timeSlot: selectedTimeSlot.value,
        reason: `${selectedService.name}${additionalNotes ? ' - ' + additionalNotes : ''}`,
        symptoms: symptoms || '',
        bookingType: selectedService.category === 'emergency' ? 'emergency' : 'routine',
        visitType: 'consultation'
      };
      
      console.log('Booking data:', bookingData);
      
      await veterinaryAPI.bookAppointment(bookingData);
      
      // Success - navigate to appointments
      navigate('/user/veterinary/appointments', {
        state: { 
          message: 'Appointment booked successfully!',
          appointmentDate: selectedDate,
          timeSlot: selectedTimeSlot.display
        }
      });
    } catch (error) {
      console.error('Failed to book appointment:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter pets
  const filteredPets = pets.filter(pet => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      pet.name?.toLowerCase().includes(search) ||
      pet.species?.toLowerCase().includes(search) ||
      pet.breed?.toLowerCase().includes(search)
    );
  });

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {currentStep === 1 ? 'Back to Veterinary' : 'Back'}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Book Veterinary Appointment</h1>
        <p className="mt-1 text-sm text-gray-600">
          Follow the steps to schedule an appointment for your pet
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {stepLabels.map((label, index) => {
            const stepNum = index + 1;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;
            const isClickable = canProceedToStep(stepNum) || stepNum < currentStep;
            
            return (
              <React.Fragment key={stepNum}>
                <div 
                  className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : ''}`}
                  onClick={() => isClickable && goToStep(stepNum)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    isCompleted ? 'bg-green-600 text-white' :
                    isActive ? 'bg-blue-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : stepNum}
                  </div>
                  <span className={`mt-2 text-xs font-medium hidden sm:block ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {label}
                  </span>
                </div>
                {index < stepLabels.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    currentStep > stepNum ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Step 1: Select Pet */}
        {currentStep === 1 && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Your Pet</h2>
            
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, species, or breed..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Pets List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading pets...</p>
              </div>
            ) : filteredPets.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="mt-2 text-gray-600">No pets found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredPets.map(pet => (
                  <div
                    key={pet._id}
                    onClick={() => {
                      setSelectedPet(pet);
                      handleNext();
                    }}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPet?._id === pet._id 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <img
                      src={getPetImage(pet)}
                      alt={pet.name}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => { e.target.src = '/placeholder-pet.svg'; }}
                    />
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-gray-900">{pet.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-600">{pet.species} • {pet.breed}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${pet.sourceBadge}`}>
                        {pet.sourceLabel}
                      </span>
                    </div>
                    {selectedPet?._id === pet._id && (
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Choose Service */}
        {currentStep === 2 && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Service</h2>
            <p className="text-sm text-gray-600 mb-4">Select the type of veterinary service you need</p>
            
            {loadingServices ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No services available</h3>
                <p className="mt-1 text-sm text-gray-500">No veterinary services have been added yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                {services.map(service => {
                  // Map category to icon
                  const categoryIcons = {
                    examination: '🩺',
                    vaccination: '💉',
                    surgery: '🏥',
                    dental: '🦷',
                    grooming: '✨',
                    emergency: '🚨',
                    consultation: '👨‍⚕️',
                    diagnostic: '🔬',
                    treatment: '💊'
                  };
                  const icon = categoryIcons[service.category] || '🏥';
                  
                  return (
                    <div
                      key={service._id}
                      onClick={() => {
                        setSelectedService(service);
                        handleNext();
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedService?._id === service._id 
                          ? 'border-blue-600 bg-blue-50' 
                          : service.category === 'emergency' 
                            ? 'border-red-200 hover:border-red-400 hover:bg-red-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          </div>
                        </div>
                        {selectedService?._id === service._id && (
                          <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {service.duration} mins
                        </span>
                        <span className="font-semibold text-gray-900">₹{service.price}</span>
                      </div>
                      {service.category && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {service.category}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Pick Date & Time */}
        {currentStep === 3 && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Time</h2>
            
            {/* Selected Info Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium">{selectedService?.name} ({selectedService?.duration} mins)</span>
              </div>
              {selectedClinic && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Clinic:</span>
                  <span className="font-medium">{selectedClinic.name}</span>
                </div>
              )}
            </div>
            
            {/* Date Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTimeSlot(null);
                }}
                min={getMinDate()}
                max={getMaxDate()}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  selectedDate && !isClinicAvailable(selectedDate) ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {selectedDate && !isClinicAvailable(selectedDate) && (
                <p className="mt-2 text-sm text-red-600">
                  The clinic is not available on this day. Please select another date.
                </p>
              )}
            </div>
            
            {/* Time Slots */}
            {selectedDate && isClinicAvailable(selectedDate) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Time Slots
                </label>
                
                {loadingSlots ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading available slots...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-gray-600">No available slots for this date</p>
                    <p className="text-sm text-gray-500">Try selecting a different date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                    {availableSlots.map(slot => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`py-3 px-4 border-2 rounded-lg text-sm font-medium transition-all ${
                          selectedTimeSlot?.value === slot.value
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {slot.display}
                      </button>
                    ))}
                  </div>
                )}
                
                {availableSlots.length > 0 && (
                  <p className="mt-3 text-xs text-gray-500">
                    {availableSlots.length} slot{availableSlots.length > 1 ? 's' : ''} available • Lunch break: 1:00 PM - 2:00 PM
                  </p>
                )}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNext}
                disabled={!selectedDate || !selectedTimeSlot}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {currentStep === 4 && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Confirm Appointment</h2>
            
            {/* Appointment Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
              <div className="flex items-center mb-4">
                <img
                  src={getPetImage(selectedPet)}
                  alt={selectedPet?.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                  onError={(e) => { e.target.src = '/placeholder-pet.svg'; }}
                />
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">{selectedPet?.name}</h3>
                  <p className="text-sm text-gray-600">{selectedPet?.species} • {selectedPet?.breed}</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-blue-100">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium text-gray-900">{selectedService?.name}</span>
                </div>
                {selectedClinic && (
                  <div className="flex justify-between py-2 border-b border-blue-100">
                    <span className="text-gray-600">Clinic</span>
                    <span className="font-medium text-gray-900">{selectedClinic.name}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-blue-100">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium text-gray-900">{formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-blue-100">
                  <span className="text-gray-600">Time</span>
                  <span className="font-medium text-gray-900">{selectedTimeSlot?.display}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-blue-100">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium text-gray-900">{selectedService?.duration} minutes</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Estimated Cost</span>
                  <span className="font-bold text-lg text-blue-600">₹{selectedService?.price}</span>
                </div>
              </div>
            </div>
            
            {/* Additional Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms / Health Concerns (Optional)
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe any symptoms or health concerns..."
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special requests or information..."
              />
            </div>
            
            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="ml-3 text-sm">
                  <p className="font-medium text-yellow-800">Important</p>
                  <p className="text-yellow-700 mt-1">
                    Please arrive 10 minutes before your appointment. Cancellations should be made at least 24 hours in advance.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Booking...
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
