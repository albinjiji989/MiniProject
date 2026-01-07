import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, User, Clock, DollarSign, Star, Eye, XCircle, CheckCircle } from 'lucide-react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/api/temporary-care/user/bookings', { params });
      setBookings(response.data.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleCancelBooking = async (bookingId) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      await api.post(`/api/temporary-care/user/bookings/${bookingId}/cancel`, { reason });
      alert('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">View and manage your temporary care bookings</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: 'all', label: 'All' },
                { key: 'pending_payment', label: 'Pending Payment' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'in_progress', label: 'In Progress' },
                { key: 'completed', label: 'Completed' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No bookings found</p>
            <button
              onClick={() => navigate('/user/temporary-care/book')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Book Temporary Care
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">Booking #{booking.bookingNumber}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Created on {new Date(booking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{booking.pricing?.totalAmount?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Total Amount</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Pet</p>
                      <p className="font-medium">{booking.petId?.name}</p>
                      <p className="text-xs text-gray-500">{booking.petId?.species}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Service</p>
                      <p className="font-medium">{booking.serviceType?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{booking.serviceCategory}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium">
                        {new Date(booking.startDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        to {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium capitalize">{booking.location?.type.replace('_', ' ')}</p>
                      {booking.location?.facilityName && (
                        <p className="text-xs text-gray-500">{booking.location.facilityName}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="flex items-center gap-6 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-5 h-5 ${
                      booking.paymentStatus?.advance?.status === 'completed' ? 'text-green-500' : 'text-gray-300'
                    }`} />
                    <span className="text-sm">
                      Advance: ₹{booking.pricing?.advanceAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-5 h-5 ${
                      booking.paymentStatus?.final?.status === 'completed' ? 'text-green-500' : 'text-gray-300'
                    }`} />
                    <span className="text-sm">
                      Final: ₹{booking.pricing?.remainingAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/user/temporary-care/bookings/${booking._id}`)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>

                  {booking.status === 'pending_payment' && (
                    <button
                      onClick={() => navigate(`/user/temporary-care/payment/${booking._id}`)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Complete Payment
                    </button>
                  )}

                  {booking.status === 'completed' && !booking.review && (
                    <button
                      onClick={() => navigate(`/user/temporary-care/bookings/${booking._id}/review`)}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Write Review
                    </button>
                  )}

                  {['pending_payment', 'confirmed'].includes(booking.status) && (
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
