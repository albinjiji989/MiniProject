import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { veterinaryAPI } from '../../services/api';

export default function VeterinaryNewAppointment() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    petId: '',
    ownerId: '',
    serviceId: '',
    appointmentDate: '',
    timeSlot: '',
    reason: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
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

  const handleDateChange = async (e) => {
    const date = e.target.value;
    handleChange(e);
    
    if (date) {
      try {
        const response = await veterinaryAPI.managerGetAvailableTimeSlots(date);
        setAvailableSlots(response.data.data.availableSlots);
      } catch (error) {
        console.error('Failed to load available time slots:', error);
      }
    } else {
      setAvailableSlots([]);
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
      await veterinaryAPI.managerCreateAppointment(formData);
      navigate('/manager/veterinary/appointments');
    } catch (error) {
      console.error('Failed to create appointment:', error);
      // Handle error (show notification, etc.)
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="mt-2 text-2xl font-bold text-gray-900">New Appointment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new veterinary appointment
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
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
                <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">
                  Owner <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="ownerId"
                    id="ownerId"
                    value={formData.ownerId}
                    onChange={handleChange}
                    className={`block w-full border ${errors.ownerId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.ownerId && <p className="mt-1 text-sm text-red-600">{errors.ownerId}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700">
                  Service <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="serviceId"
                    name="serviceId"
                    value={formData.serviceId}
                    onChange={handleChange}
                    className={`block w-full border ${errors.serviceId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  >
                    <option value="">Select a service</option>
                    <option value="1">Routine Checkup</option>
                    <option value="2">Vaccination</option>
                    <option value="3">Surgery</option>
                    <option value="4">Dental Cleaning</option>
                    <option value="5">Emergency Consultation</option>
                  </select>
                  {errors.serviceId && <p className="mt-1 text-sm text-red-600">{errors.serviceId}</p>}
                </div>
              </div>

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
                    onChange={handleChange}
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
                    onChange={handleChange}
                    className={`block w-full border ${errors.reason ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
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
      </div>
    </div>
  );
}