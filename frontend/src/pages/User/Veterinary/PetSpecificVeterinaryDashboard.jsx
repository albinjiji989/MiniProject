import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';

export default function PetSpecificVeterinaryDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pet, setPet] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0
  });

  useEffect(() => {
    // Get selected pet from location state
    if (location.state && location.state.selectedPet) {
      const selectedPet = location.state.selectedPet;
      setPet(selectedPet);
      loadPetAppointments(selectedPet._id);
    } else {
      // If no pet is selected, redirect to pet selection
      navigate('/user/veterinary/select-pet');
    }
  }, [location]);

  const loadPetAppointments = async (petId) => {
    setLoading(true);
    try {
      // Load appointments for this specific pet
      const response = await veterinaryAPI.getAppointments({ petId });
      const appointmentsData = response.data.data.appointments || [];
      setAppointments(appointmentsData);
      
      // Calculate stats
      const total = appointmentsData.length;
      const scheduled = appointmentsData.filter(a => a.status === 'scheduled').length;
      const completed = appointmentsData.filter(a => a.status === 'completed').length;
      const cancelled = appointmentsData.filter(a => a.status === 'cancelled').length;
      
      setStats({
        total,
        scheduled,
        completed,
        cancelled
      });
    } catch (error) {
      console.error('Failed to load pet appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAppointment = (appointmentId) => {
    navigate(`/user/veterinary/appointments/${appointmentId}`, { state: { selectedPet: pet } });
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

  if (!pet) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/user/veterinary/select-pet')}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Select Different Pet
        </button>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Veterinary Care for {pet.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage veterinary appointments and medical records for {pet.name}
            </p>
          </div>
        </div>
      </div>

      {/* Pet Info Card */}
      <div className="mb-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Pet Information</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{pet.name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Species</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.species ? 
                  (typeof pet.species === 'string' ? pet.species : 
                   (pet.species.name || pet.species.displayName || 'Unknown Species')) : 
                  'Unknown Species'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Breed</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.breed ? 
                  (typeof pet.breed === 'string' ? pet.breed : 
                   (pet.breed.name || 'Unknown Breed')) : 
                  'Unknown Breed'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Age</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.age ? 
                  (typeof pet.age === 'number' ? `${pet.age} ${pet.ageUnit || 'years'}` :
                   (typeof pet.age === 'object' ? `${pet.age.years || pet.age.value || 0} years, ${pet.age.months || 0} months` :
                    'Unknown')) : 
                  'Unknown'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Appointments</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Scheduled</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.scheduled}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.completed}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cancelled</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.cancelled}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => navigate('/user/veterinary/book', { state: { selectedPet: pet } })}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Book Appointment
            </button>
            <button
              onClick={() => navigate('/user/veterinary/appointments', { state: { selectedPet: pet } })}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              View All Appointments
            </button>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Appointments for {pet.name}</h3>
          <p className="mt-1 text-sm text-gray-500">Most recent veterinary appointments for {pet.name}</p>
        </div>
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
              {pet.name} doesn't have any veterinary appointments yet.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/user/veterinary/book', { state: { selectedPet: pet } })}
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
            {appointments.slice(0, 5).map((appointment) => (
              <li key={appointment._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-lg">📅</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.storeName || 'Unknown Clinic'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Appointment #{appointment.appointmentNumber || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getBookingTypeBadge(appointment.bookingType)}
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:grid sm:grid-cols-2 sm:gap-4">
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
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => handleViewAppointment(appointment._id)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
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