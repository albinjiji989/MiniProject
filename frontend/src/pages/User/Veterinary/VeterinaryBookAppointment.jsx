import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function VeterinaryBookAppointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingType, setBookingType] = useState('routine'); // routine, emergency, walkin
  const [selectedPet, setSelectedPet] = useState(null);
  const [formData, setFormData] = useState({
    petId: '',
    appointmentDate: '',
    timeSlot: '',
    reason: '',
    visitType: 'routine_checkup', // routine_checkup, vaccination, follow_up, consultation, other
    symptoms: '',
    isExistingCondition: false,
    existingConditionDetails: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Get selected pet from location state
    console.log('DEBUG: Location state:', location.state);
    if (location.state && location.state.selectedPet) {
      const pet = location.state.selectedPet;
      console.log('DEBUG: Selected pet:', pet);
      console.log('DEBUG: Pet ID:', pet._id);
      setSelectedPet(pet);
      setFormData(prev => ({
        ...prev,
        petId: pet._id
      }));
    }
  }, [location]);

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
    
    // Clear existing condition details when not an existing condition
    if (name === 'isExistingCondition' && !checked) {
      setFormData(prev => ({
        ...prev,
        existingConditionDetails: ''
      }));
    }
  };

  const handleDateChange = async (e) => {
    handleInputChange(e);
    
    if (e.target.value) {
      try {
        // In a real implementation, you would call an API to get available slots
        // For now, we'll simulate this
        const date = e.target.value;
        const slots = generateTimeSlots();
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Failed to load available time slots:', error);
      }
    } else {
      setAvailableSlots([]);
    }
  };

  // Generate sample time slots for demonstration
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}-${(minute === 30 ? hour : hour + 1).toString().padStart(2, '0')}:${(minute === 30 ? '00' : '30')}`;
        slots.push(timeSlot);
      }
    }
    
    return slots;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Pet is already selected from the veterinary session
    if (!selectedPet) newErrors.petId = 'Pet is required';
    
    // For routine and walk-in bookings, require date and time
    if (bookingType === 'routine' || bookingType === 'walkin') {
      if (!formData.appointmentDate) newErrors.appointmentDate = 'Appointment date is required';
      if (!formData.timeSlot) newErrors.timeSlot = 'Time slot is required';
    }
    
    // For emergency bookings, require detailed reason
    if (bookingType === 'emergency') {
      if (!formData.reason || formData.reason.trim().length < 10) {
        newErrors.reason = 'Emergency bookings require a detailed reason (minimum 10 characters)';
      }
    } else if (!formData.reason) {
      newErrors.reason = 'Reason is required';
    }
    
    // For existing conditions, require details
    if (formData.isExistingCondition && !formData.existingConditionDetails) {
      newErrors.existingConditionDetails = 'Please describe the existing condition';
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
      // Prepare data based on booking type
      const bookingData = {
        ...formData,
        bookingType: bookingType,
        visitType: formData.visitType,
        symptoms: formData.symptoms,
        isExistingCondition: formData.isExistingCondition,
        existingConditionDetails: formData.existingConditionDetails
      };
      
      // Debug: Log the data being sent
      console.log('DEBUG: Booking data being sent:', bookingData);
      console.log('DEBUG: Selected pet:', selectedPet);
      console.log('DEBUG: Pet ID from formData:', formData.petId);
      
      const response = await veterinaryAPI.bookAppointment(bookingData);
      
      // Show appropriate message based on booking type
      if (bookingType === 'emergency') {
        alert('Emergency appointment submitted for review. A manager will review your request.');
      } else {
        alert('Appointment booked successfully!');
      }
      
      navigate('/user/veterinary');
    } catch (error) {
      console.error('Failed to book appointment:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Failed to book appointment: ${error.response.data.message}`);
      } else {
        alert('Failed to book appointment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Book Appointment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Schedule a veterinary appointment for your pet
        </p>
      </div>

      {/* Booking Type Selection */}
      <div className="mb-6 bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Booking Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setBookingType('routine')}
            className={`p-4 border rounded-lg text-center ${
              bookingType === 'routine'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">Routine Appointment</div>
            <div className="text-sm text-gray-500 mt-1">Scheduled visit for regular checkups, vaccinations, etc.</div>
          </button>
          <button
            type="button"
            onClick={() => setBookingType('emergency')}
            className={`p-4 border rounded-lg text-center ${
              bookingType === 'emergency'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">Emergency</div>
            <div className="text-sm text-gray-500 mt-1">Urgent care for accidents, sudden illness, etc.</div>
          </button>
          <button
            type="button"
            onClick={() => setBookingType('walkin')}
            className={`p-4 border rounded-lg text-center ${
              bookingType === 'walkin'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">Walk-in</div>
            <div className="text-sm text-gray-500 mt-1">Visit without prior booking</div>
          </button>
        </div>
      </div>

      {/* Selected Pet */}
      {selectedPet && (
        <div className="mb-6 bg-white shadow sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Selected Pet for Appointment</h2>
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-lg font-medium text-gray-900">{selectedPet.name}</div>
              <div className="text-sm text-gray-500">{selectedPet.breed || 'Unknown Breed'} • {selectedPet.species || 'Unknown Species'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          {/* Visit Type */}
          <div className="sm:col-span-3">
            <label htmlFor="visitType" className="block text-sm font-medium text-gray-700">
              Visit Type
            </label>
            <div className="mt-1">
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
          </div>

          {/* Date and Time (only for routine and walk-in bookings) */}
          {(bookingType === 'routine' || bookingType === 'walkin') && (
            <>
              <div className="sm:col-span-3">
                <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">
                  Appointment Date <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="appointmentDate"
                    id="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`block w-full border ${errors.appointmentDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.appointmentDate && <p className="mt-1 text-sm text-red-600">{errors.appointmentDate}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700">
                  Time Slot <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="timeSlot"
                    name="timeSlot"
                    value={formData.timeSlot}
                    onChange={handleInputChange}
                    disabled={!formData.appointmentDate}
                    className={`block w-full border ${errors.timeSlot ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  >
                    <option value="">Select a time slot</option>
                    {availableSlots.map((slot, index) => (
                      <option key={index} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {errors.timeSlot && <p className="mt-1 text-sm text-red-600">{errors.timeSlot}</p>}
                  {!formData.appointmentDate && (
                    <p className="mt-1 text-sm text-gray-500">Please select a date first</p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="sm:col-span-6">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Reason for Visit <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <textarea
                id="reason"
                name="reason"
                rows={3}
                value={formData.reason}
                onChange={handleInputChange}
                placeholder={bookingType === 'emergency' 
                  ? "Describe the emergency situation in detail (minimum 10 characters)..." 
                  : "Describe the reason for your visit..."}
                className={`block w-full border ${errors.reason ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
              {bookingType === 'emergency' && (
                <p className="mt-1 text-sm text-gray-500">Emergency bookings require a detailed explanation of the situation.</p>
              )}
            </div>
          </div>
          
          {/* Symptoms */}
          <div className="sm:col-span-6">
            <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">
              Symptoms
            </label>
            <div className="mt-1">
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
          </div>
          
          {/* Existing Condition */}
          <div className="sm:col-span-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="isExistingCondition"
                  name="isExistingCondition"
                  type="checkbox"
                  checked={formData.isExistingCondition}
                  onChange={handleInputChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="isExistingCondition" className="font-medium text-gray-700">
                  Existing Medical Condition
                </label>
                <p className="text-gray-500">Check this if your pet has an existing medical condition related to this visit</p>
              </div>
            </div>
          </div>
          
          {/* Existing Condition Details */}
          {formData.isExistingCondition && (
            <div className="sm:col-span-6">
              <label htmlFor="existingConditionDetails" className="block text-sm font-medium text-gray-700">
                Existing Condition Details <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  id="existingConditionDetails"
                  name="existingConditionDetails"
                  rows={3}
                  value={formData.existingConditionDetails}
                  onChange={handleInputChange}
                  placeholder="Please describe the existing condition..."
                  className={`block w-full border ${errors.existingConditionDetails ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.existingConditionDetails && <p className="mt-1 text-sm text-red-600">{errors.existingConditionDetails}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/user/veterinary')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Booking...' : `Book ${bookingType === 'routine' ? 'Appointment' : bookingType === 'emergency' ? 'Emergency Visit' : 'Walk-in Visit'}`}
          </button>
        </div>
      </form>
    </div>
  );
}