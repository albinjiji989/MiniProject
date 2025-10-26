import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ManagerModuleLayout from '../../../components/Manager/ManagerModuleLayout';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryManagerAppointmentDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    if (id) {
      loadAppointment();
    }
  }, [id]);

  const loadAppointment = async () => {
    setLoading(true);
    try {
      const response = await veterinaryAPI.managerGetAppointmentById(id);
      setAppointment(response.data.data.appointment);
    } catch (error) {
      console.error('Failed to load appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await veterinaryAPI.managerUpdateAppointment(id, { status: newStatus });
      setAppointment(prev => ({ ...prev, status: newStatus }));
      alert(`Appointment status updated to ${newStatus}`);
      loadAppointment(); // Refresh the appointment data
    } catch (error) {
      console.error('Failed to update appointment status:', error);
      alert('Failed to update appointment status');
    } finally {
      setUpdating(false);
    }
  };

  const approveEmergencyAppointment = async () => {
    setUpdating(true);
    try {
      await veterinaryAPI.managerUpdateAppointment(id, { 
        emergencyApproved: true,
        status: 'scheduled'
      });
      alert('Emergency appointment approved');
      loadAppointment(); // Refresh the appointment data
    } catch (error) {
      console.error('Failed to approve emergency appointment:', error);
      alert('Failed to approve emergency appointment');
    } finally {
      setUpdating(false);
    }
  };

  const declineEmergencyAppointment = async () => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining the emergency appointment');
      return;
    }
    
    setUpdating(true);
    try {
      await veterinaryAPI.managerUpdateAppointment(id, { 
        emergencyDeclined: true,
        emergencyDeclineReason: declineReason,
        status: 'declined'
      });
      alert('Emergency appointment declined');
      setDeclineReason('');
      loadAppointment(); // Refresh the appointment data
    } catch (error) {
      console.error('Failed to decline emergency appointment:', error);
      alert('Failed to decline emergency appointment');
    } finally {
      setUpdating(false);
    }
  };

  const getVisitTypeLabel = (visitType) => {
    const types = {
      routine_checkup: 'Routine Checkup',
      vaccination: 'Vaccination',
      surgery: 'Surgery',
      emergency: 'Emergency',
      follow_up: 'Follow-up',
      consultation: 'Consultation',
      other: 'Other'
    };
    return types[visitType] || visitType;
  };

  const getBookingTypeLabel = (bookingType) => {
    const types = {
      routine: 'Scheduled',
      emergency: 'Emergency',
      walkin: 'Walk-in'
    };
    return types[bookingType] || bookingType;
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>;
      case 'confirmed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Confirmed</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">In Progress</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
      case 'pending_approval':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Pending Approval</span>;
      case 'declined':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Declined</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getBookingTypeBadge = (bookingType) => {
    switch (bookingType?.toLowerCase()) {
      case 'emergency':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Emergency</span>;
      case 'walkin':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Walk-in</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>;
    }
  };

  if (loading && !appointment) {
    return (
      <ManagerModuleLayout title="Appointment Details" subtitle="Loading appointment details...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </ManagerModuleLayout>
    );
  }

  if (!appointment) {
    return (
      <ManagerModuleLayout title="Appointment Details" subtitle="Appointment not found">
        <div className="bg-white shadow sm:rounded-lg p-6 text-center">
          <p className="text-gray-500">Appointment not found</p>
          <button
            onClick={() => navigate('/manager/veterinary/appointments')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Appointments
          </button>
        </div>
      </ManagerModuleLayout>
    );
  }

  return (
    <ManagerModuleLayout
      title="Appointment Details"
      subtitle={`Details for appointment with ${appointment.pet?.name}`}
      actions={[
        {
          label: 'Back to Appointments',
          onClick: () => navigate('/manager/veterinary/appointments')
        }
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Appointment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Emergency Approval Section */}
          {appointment.bookingType === 'emergency' && appointment.status === 'pending_approval' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-orange-800 mb-2">Emergency Appointment Review</h3>
              <p className="text-orange-700 mb-4">This is an emergency appointment that requires your approval.</p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-orange-700 mb-1">Emergency Reason</label>
                <p className="text-orange-800 bg-orange-100 p-3 rounded">{appointment.reason}</p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="declineReason" className="block text-sm font-medium text-orange-700 mb-1">
                  Decline Reason (if declining)
                </label>
                <textarea
                  id="declineReason"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={3}
                  className="block w-full border border-orange-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Enter reason for declining this emergency appointment..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={approveEmergencyAppointment}
                  disabled={updating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {updating ? 'Approving...' : 'Approve Emergency Appointment'}
                </button>
                <button
                  onClick={declineEmergencyAppointment}
                  disabled={updating || !declineReason.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {updating ? 'Declining...' : 'Decline Emergency Appointment'}
                </button>
              </div>
            </div>
          )}

          {/* Appointment Information */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Appointment Information</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Booking Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getBookingTypeBadge(appointment.bookingType)}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Visit Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getVisitTypeLabel(appointment.visitType)}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getStatusBadge(appointment.status)}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Appointment Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(appointment.appointmentDate).toLocaleDateString()}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Time Slot</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {appointment.timeSlot}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Reason for Visit</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {appointment.reason}
                  </dd>
                </div>
                {appointment.symptoms && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Symptoms</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {appointment.symptoms}
                    </dd>
                  </div>
                )}
                {appointment.isExistingCondition && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Existing Condition</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {appointment.existingConditionDetails}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Actions</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-wrap gap-3">
                {appointment.status === 'scheduled' && (
                  <button
                    onClick={() => updateAppointmentStatus('confirmed')}
                    disabled={updating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {updating ? 'Confirming...' : 'Confirm Appointment'}
                  </button>
                )}
                {appointment.status === 'confirmed' && (
                  <button
                    onClick={() => updateAppointmentStatus('in_progress')}
                    disabled={updating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    {updating ? 'Starting...' : 'Start Appointment'}
                  </button>
                )}
                {appointment.status === 'in_progress' && (
                  <button
                    onClick={() => updateAppointmentStatus('completed')}
                    disabled={updating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    {updating ? 'Completing...' : 'Complete Appointment'}
                  </button>
                )}
                {['scheduled', 'confirmed', 'pending_approval'].includes(appointment.status) && (
                  <button
                    onClick={() => updateAppointmentStatus('cancelled')}
                    disabled={updating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {updating ? 'Cancelling...' : 'Cancel Appointment'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar with Pet and Owner Information */}
        <div className="space-y-6">
          {/* Pet Information */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Pet Information</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">{appointment.pet?.name}</h4>
                  <p className="text-sm text-gray-500">
                    {appointment.pet?.breed || 'Unknown Breed'} • {appointment.pet?.species || 'Unknown Species'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Age</span>
                  <span className="text-sm text-gray-900">{appointment.pet?.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Weight</span>
                  <span className="text-sm text-gray-900">{appointment.pet?.weight} kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Owner Information</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Name</span>
                  <span className="text-sm text-gray-900">{appointment.owner?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <span className="text-sm text-gray-900">{appointment.owner?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Phone</span>
                  <span className="text-sm text-gray-900">{appointment.owner?.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ManagerModuleLayout>
  );
}