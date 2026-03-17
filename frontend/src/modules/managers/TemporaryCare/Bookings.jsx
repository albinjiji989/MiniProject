import React, { useEffect, useState } from 'react';
import api from '../../../services/api';

const Bookings = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      // Use the schedule endpoint as primary source since it works in dashboard
      try {
        const scheduleResponse = await api.get('/temporary-care/manager/schedule/today');
        const scheduleData = scheduleResponse.data?.data || {};
        
        // Combine all bookings from schedule
        const allBookings = [
          ...(scheduleData.checkIns || []),
          ...(scheduleData.checkOuts || []),
          ...(scheduleData.ongoing || [])
        ];
        
        console.log('🔍 Loaded applications from schedule endpoint:', allBookings);
        
        // If we have bookings from schedule, use them
        if (allBookings.length > 0) {
          // Filter by status if needed
          let filteredApplications = allBookings;
          if (statusFilter !== 'all') {
            filteredApplications = allBookings.filter(app => app.status === statusFilter);
          }
          
          setApplications(filteredApplications);
          return;
        }
        
        // If no bookings from schedule, try other endpoints
        console.log('No bookings from schedule, trying other endpoints...');
      } catch (scheduleError) {
        console.log('Schedule endpoint failed:', scheduleError.response?.data?.message);
      }
      
      // Try the regular applications endpoint
      try {
        const response = await api.get('/temporary-care/manager/applications');
        const allApplications = response.data?.data?.applications || [];
        
        // Filter by status if needed
        let filteredApplications = allApplications;
        if (statusFilter !== 'all') {
          filteredApplications = allApplications.filter(app => app.status === statusFilter);
        }
        
        setApplications(filteredApplications);
        console.log('🔍 Loaded applications from regular endpoint:', filteredApplications);
        return;
      } catch (regularError) {
        console.log('Regular endpoint failed:', regularError.response?.data?.message);
        
        // Final fallback to debug endpoint
        try {
          const debugResponse = await api.get('/temporary-care/manager/debug/all-applications');
          const allApplications = debugResponse.data?.data?.applications || [];
          
          // Filter by status if needed
          let filteredApplications = allApplications;
          if (statusFilter !== 'all') {
            filteredApplications = allApplications.filter(app => app.status === statusFilter);
          }
          
          setApplications(filteredApplications);
          console.log('🔍 Loaded applications from debug endpoint:', filteredApplications);
          return;
        } catch (debugError) {
          console.log('Debug endpoint also failed:', debugError.response?.data?.message);
          throw regularError; // Throw the original error
        }
      }
    } catch (e) {
      console.error('Error loading applications:', e);
      setError(e?.response?.data?.message || 'Failed to load applications. Manager may need to set up a temporary care center first.');
    } finally {
      setLoading(false);
    }
  };

  const generatePickupOTP = async (application) => {
    try {
      if (application.isFromApplication) {
        // For TemporaryCareApplication system
        const response = await api.post(`/temporary-care/manager/applications/${application._id}/pickup/generate-otp`);
        
        // Show success message
        const otpData = response.data.data;
        const message = `✅ Pickup OTP Generated Successfully!\n\n📧 Email sent to: ${application.userId?.email}\n🔢 OTP: ${otpData.otp}\n⏰ Expires: ${new Date(otpData.expiresAt).toLocaleString()}\n\nRedirecting to OTP entry page...`;
        
        alert(message);
        
        // Navigate to OTP entry page
        window.location.href = `/manager/temporary-care/otp-entry/${application._id}`;
      } else {
        // For CareBooking system
        const response = await api.post(`/temporary-care/manager/bookings-new/${application._id}/pickup/generate-otp`);
        alert(`✅ Pickup OTP generated and sent to ${application.userId?.email}!\nOTP: ${response.data.data.otp}`);
      }
      loadBookings(); // Refresh the list
    } catch (error) {
      alert('❌ Failed to generate OTP: ' + (error.response?.data?.message || 'Please try again'));
    }
  };

  const resendPickupOTP = async (application) => {
    try {
      if (application.isFromApplication) {
        // For TemporaryCareApplication system
        const response = await api.post(`/temporary-care/manager/applications/${application._id}/pickup/resend-otp`);
        alert(`✅ Pickup OTP resent to ${application.userId?.email}!\nOTP: ${response.data.data.otp}`);
      } else {
        // For CareBooking system
        const response = await api.post(`/temporary-care/manager/bookings-new/${application._id}/pickup/resend-otp`);
        alert(`✅ Pickup OTP resent to ${application.userId?.email}!\nOTP: ${response.data.data.otp}`);
      }
    } catch (error) {
      alert('❌ Failed to resend OTP: ' + (error.response?.data?.message || 'Please try again'));
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={async () => {
              try {
                const response = await api.get('/temporary-care/manager/me/center');
                alert('Center Status: ' + JSON.stringify(response.data, null, 2));
              } catch (error) {
                if (error.response?.status === 404) {
                  const createCenter = confirm('No center found. Would you like to create one?');
                  if (createCenter) {
                    try {
                      const centerName = prompt('Enter center name:', 'My Temporary Care Center');
                      if (centerName) {
                        await api.post('/temporary-care/manager/me/center', {
                          name: centerName,
                          capacity: { total: 10 }
                        });
                        alert('Center created successfully!');
                        loadBookings(); // Refresh
                      }
                    } catch (createError) {
                      alert('Failed to create center: ' + (createError.response?.data?.message || createError.message));
                    }
                  }
                } else {
                  alert('Center Error: ' + (error.response?.data?.message || error.message));
                }
              }
            }}
            style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4, background: '#f8f9fa', fontSize: 12 }}
          >
            Check/Create Center
          </button>
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
      </div>

      {error && (
        <div style={{ color: '#b00020', marginBottom: 16, padding: 16, background: '#ffebee', borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Error Loading Applications</h4>
          <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', fontSize: 12, color: '#666' }}>Debug Information</summary>
            <div style={{ marginTop: 8, fontSize: 12, fontFamily: 'monospace', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
              <p>Attempted endpoints:</p>
              <ul>
                <li>GET /api/temporary-care/manager/schedule/today</li>
                <li>GET /api/temporary-care/manager/applications</li>
                <li>GET /api/temporary-care/manager/debug/all-applications</li>
              </ul>
              <p>Current user role: {localStorage.getItem('userRole') || 'Unknown'}</p>
              <p>Auth token exists: {!!localStorage.getItem('token')}</p>
            </div>
          </details>
        </div>
      )}

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
                  <h4 style={{ margin: 0 }}>{app.bookingNumber}</h4>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    Owner: {app.userId?.name || 'N/A'} ({app.userId?.email})
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    Pet: {app.petId?.name || 'Unknown'} ({app.petId?.breed || 'Unknown breed'})
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    {new Date(app.startDate).toLocaleDateString()} to {new Date(app.endDate).toLocaleDateString()}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    Advance: {app.paymentStatus?.advance?.status || 'pending'} | 
                    Final: {app.paymentStatus?.final?.status || 'pending'}
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
                  {app.isFromApplication && (
                    <div style={{ marginTop: 4 }}>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: 3, 
                        background: '#2196f3', 
                        color: 'white', 
                        fontSize: 10
                      }}>
                        Application System
                      </span>
                    </div>
                  )}
                  <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: 14 }}>
                    ₹{app.pricing?.totalAmount || 0}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
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
                
                {app.paymentStatus?.final?.status === 'completed' && !app.handover?.pickup?.otpUsed && (
                  <button
                    onClick={() => generatePickupOTP(app)}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: 6, 
                      background: '#ff9800', 
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    {app.handover?.pickup?.otp ? 'Enter OTP' : 'Generate Pickup OTP'}
                  </button>
                )}
                
                {app.handover?.pickup?.otp && !app.handover?.pickup?.otpUsed && (
                  <button
                    onClick={() => resendPickupOTP(app)}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: 6, 
                      background: '#2196f3', 
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    Resend OTP
                  </button>
                )}
                
                {app.handover?.pickup?.otpUsed && (
                  <span style={{ 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    background: '#4caf50', 
                    color: 'white',
                    fontSize: 14
                  }}>
                    ✅ Completed
                  </span>
                )}
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