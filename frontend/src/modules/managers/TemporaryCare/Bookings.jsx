import React, { useEffect, useState } from 'react';
import { temporaryCareAPI } from '../../../services/api';

const Bookings = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
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
      
      const response = await temporaryCareAPI.managerGetBookings(params);
      setApplications(response.data?.data?.bookings || response.data?.data || []);
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
      case 'submitted': return '#ff9800';
      case 'price_determined': return '#2196f3';
      case 'advance_paid': return '#9c27b0';
      case 'active_care': return '#4caf50';
      case 'completed': return '#607d8b';
      case 'cancelled': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'price_determined': return 'Price Set';
      case 'advance_paid': return 'Advance Paid';
      case 'active_care': return 'In Care';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading applications...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Applications / Bookings</h2>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4 }}
        >
          <option value="all">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="price_determined">Price Set</option>
          <option value="advance_paid">Advance Paid</option>
          <option value="active_care">In Care</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <div style={{ color: '#b00020', marginBottom: 16 }}>{error}</div>}

      {applications.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', background: '#f5f5f5', borderRadius: 8 }}>
          No applications found
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {applications.map(app => (
            <div key={app._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: 0 }}>{app.applicationNumber}</h4>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    Owner: {app.userId?.name || 'N/A'}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    Pets: {app.pets?.length || 0}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    {new Date(app.startDate).toLocaleDateString()} to {new Date(app.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: 4, 
                    background: getStatusColor(app.status), 
                    color: 'white', 
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {getStatusLabel(app.status)}
                  </span>
                  <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: 14 }}>
                    ₹{app.pricing?.totalAmount || 0}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  onClick={() => {
                    window.location.href = `/manager/temporary-care/applications/${app._id}`;
                  }}
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