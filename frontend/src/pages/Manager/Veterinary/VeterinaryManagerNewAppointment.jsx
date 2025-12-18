import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { veterinaryAPI, petsAPI, usersAPI } from '../../../services/api';

export default function VeterinaryManagerNewAppointment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState([]);
  const [owners, setOwners] = useState([]);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    petId: '',
    ownerId: '',
    serviceId: '',
    appointmentDate: '',
    timeSlot: '',
    reason: '',
    bookingType: 'routine',
    visitType: 'routine_checkup',
    symptoms: '',
    amount: 50
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load pets
      const petsResponse = await petsAPI.getPets({ limit: 100 });
      setPets(petsResponse.data.data.pets || []);
      
      // Load users (owners)
      const usersResponse = await usersAPI.getUsers({ limit: 100 });
      setOwners(usersResponse.data.data.users || []);
      
      // Load services
      const servicesResponse = await veterinaryAPI.managerGetServices();
      setServices(servicesResponse.data.data.services || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
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
    
    if (!formData.petId) newErrors.petId = 'Pet is required';
    if (!formData.ownerId) newErrors.ownerId = 'Owner is required';
    if (!formData.serviceId) newErrors.serviceId = 'Service is required';
    if (!formData.appointmentDate) newErrors.appointmentDate = 'Appointment date is required';
    if (!formData.timeSlot) newErrors.timeSlot = 'Time slot is required';
    if (!formData.reason) newErrors.reason = 'Reason is required';
    
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
      const response = await veterinaryAPI.managerCreateAppointment(formData);
      alert('Appointment created successfully!');
      navigate('/manager/veterinary/appointments');
    } catch (error) {
      console.error('Failed to create appointment:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Failed to create appointment: ${error.response.data.message}`);
      } else {
        alert('Failed to create appointment. Please try again.');
      }
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/manager/veterinary/appointments')}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Appointments
        </button>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Create New Appointment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new veterinary appointment for a pet
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          {/* Pet Selection */}
          <div className="sm:col-span-3">
            <label htmlFor="petId" className="block text-sm font-medium text-gray-700">
              Pet <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <select
                id="petId"
                name="petId"
                value={formData.petId}
                onChange={handleInputChange}
                className={`block w-full border ${errors.petId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              >
                <option value="">Select a pet</option>
                {pets.map(pet => (
                  <option key={pet._id} value={pet._id}>
                    {pet.name} ({pet.species} - {pet.breed})
                  </option>
                ))}
              </select>
              {errors.petId && <p className="mt-1 text-sm text-red-600">{errors.petId}</p>}
            </div>
          </div>

          {/* Owner Selection */}
          <div className="sm:col-span-3">
            <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">
              Owner <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <select
                id="ownerId"
                name="ownerId"
                value={formData.ownerId}
                onChange={handleInputChange}
                className={`block w-full border ${errors.ownerId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              >
                <option value="">Select an owner</option>
                {owners.map(owner => (
                  <option key={owner._id} value={owner._id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
              {errors.ownerId && <p className="mt-1 text-sm text-red-600">{errors.ownerId}</p>}
            </div>
          </div>

          {/* Service Selection */}
          <div className="sm:col-span-3">
            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700">
              Service <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <select
                id="serviceId"
                name="serviceId"
                value={formData.serviceId}
                onChange={handleInputChange}
                className={`block w-full border ${errors.serviceId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              >
                <option value="">Select a service</option>
                {services.map(service => (
                  <option key={service._id} value={service._id}>
                    {service.name} (${service.price})
                  </option>
                ))}
              </select>
              {errors.serviceId && <p className="mt-1 text-sm text-red-600">{errors.serviceId}</p>}
            </div>
          </div>

          {/* Booking Type */}
          <div className="sm:col-span-3">
            <label htmlFor="bookingType" className="block text-sm font-medium text-gray-700">
              Booking Type <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <select
                id="bookingType"
                name="bookingType"
                value={formData.bookingType}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="routine">Routine Appointment</option>
                <option value="emergency">Emergency</option>
                <option value="walkin">Walk-in</option>
              </select>
            </div>
          </div>

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

          {/* Appointment Date */}
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
                onChange={handleInputChange}
                className={`block w-full border ${errors.appointmentDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.appointmentDate && <p className="mt-1 text-sm text-red-600">{errors.appointmentDate}</p>}
            </div>
          </div>

          {/* Time Slot */}
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
                className={`block w-full border ${errors.timeSlot ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              >
                <option value="">Select a time slot</option>
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              {errors.timeSlot && <p className="mt-1 text-sm text-red-600">{errors.timeSlot}</p>}
            </div>
          </div>

          {/* Amount */}
          <div className="sm:col-span-3">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount ($) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="amount"
                id="amount"
                value={formData.amount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Reason */}
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
                placeholder="Describe the reason for the visit..."
                className={`block w-full border ${errors.reason ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
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
                placeholder="Describe any symptoms the pet is experiencing..."
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => navigate('/manager/veterinary/appointments')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}