import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { temporaryCareAPI } from '../../../services/api'

const TemporaryCareDashboard = () => {
  const navigate = useNavigate()
  const [activeCares, setActiveCares] = useState([])
  const [careHistory, setCareHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [activeResponse, historyResponse] = await Promise.all([
        temporaryCareAPI.getActiveCare(),
        temporaryCareAPI.getCareHistory()
      ])
      
      setActiveCares(activeResponse.data?.data?.items || [])
      setCareHistory(historyResponse.data?.data?.items || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationSuccess = (updatedCare) => {
    // Refresh the dashboard data
    loadDashboardData()
    // Show success message or navigate to details page
    navigate('/User/temporary-care')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800'
      case 'active': return '#4caf50'
      case 'completed': return '#2196f3'
      case 'cancelled': return '#f44336'
      default: return '#9e9e9e'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Temporary Care Dashboard</h2>
        <button 
          onClick={() => navigate('/User/temporary-care/request')}
          style={{ 
            padding: '10px 16px', 
            borderRadius: 8, 
            background: '#5b8cff', 
            color: 'white', 
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Request Temporary Care
        </button>
      </div>

      {error && <div style={{ color: '#b00020', marginBottom: 16 }}>{error}</div>}

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 16 }}>Active Care</h3>
        {activeCares.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', background: '#f5f5f5', borderRadius: 8 }}>
            No active temporary care records
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {activeCares.map(care => (
              <div key={care._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{care.pet?.name || 'Unnamed Pet'}</h4>
                    <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                      {care.storeName} ({care.storeId})
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: 4, 
                      background: getStatusColor(care.status), 
                      color: 'white', 
                      fontSize: 12 
                    }}>
                      {care.status.charAt(0).toUpperCase() + care.status.slice(1)}
                    </span>
                    <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 12 }}>
                      {formatDate(care.startDate)} - {formatDate(care.endDate)}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  {care.status === 'pending' && (
                    <Link 
                      to={`/User/temporary-care/drop-otp/${care._id}`}
                      state={{ onVerificationSuccess: handleVerificationSuccess }}
                      style={{ 
                        padding: '8px 12px', 
                        borderRadius: 6, 
                        background: '#4caf50', 
                        color: 'white', 
                        textDecoration: 'none',
                        fontSize: 14
                      }}
                    >
                      Drop-off OTP
                    </Link>
                  )}
                  
                  {care.status === 'active' && (
                    <Link 
                      to={`/User/temporary-care/pickup-otp/${care._id}`}
                      state={{ onVerificationSuccess: handleVerificationSuccess }}
                      style={{ 
                        padding: '8px 12px', 
                        borderRadius: 6, 
                        background: '#2196f3', 
                        color: 'white', 
                        textDecoration: 'none',
                        fontSize: 14
                      }}
                    >
                      Pickup OTP
                    </Link>
                  )}
                  
                  <Link 
                    to={`/User/temporary-care/${care._id}`}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: 6, 
                      background: '#eee', 
                      color: '#333', 
                      textDecoration: 'none',
                        fontSize: 14
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ marginBottom: 16 }}>Care History</h3>
        {careHistory.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', background: '#f5f5f5', borderRadius: 8 }}>
            No temporary care history
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {careHistory.map(care => (
              <div key={care._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{care.pet?.name || 'Unnamed Pet'}</h4>
                    <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                      {care.storeName} ({care.storeId})
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: 4, 
                      background: getStatusColor(care.status), 
                      color: 'white', 
                      fontSize: 12 
                    }}>
                      {care.status.charAt(0).toUpperCase() + care.status.slice(1)}
                    </span>
                    <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 12 }}>
                      {formatDate(care.startDate)} - {formatDate(care.endDate)}
                    </p>
                    {care.handover?.completedAt && (
                      <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 12 }}>
                        Completed: {formatTime(care.handover.completedAt)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div style={{ marginTop: 16 }}>
                  <Link 
                    to={`/User/temporary-care/${care._id}`}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: 6, 
                      background: '#eee', 
                      color: '#333', 
                      textDecoration: 'none',
                      fontSize: 14
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TemporaryCareDashboard