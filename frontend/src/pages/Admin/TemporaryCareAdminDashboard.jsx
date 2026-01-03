import React, { useEffect, useState } from 'react';
import { adminTemporaryCareAPI } from '../../services/api';

const TemporaryCareAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState([]);
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [careTypes, setCareTypes] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('centers');

  const loadData = async () => {
    try {
      setLoading(true);
      const [centersRes, statsRes, revenueRes, careTypesRes] = await Promise.all([
        adminTemporaryCareAPI.getCenters(),
        adminTemporaryCareAPI.getStats(),
        adminTemporaryCareAPI.getRevenueReport(),
        adminTemporaryCareAPI.getCareTypeDistribution()
      ]);

      setCenters(centersRes.data?.data?.centers || []);
      setStats(statsRes.data?.data || {});
      setRevenue(revenueRes.data?.data || {});
      setCareTypes(careTypesRes.data?.data || {});
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateCenterStatus = async (centerId, isActive) => {
    try {
      await adminTemporaryCareAPI.updateCenterStatus(centerId, { isActive });
      // Reload data
      await loadData();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update center status');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading temporary care admin dashboard...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Temporary Care Administration</h2>
      
      {error && <div style={{ color: '#b00020', marginBottom: 16 }}>{error}</div>}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('centers')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'centers' ? '#5b8cff' : '#f5f5f5',
            color: activeTab === 'centers' ? 'white' : '#333',
            cursor: 'pointer',
            borderBottom: activeTab === 'centers' ? '3px solid #5b8cff' : '3px solid transparent'
          }}
        >
          Centers
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'stats' ? '#5b8cff' : '#f5f5f5',
            color: activeTab === 'stats' ? 'white' : '#333',
            cursor: 'pointer',
            borderBottom: activeTab === 'stats' ? '3px solid #5b8cff' : '3px solid transparent'
          }}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'revenue' ? '#5b8cff' : '#f5f5f5',
            color: activeTab === 'revenue' ? 'white' : '#333',
            cursor: 'pointer',
            borderBottom: activeTab === 'revenue' ? '3px solid #5b8cff' : '3px solid transparent'
          }}
        >
          Revenue
        </button>
        <button
          onClick={() => setActiveTab('care-types')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'care-types' ? '#5b8cff' : '#f5f5f5',
            color: activeTab === 'care-types' ? 'white' : '#333',
            cursor: 'pointer',
            borderBottom: activeTab === 'care-types' ? '3px solid #5b8cff' : '3px solid transparent'
          }}
        >
          Care Types
        </button>
      </div>

      {/* Centers Tab */}
      {activeTab === 'centers' && (
        <div>
          <h3>Temporary Care Centers</h3>
          {centers.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', background: '#f5f5f5', borderRadius: 8 }}>
              No temporary care centers found
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {centers.map(center => (
                <div key={center._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{center.name || 'Unnamed Center'}</h4>
                      <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                        Store ID: {center.storeId}
                      </p>
                      <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                        Store Name: {center.storeName}
                      </p>
                      <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                        Capacity: {center.capacity?.total || 0} pets
                      </p>
                      <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                        Created: {new Date(center.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: 4, 
                        background: center.isActive ? '#4caf50' : '#f44336', 
                        color: 'white', 
                        fontSize: 12 
                      }}>
                        {center.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={() => updateCenterStatus(center._id, !center.isActive)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 4,
                            background: center.isActive ? '#f44336' : '#4caf50',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          {center.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <strong>Address:</strong><br />
                      {center.address?.addressLine1 || 'N/A'}<br />
                      {center.address?.city && `${center.address.city}, `}
                      {center.address?.state && `${center.address.state}, `}
                      {center.address?.zipCode && `${center.address.zipCode}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div>
          <h3>System Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: 0, color: '#666' }}>Total Centers</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '8px 0 0 0' }}>{stats?.totalCenters || 0}</p>
            </div>
            <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: 0, color: '#666' }}>Active Centers</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '8px 0 0 0' }}>{stats?.activeCenters || 0}</p>
            </div>
            <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: 0, color: '#666' }}>Total Care Records</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '8px 0 0 0' }}>{stats?.totalCareRecords || 0}</p>
            </div>
            <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: 0, color: '#666' }}>Active Care Records</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '8px 0 0 0' }}>{stats?.activeCareRecords || 0}</p>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
            <h4 style={{ margin: 0, color: '#666' }}>Care Status Distribution</h4>
            <div style={{ marginTop: 12 }}>
              {stats?.careStatusDistribution ? (
                Object.entries(stats.careStatusDistribution).map(([status, count]) => (
                  <div key={status} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{status.charAt(0).toUpperCase() + status.slice(1)}:</span>
                      <span>{count}</span>
                    </div>
                    <div style={{ height: 8, backgroundColor: '#ddd', borderRadius: 4 }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${(count / (stats.totalCareRecords || 1)) * 100}%`, 
                          backgroundColor: '#5b8cff', 
                          borderRadius: 4 
                        }} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p>No data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div>
          <h3>Revenue Reports</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: 0, color: '#666' }}>Total Revenue</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '8px 0 0 0' }}>
                ₹{revenue?.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
            <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: 0, color: '#666' }}>Total Payments</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '8px 0 0 0' }}>{revenue?.payments?.length || 0}</p>
            </div>
          </div>

          <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
            <h4 style={{ margin: 0, color: '#666' }}>Revenue by Store</h4>
            <div style={{ marginTop: 12 }}>
              {revenue?.revenueByStore ? (
                Object.entries(revenue.revenueByStore).map(([storeId, data]) => (
                  <div key={storeId} style={{ marginBottom: 12, padding: 12, backgroundColor: 'white', borderRadius: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: 4 }}>
                      <span>{data.storeName || storeId}</span>
                      <span>₹{data.amount?.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      {data.count} payments
                    </div>
                  </div>
                ))
              ) : (
                <p>No revenue data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Care Types Tab */}
      {activeTab === 'care-types' && (
        <div>
          <h3>Care Type Distribution</h3>
          <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
            {careTypes?.distribution ? (
              <div>
                {careTypes.distribution.map((item, index) => (
                  <div key={index} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{item._id?.charAt(0).toUpperCase() + item._id?.slice(1) || 'Unknown'}:</span>
                      <span>{item.count}</span>
                    </div>
                    <div style={{ height: 8, backgroundColor: '#ddd', borderRadius: 4 }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${(item.count / (careTypes.distribution.reduce((sum, i) => sum + i.count, 0) || 1)) * 100}%`, 
                          backgroundColor: '#5b8cff', 
                          borderRadius: 4 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No care type data available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemporaryCareAdminDashboard;