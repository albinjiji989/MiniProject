import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await veterinaryAPI.getAppointments(params);
      setAppointments(response.data.data.appointments || []);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await veterinaryAPI.cancelAppointment(appointmentId);
        loadAppointments(); // Refresh the list
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
      }
    }
  };

  const handleViewAppointment = (appointmentId) => {
    navigate(`/user/veterinary/appointments/${appointmentId}`);
  };

  // Function to get the primary image URL or first image URL
  const getPetImageUrl = (pet) => {
    if (!pet || !pet.images || pet.images.length === 0) {
      return '/placeholder-pet.svg';
    }
    
    // Find primary image first
    const primaryImage = pet.images.find(img => img.isPrimary);
    if (primaryImage && primaryImage.url) {
      // Handle relative URLs
      if (primaryImage.url.startsWith('http') || primaryImage.url.startsWith('/')) {
        return primaryImage.url;
      }
      // For relative paths, prepend the API origin
      const apiOrigin = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${apiOrigin}${primaryImage.url.startsWith('/') ? '' : '/'}${primaryImage.url}`;
    }
    
    // Fallback to first image
    const firstImage = pet.images[0];
    if (firstImage && firstImage.url) {
      // Handle relative URLs
      if (firstImage.url.startsWith('http') || firstImage.url.startsWith('/')) {
        return firstImage.url;
      }
      // For relative paths, prepend the API origin
      const apiOrigin = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${apiOrigin}${firstImage.url.startsWith('/') ? '' : '/'}${firstImage.url}`;
    }
    
    return '/placeholder-pet.svg';
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
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
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
      <span className={`px-2 py-1 rounded text-xs font-medium ${typeClasses[bookingType] || 'bg-gray-100 text-gray-800'}`}>
        {bookingType?.charAt(0).toUpperCase() + bookingType?.slice(1).replace('_', ' ') || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <button
            onClick={() => navigate('/user/veterinary/book')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Book New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Appointments
            </button>
            <button
              onClick={() => setFilter('scheduled')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'scheduled'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'cancelled'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cancelled
            </button>
          </nav>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? "You don't have any veterinary appointments yet." 
                : `You don't have any ${filter} appointments.`}
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/user/veterinary/book')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Book Appointment
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <li key={appointment._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        {/* Display pet image or default icon */}
                        {appointment.pet?.images && appointment.pet.images.length > 0 ? (
                          <img 
                            src={getPetImageUrl(appointment.pet)} 
                            alt={appointment.pet.name}
                            className="h-12 w-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-pet.svg';
                            }}
                          />
                        ) : (
                          <span className="text-lg">📅</span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.pet?.name || 'Unknown Pet'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.storeName || 'Unknown Clinic'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getBookingTypeBadge(appointment.bookingType)}
                      {getStatusBadge(appointment.status)}
                      <button
                        onClick={() => handleViewAppointment(appointment._id)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        View
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Date & Time</div>
                      <div className="mt-1 text-sm text-gray-900">
                        {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'Anytime'}
                        {appointment.timeSlot ? ` at ${appointment.timeSlot}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Reason</div>
                      <div className="mt-1 text-sm text-gray-900">
                        {appointment.reason || 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Actions</div>
                      <div className="mt-1">
                        {appointment.status === 'scheduled' && (
                          <button
                            onClick={() => handleCancelAppointment(appointment._id)}
                            className="text-sm font-medium text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}