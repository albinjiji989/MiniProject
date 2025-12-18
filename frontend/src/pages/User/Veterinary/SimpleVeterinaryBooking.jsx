import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function SimpleVeterinaryBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({
    petId: '',
    bookingType: 'routine', // routine, emergency, walkin
    appointmentDate: '',
    timeSlot: '',
    reason: '',
    symptoms: '',
    visitType: 'routine_checkup'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Get selected pet from location state
    if (location.state && location.state.selectedPet) {
      const pet = location.state.selectedPet;
      // Debug: Log the pet object to see its structure
      console.log('Selected pet object:', pet);
      setSelectedPet(pet);
      setFormData(prev => ({
        ...prev,
        petId: pet._id
      }));
    } else {
      // If no pet is selected, redirect to pet selection
      navigate('/user/veterinary/select-pet');
    }
  }, [location]);

  // Generate time slots (9 AM to 5 PM in 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) continue; // Don't include 5:30 PM
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  // Get date constraints based on booking type
  const getDateConstraints = (type) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (type) {
      case 'emergency':
        return { min: null, max: null };
      case 'routine':
        // 1 day to 1 week in advance
        const minRoutine = new Date(today);
        minRoutine.setDate(minRoutine.getDate() + 1);
        const maxRoutine = new Date(today);
        maxRoutine.setDate(maxRoutine.getDate() + 7);
        return { 
          min: minRoutine.toISOString().split('T')[0],
          max: maxRoutine.toISOString().split('T')[0]
        };
      case 'walkin':
        // Today or tomorrow only (not yesterday)
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { 
          min: today.toISOString().split('T')[0],
          max: tomorrow.toISOString().split('T')[0]
        };
      default:
        return { min: null, max: null };
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
    
    // If changing booking type, reset date and time
    if (name === 'bookingType') {
      setFormData(prev => ({
        ...prev,
        appointmentDate: '',
        timeSlot: '',
        visitType: value === 'emergency' ? '' : 'routine_checkup'
      }));
      setAvailableSlots([]);
    }
    
    // If changing date, generate time slots
    if (name === 'appointmentDate' && value) {
      setAvailableSlots(generateTimeSlots());
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Pet is required
    if (!selectedPet || typeof selectedPet !== 'object') {
      newErrors.petId = 'Valid pet is required';
    }
    
    // Reason is always required
    if (!formData.reason || typeof formData.reason !== 'string' || !formData.reason.trim()) {
      newErrors.reason = 'Reason for visit is required';
    }
    
    // For emergency, require detailed reason
    if (formData.bookingType === 'emergency' && (typeof formData.reason !== 'string' || formData.reason.trim().length < 10)) {
      newErrors.reason = 'Emergency visits require a detailed reason (minimum 10 characters)';
    }
    
    // For routine and walk-in, require date and time
    if (formData.bookingType === 'routine' || formData.bookingType === 'walkin') {
      if (!formData.appointmentDate || typeof formData.appointmentDate !== 'string') {
        newErrors.appointmentDate = 'Appointment date is required';
      }
      if (!formData.timeSlot || typeof formData.timeSlot !== 'string') {
        newErrors.timeSlot = 'Time slot is required';
      }
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
      // Prepare data for submission
      const bookingData = {
        petId: typeof formData.petId === 'string' ? formData.petId : '',
        bookingType: typeof formData.bookingType === 'string' ? formData.bookingType : 'routine',
        reason: typeof formData.reason === 'string' ? formData.reason : '',
        symptoms: typeof formData.symptoms === 'string' ? formData.symptoms : ''
      };
      
      // Add date and time for routine/walk-in appointments
      if ((formData.bookingType === 'routine' || formData.bookingType === 'walkin') && 
          typeof formData.appointmentDate === 'string' && 
          typeof formData.timeSlot === 'string') {
        bookingData.appointmentDate = formData.appointmentDate;
        bookingData.timeSlot = formData.timeSlot;
        bookingData.visitType = typeof formData.visitType === 'string' ? formData.visitType : 'routine_checkup';
      }
      
      // Debug: Log the data being sent
      console.log('Booking data being sent:', bookingData);
      
      const response = await veterinaryAPI.bookAppointment(bookingData);
      
      // Show appropriate message
      if (formData.bookingType === 'emergency') {
        alert('Emergency appointment submitted for review. A veterinarian will contact you shortly.');
      } else {
        alert('Appointment booked successfully!');
      }
      
      // Navigate back to the pet-specific dashboard
      navigate('/user/veterinary/pet-dashboard', { state: { selectedPet } });
    } catch (error) {
      console.error('Failed to book appointment:', error);
      alert(error.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { min, max } = getDateConstraints(formData.bookingType);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => {
            // Navigate back to the pet-specific dashboard
            if (selectedPet) {
              navigate('/user/veterinary/pet-dashboard', { state: { selectedPet } });
            } else {
              navigate('/user/veterinary');
            }
          }}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Veterinary
        </button>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Book Veterinary Appointment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Schedule a veterinary appointment for your pet
        </p>
      </div>

      {/* Selected Pet */}
      {selectedPet && typeof selectedPet === 'object' && (
        <div className="mb-6 bg-white shadow sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Selected Pet</h2>
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-lg">🐾</span>
            </div>
            <div className="ml-4">
              <div className="text-lg font-medium text-gray-900">{typeof selectedPet.name === 'string' ? selectedPet.name : 'Unknown Pet'}</div>
              <div className="text-sm text-gray-500">{typeof selectedPet.breed === 'string' ? selectedPet.breed : 'Unknown Breed'} • {typeof selectedPet.species === 'string' ? selectedPet.species : 'Unknown Species'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6">
        {/* Booking Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Appointment Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => handleInputChange({ target: { name: 'bookingType', value: 'routine' } })}
              className={`p-4 border rounded-lg text-center ${
                formData.bookingType === 'routine'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-blue-700">Routine Checkup</div>
              <div className="text-sm text-gray-500 mt-1">Scheduled visit (1-7 days advance)</div>
            </button>
            <button
              type="button"
              onClick={() => handleInputChange({ target: { name: 'bookingType', value: 'walkin' } })}
              className={`p-4 border rounded-lg text-center ${
                formData.bookingType === 'walkin'
                  ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-yellow-700">Walk-in</div>
              <div className="text-sm text-gray-500 mt-1">Visit without booking (Today/tomorrow)</div>
            </button>
            <button
              type="button"
              onClick={() => handleInputChange({ target: { name: 'bookingType', value: 'emergency' } })}
              className={`p-4 border rounded-lg text-center ${
                formData.bookingType === 'emergency'
                  ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-red-700">Emergency</div>
              <div className="text-sm text-gray-500 mt-1">Urgent care (24/7 availability)</div>
            </button>
          </div>
        </div>

        {/* Visit Type (for routine and walk-in only) */}
        {(formData.bookingType === 'routine' || formData.bookingType === 'walkin') && (
          <div className="mb-6">
            <label htmlFor="visitType" className="block text-sm font-medium text-gray-700 mb-1">
              Visit Type <span className="text-red-500">*</span>
            </label>
            <select
              id="visitType"
              name="visitType"
              value={formData.visitType}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="routine_checkup">Routine Checkup</option>
              <option value="vaccination">Vaccination</option>
              <option value="follow_up">Follow-up</option>
              <option value="consultation">Consultation</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {/* Date and Time (for routine and walk-in only) */}
        {(formData.bookingType === 'routine' || formData.bookingType === 'walkin') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="appointmentDate"
                id="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleInputChange}
                min={min}
                max={max}
                className={`block w-full border ${errors.appointmentDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.appointmentDate && <p className="mt-1 text-sm text-red-600">{errors.appointmentDate}</p>}
              <p className="mt-1 text-sm text-gray-500">
                {formData.bookingType === 'routine' 
                  ? 'Book 1-7 days in advance' 
                  : 'Today or tomorrow only'}
              </p>
            </div>

            <div>
              <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700 mb-1">
                Time Slot <span className="text-red-500">*</span>
              </label>
              <select
                id="timeSlot"
                name="timeSlot"
                value={formData.timeSlot}
                onChange={handleInputChange}
                disabled={!formData.appointmentDate}
                className={`block w-full border ${errors.timeSlot ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              >
                <option value="">Select a time</option>
                {availableSlots && Array.isArray(availableSlots) && availableSlots.map((slot, index) => (
                  <option key={index} value={typeof slot === 'string' ? slot : ''}>
                    {typeof slot === 'string' ? slot : 'Invalid slot'}
                  </option>
                ))}
              </select>
              {errors.timeSlot && <p className="mt-1 text-sm text-red-600">{errors.timeSlot}</p>}
              {!formData.appointmentDate && (
                <p className="mt-1 text-sm text-gray-500">Please select a date first</p>
              )}
            </div>
          </div>
        )}

        {/* Reason for Visit */}
        <div className="mb-6">
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Visit <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={4}
            value={formData.reason}
            onChange={handleInputChange}
            placeholder={formData.bookingType === 'emergency' 
              ? "Describe the emergency situation in detail (minimum 10 characters)..." 
              : "Describe the reason for your visit..."}
            className={`block w-full border ${errors.reason ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
          />
          {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
          {formData.bookingType === 'emergency' && (
            <p className="mt-1 text-sm text-gray-500">Emergency bookings require a detailed explanation of the situation.</p>
          )}
        </div>

        {/* Symptoms (optional for all types) */}
        <div className="mb-6">
          <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">
            Symptoms (if any)
          </label>
          <textarea
            id="symptoms"
            name="symptoms"
            rows={3}
            value={formData.symptoms}
            onChange={handleInputChange}
            placeholder="Describe any symptoms your pet is experiencing..."
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              // Navigate back to the pet-specific dashboard
              if (selectedPet) {
                navigate('/user/veterinary/pet-dashboard', { state: { selectedPet } });
              } else {
                navigate('/user/veterinary');
              }
            }}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Booking...' : `Book ${formData.bookingType === 'emergency' ? 'Emergency' : formData.bookingType === 'walkin' ? 'Walk-in' : 'Routine'} Appointment`}
          </button>
        </div>
      </form>
    </div>
  );
}