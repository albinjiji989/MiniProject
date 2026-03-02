import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { petsAPI, userPetsAPI, adoptionAPI, petShopAPI, veterinaryAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import UserLayout from '../../../components/Layout/UserLayout';

export default function ComprehensiveVeterinaryBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Select Pet, 2: Select Service, 3: Book Details
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all'); // all, adopted, purchased, owned
  
  const [selectedPet, setSelectedPet] = useState(null);
  const [bookingType, setBookingType] = useState('routine'); // routine, emergency, walkin
  const [formData, setFormData] = useState({
    appointmentDate: '',
    timeSlot: '',
    reason: '',
    visitType: 'routine_checkup',
    symptoms: '',
    isExistingCondition: false,
    existingConditionDetails: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Check if pet was passed from navigation state
    if (location.state?.selectedPet) {
      setSelectedPet(location.state.selectedPet);
      setStep(2);
    } else {
      loadAllPets();
    }
  }, [location.state]);

  const loadAllPets = async () => {
    setLoading(true);
    try {
      const [ownedRes, adoptedRes, purchasedRes] = await Promise.allSettled([
        userPetsAPI.list({}),
        adoptionAPI.getMyAdoptedPets(),
        petShopAPI.getMyPurchasedPets()
      ]);

      let allPets = [];
      
      // Process user-created pets
      if (ownedRes.status === 'fulfilled') {
        const userPets = Array.isArray(ownedRes.value.data?.data) 
          ? ownedRes.value.data.data 
          : (ownedRes.value.data?.data?.pets || []);
        userPets.forEach(pet => {
          allPets.push({
            ...pet,
            source: 'owned',
            sourceLabel: 'My Pet',
            sourceBadge: 'bg-purple-100 text-purple-800'
          });
        });
      }

      // Process adopted pets
      if (adoptedRes.status === 'fulfilled') {
        const adoptedPets = Array.isArray(adoptedRes.value.data?.data) 
          ? adoptedRes.value.data.data 
          : (adoptedRes.value.data?.data?.pets || []);
        adoptedPets.forEach(pet => {
          allPets.push({
            ...pet,
            source: 'adopted',
            sourceLabel: 'Adopted Pet',
            sourceBadge: 'bg-green-100 text-green-800'
          });
        });
      }

      // Process purchased pets
      if (purchasedRes.status === 'fulfilled') {
        const purchasedPets = Array.isArray(purchasedRes.value.data?.data) 
          ? purchasedRes.value.data.data 
          : (purchasedRes.value.data?.data?.pets || []);
        purchasedPets.forEach(pet => {
          allPets.push({
            ...pet,
            source: 'purchased',
            sourceLabel: 'Purchased Pet',
            sourceBadge: 'bg-blue-100 text-blue-800'
          });
        });
      }

      setPets(allPets);
    } catch (error) {
      console.error('Failed to load pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePetSelect = (pet) => {
    setSelectedPet(pet);
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (bookingType !== 'emergency' && !formData.appointmentDate) {
      newErrors.appointmentDate = 'Appointment date is required';
    }
    
    if (bookingType !== 'emergency' && !formData.timeSlot) {
      newErrors.timeSlot = 'Time slot is required';
    }
    
    if (!formData.reason) {
      newErrors.reason = 'Reason for visit is required';
    }
    
    if (formData.isExistingCondition && !formData.existingConditionDetails) {
      newErrors.existingConditionDetails = 'Please provide details about the existing condition';
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
      const bookingData = {
        petId: selectedPet._id,
        bookingType,
        ...formData
      };
      
      await veterinaryAPI.bookAppointment(bookingData);
      
      alert(bookingType === 'emergency' 
        ? 'Emergency appointment submitted for review. A manager will contact you shortly.'
        : 'Appointment booked successfully!');
      
      navigate('/user/veterinary/appointments');
    } catch (error) {
      console.error('Failed to book appointment:', error);
      alert(error.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPets = pets.filter(pet => {
    const matchesSource = filterSource === 'all' || pet.source === filterSource;
    const matchesSearch = !searchTerm || 
      pet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSource && matchesSearch;
  });

  const getPetImage = (pet) => {
    if (pet.images && pet.images.length > 0) {
      const primaryImage = pet.images.find(img => img.isPrimary);
      if (primaryImage) return primaryImage.url;
      return pet.images[0].url;
    }
    return '/placeholder-pet.svg';
  };

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM'
  ];

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => step === 1 ? navigate('/user/veterinary') : setStep(step - 1)}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Book Veterinary Appointment</h1>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 && 'Select a pet for veterinary care'}
            {step === 2 && 'Choose appointment type and details'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-24 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-2">
            <div className="text-xs text-gray-600 text-center" style={{ width: '200px' }}>
              <span className={step === 1 ? 'font-semibold' : ''}>Select Pet</span>
              <span className="mx-8"></span>
              <span className={step === 2 ? 'font-semibold' : ''}>Book Details</span>
            </div>
          </div>
        </div>

        {/* Step 1: Pet Selection */}
        {step === 1 && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Pets
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, species, breed..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Source
                  </label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Pets</option>
                    <option value="owned">My Pets</option>
                    <option value="adopted">Adopted Pets</option>
                    <option value="purchased">Purchased Pets</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading pets...</p>
                </div>
              ) : filteredPets.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pets found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || filterSource !== 'all' 
                      ? 'Try adjusting your filters'
                      : 'Add a pet to get started'}
                  </p>
                </div>
              ) : (
                filteredPets.map(pet => (
                  <div
                    key={pet._id}
                    onClick={() => handlePetSelect(pet)}
                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={getPetImage(pet)}
                      alt={pet.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => { e.target.src = '/placeholder-pet.svg'; }}
                    />
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${pet.sourceBadge}`}>
                          {pet.sourceLabel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {pet.species} • {pet.breed}
                      </p>
                      {pet.age && (
                        <p className="text-sm text-gray-500 mt-1">
                          Age: {pet.age} {pet.ageUnit || 'years'}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Booking Details */}
        {step === 2 && selectedPet && (
          <div>
            {/* Selected Pet Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center">
                <img
                  src={getPetImage(selectedPet)}
                  alt={selectedPet.name}
                  className="w-20 h-20 rounded-lg object-cover"
                  onError={(e) => { e.target.src = '/placeholder-pet.svg'; }}
                />
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedPet.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedPet.species} • {selectedPet.breed}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${selectedPet.sourceBadge}`}>
                    {selectedPet.sourceLabel}
                  </span>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change Pet
                </button>
              </div>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
              {/* Booking Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Appointment Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'routine', label: 'Routine Visit', desc: 'Schedule a regular checkup', icon: '📅' },
                    { value: 'emergency', label: 'Emergency', desc: 'Urgent medical attention needed', icon: '🚨' },
                    { value: 'walkin', label: 'Walk-in', desc: 'Visit without prior appointment', icon: '🚶' }
                  ].map(type => (
                    <div
                      key={type.value}
                      onClick={() => setBookingType(type.value)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        bookingType === type.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <h4 className="font-semibold text-gray-900">{type.label}</h4>
                      <p className="text-sm text-gray-600 mt-1">{type.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date and Time (not for emergency) */}
              {bookingType !== 'emergency' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="appointmentDate"
                      value={formData.appointmentDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                        errors.appointmentDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.appointmentDate && (
                      <p className="mt-1 text-sm text-red-500">{errors.appointmentDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Slot <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="timeSlot"
                      value={formData.timeSlot}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                        errors.timeSlot ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a time slot</option>
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    {errors.timeSlot && (
                      <p className="mt-1 text-sm text-red-500">{errors.timeSlot}</p>
                    )}
                  </div>
                </>
              )}

              {/* Visit Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="visitType"
                  value={formData.visitType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="routine_checkup">Routine Checkup</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="follow_up">Follow-up Visit</option>
                  <option value="consultation">Consultation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Visit <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.reason ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe the reason for this visit..."
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-500">{errors.reason}</p>
                )}
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms (if any)
                </label>
                <textarea
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe any symptoms you've observed..."
                />
              </div>

              {/* Existing Condition */}
              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name="isExistingCondition"
                    checked={formData.isExistingCondition}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">
                    This is related to an existing condition
                  </label>
                </div>
                {formData.isExistingCondition && (
                  <>
                    <textarea
                      name="existingConditionDetails"
                      value={formData.existingConditionDetails}
                      onChange={handleInputChange}
                      rows={2}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                        errors.existingConditionDetails ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Provide details about the existing condition..."
                    />
                    {errors.existingConditionDetails && (
                      <p className="mt-1 text-sm text-red-500">{errors.existingConditionDetails}</p>
                    )}
                  </>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
