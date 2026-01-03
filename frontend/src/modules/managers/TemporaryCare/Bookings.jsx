import React, { useEffect, useState } from 'react';
import { temporaryCareAPI } from '../../../services/api';

const Bookings = () => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await temporaryCareAPI.getTemporaryCareByManager();
      setBookings(response.data?.data?.cares || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'active': return '#4caf50';
      case 'completed': return '#2196f3';
      case 'cancelled': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading bookings...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Bookings</h2>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4 }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <div style={{ color: '#b00020', marginBottom: 16 }}>{error}</div>}

      {bookings.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', background: '#f5f5f5', borderRadius: 8 }}>
          No bookings found
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {bookings.map(booking => (
            <div key={booking._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: 0 }}>{booking.pet?.name || 'Unnamed Pet'}</h4>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    Owner: {booking.owner?.userId?.name || 'N/A'}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    Caregiver: {booking.caregiver?.name || 'N/A'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: 4, 
                    background: getStatusColor(booking.status), 
                    color: 'white', 
                    fontSize: 12 
                  }}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                  <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 12 }}>
                    {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  onClick={() => setSelectedBooking(booking)}
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    background: '#eee', 
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 8,
            maxWidth: 600,
            width: '90%'
          }}>
            <h3 style={{ marginBottom: 16 }}>Booking Details</h3>
            <div style={{ marginBottom: 12 }}>
              <strong>Pet:</strong> {selectedBooking.pet?.name || 'N/A'}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Owner:</strong> {selectedBooking.owner?.userId?.name || 'N/A'}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Caregiver:</strong> {selectedBooking.caregiver?.name || 'N/A'}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Care Type:</strong> {selectedBooking.careType}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Status:</strong> {selectedBooking.status}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Period:</strong> {new Date(selectedBooking.startDate).toLocaleDateString()} - {new Date(selectedBooking.endDate).toLocaleDateString()}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Notes:</strong> {selectedBooking.notes}
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 4, 
                  background: '#f44336', 
                  color: 'white', 
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;