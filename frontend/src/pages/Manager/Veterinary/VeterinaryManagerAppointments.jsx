import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerModuleLayout from '../../../components/Manager/ManagerModuleLayout';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryManagerAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    status: '',
    bookingType: '',
    date: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [acceptNotes, setAcceptNotes] = useState('');

  useEffect(() => {
    loadAppointments();
  }, [filter, currentPage]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        ...filter
      };
      
      const response = await veterinaryAPI.managerGetAppointments(params);
      setAppointments(response.data.data.appointments || []);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilter(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const getBookingTypeBadge = (bookingType) => {
    const badges = {
      emergency: { bg: 'bg-red-100', text: 'text-red-800', label: 'Emergency', icon: '🚨' },
      walkin: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Walk-in', icon: '🚶' },
      routine: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Routine', icon: '📅' }
    };
    const badge = badges[bookingType?.toLowerCase()] || badges.routine;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending_approval: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Pending', icon: '⏳' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed', icon: '✓' },
      in_consultation: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Consultation', icon: '👨‍⚕️' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed', icon: '✓' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled', icon: '✗' }
    };
    const badge = badges[status?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: '•' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: '💳' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid', icon: '✓' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed', icon: '✗' },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Refunded', icon: '↩' }
    };
    const badge = badges[paymentStatus?.toLowerCase()] || badges.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const handleAcceptAppointment = async () => {
    try {
      await veterinaryAPI.managerUpdateAppointment(selectedAppointment._id, {
        status: 'confirmed',
        notes: acceptNotes
      });
      setShowAcceptModal(false);
      setAcceptNotes('');
      setSelectedAppointment(null);
      loadAppointments();
      alert('Appointment confirmed successfully!');
    } catch (error) {
      console.error('Failed to accept appointment:', error);
      alert('Failed to confirm appointment');
    }
  };

  const handleDeclineAppointment = async () => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining');
      return;
    }
    try {
      await veterinaryAPI.managerUpdateAppointment(selectedAppointment._id, {
        status: 'declined',
        declineReason: declineReason
      });
      setShowDeclineModal(false);
      setDeclineReason('');
      setSelectedAppointment(null);
      loadAppointments();
      alert('Appointment declined');
    } catch (error) {
      console.error('Failed to decline appointment:', error);
      alert('Failed to decline appointment');
    }
  };

  const handleStartConsultation = (appointment) => {
    navigate(`/manager/veterinary/consultation/${appointment._id}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString || 'Not specified';
  };

  return (
    <ManagerModuleLayout
      title="Veterinary Appointments"
      subtitle="Manage and track all veterinary appointments"
    >
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending_approval">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_consultation">In Consultation</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Booking Type</label>
            <select
              value={filter.bookingType}
              onChange={(e) => handleFilterChange('bookingType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="routine">Routine</option>
              <option value="emergency">Emergency</option>
              <option value="walkin">Walk-in</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={filter.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Pet name, owner..."
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
          <p className="mt-1 text-sm text-gray-500">No appointments match your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pet & Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{appointment.appointmentNumber || appointment._id.slice(-6)}
                      </div>
                      {appointment.symptoms && (
                        <div className="text-xs text-gray-500 mt-1">
                          Symptoms: {appointment.symptoms.substring(0, 30)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.pet?.name || appointment.petId?.name || 'Unknown Pet'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.ownerId?.name || 'Unknown Owner'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {appointment.pet?.species || appointment.petId?.species || 'Unknown'} • {appointment.pet?.breed || appointment.petId?.breed || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {appointment.serviceId?.name || appointment.reason || 'General Checkup'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ₹{appointment.serviceId?.price || appointment.amount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(appointment.appointmentDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(appointment.timeSlot)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {getBookingTypeBadge(appointment.bookingType)}
                        {getStatusBadge(appointment.status)}
                        {getPaymentBadge(appointment.paymentStatus)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        {appointment.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowAcceptModal(true);
                              }}
                              className="text-green-600 hover:text-green-900 text-left"
                            >
                              ✓ Accept
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowDeclineModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 text-left"
                            >
                              ✗ Decline
                            </button>
                          </>
                        )}
                        {(appointment.status === 'confirmed' || appointment.status === 'scheduled') && (
                          <button
                            onClick={() => handleStartConsultation(appointment)}
                            className="text-blue-600 hover:text-blue-900 text-left"
                          >
                            👨‍⚕️ Start Consultation
                          </button>
                        )}
                        {appointment.status === 'in_consultation' && (
                          <button
                            onClick={() => handleStartConsultation(appointment)}
                            className="text-purple-600 hover:text-purple-900 text-left"
                          >
                            📋 Continue
                          </button>
                        )}
                        {appointment.status === 'completed' && (
                          <button
                            onClick={() => navigate(`/manager/veterinary/appointments/${appointment._id}`)}
                            className="text-gray-600 hover:text-gray-900 text-left"
                          >
                            👁️ View Details
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/manager/veterinary/appointments/${appointment._id}`)}
                          className="text-blue-600 hover:text-blue-900 text-left"
                        >
                          📄 Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Confirm Appointment
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">
                  Pet: <span className="font-medium text-gray-900">{selectedAppointment?.petId?.name}</span>
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Owner: <span className="font-medium text-gray-900">{selectedAppointment?.ownerId?.name}</span>
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Date: <span className="font-medium text-gray-900">{formatDate(selectedAppointment?.appointmentDate)} at {selectedAppointment?.timeSlot}</span>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={acceptNotes}
                  onChange={(e) => setAcceptNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special instructions or notes..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAcceptModal(false);
                    setAcceptNotes('');
                    setSelectedAppointment(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptAppointment}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Confirm Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Decline Appointment
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-4">
                  Please provide a reason for declining this appointment.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Explain why this appointment cannot be accepted..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeclineModal(false);
                    setDeclineReason('');
                    setSelectedAppointment(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeclineAppointment}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Decline Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ManagerModuleLayout>
  );
}
