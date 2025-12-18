import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';

export default function SimpleVeterinaryAppointmentDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    // Get selected pet from location state
    if (location.state && location.state.selectedPet) {
      setSelectedPet(location.state.selectedPet);
    }
    loadAppointment();
  }, [id, location]);

  const loadAppointment = async () => {
    setLoading(true);
    try {
      const response = await veterinaryAPI.getAppointmentById(id);
      setAppointment(response.data.data.appointment);
    } catch (error) {
      console.error('Failed to load appointment:', error);
      alert('Failed to load appointment details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await veterinaryAPI.cancelAppointment(id);
        alert('Appointment cancelled successfully.');
        // Navigate back to appointments page with pet data if available
        const state = selectedPet ? { selectedPet } : {};
        navigate('/user/veterinary/appointments', { state });
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
        alert('Failed to cancel appointment. Please try again.');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-yellow-100 text-yellow-800',
      pending_approval: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1).replace('_', ' ') || 'Unknown'}
      </span>
    );
  };

  const getBookingTypeBadge = (bookingType) => {
    const typeClasses = {
      emergency: 'bg-red-100 text-red-800',
      walkin: 'bg-yellow-100 text-yellow-800',
      routine: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeClasses[bookingType] || 'bg-gray-100 text-gray-800'}`}>
        {bookingType?.charAt(0).toUpperCase() + bookingType?.slice(1).replace('_', ' ') || 'Unknown'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Appointment not found</h3>
            <div className="mt-6">
              <button
                onClick={() => {
                  // Navigate back to appointments page with pet data if available
                  const state = selectedPet ? { selectedPet } : {};
                  navigate('/user/veterinary/appointments', { state });
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Appointments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => {
            // Navigate back to appointments page with pet data if available
            const state = selectedPet ? { selectedPet } : {};
            navigate('/user/veterinary/appointments', { state });
          }}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Appointments
        </button>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
          {appointment.status === 'scheduled' && (
            <button
              onClick={handleCancelAppointment}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Cancel Appointment
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        {/* Appointment Header */}
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {appointment.pet?.name || 'Unknown Pet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {appointment.storeName || 'Unknown Clinic'}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-2">
              {getBookingTypeBadge(appointment.bookingType)}
              {getStatusBadge(appointment.status)}
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Appointment Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{appointment.appointmentNumber || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Booking Type</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {appointment.bookingType?.charAt(0).toUpperCase() + appointment.bookingType?.slice(1).replace('_', ' ') || 'N/A'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {appointment.appointmentDate 
                  ? new Date(appointment.appointmentDate).toLocaleDateString() 
                  : 'Anytime'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Time</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {appointment.timeSlot || 'N/A'}
              </dd>
            </div>
            {appointment.visitType && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Visit Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {appointment.visitType?.replace('_', ' ') || 'N/A'}
                </dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Reason for Visit</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {appointment.reason || 'Not specified'}
              </dd>
            </div>
            {appointment.symptoms && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Symptoms</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {appointment.symptoms}
                </dd>
              </div>
            )}
            {appointment.isExistingCondition && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Existing Condition</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {appointment.existingConditionDetails || 'Not specified'}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Actions */}
        <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={() => {
                // Navigate back to appointments page with pet data if available
                const state = selectedPet ? { selectedPet } : {};
                navigate('/user/veterinary/appointments', { state });
              }}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Appointments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}